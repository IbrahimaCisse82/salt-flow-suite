
-- journal_entries.account_name
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS account_name TEXT;

-- sales.amount_paid (alias)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sales' AND column_name='amount_paid') THEN
    ALTER TABLE public.sales ADD COLUMN amount_paid NUMERIC GENERATED ALWAYS AS (total_paid) STORED;
  END IF;
END $$;

-- RPC: balance générale
CREATE OR REPLACE FUNCTION public.generate_trial_balance(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  account_number TEXT,
  account_name TEXT,
  total_debit NUMERIC,
  total_credit NUMERIC,
  balance NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _tenant UUID;
BEGIN
  _tenant := get_user_tenant_id(auth.uid());
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant introuvable';
  END IF;

  RETURN QUERY
  SELECT
    coa.account_number,
    coa.account_name,
    COALESCE(SUM(je.debit), 0) AS total_debit,
    COALESCE(SUM(je.credit), 0) AS total_credit,
    COALESCE(SUM(je.debit), 0) - COALESCE(SUM(je.credit), 0) AS balance
  FROM public.chart_of_accounts coa
  LEFT JOIN public.journal_entries je
    ON je.account_id = coa.id
   AND je.tenant_id = _tenant
   AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
   AND (p_end_date IS NULL OR je.entry_date <= p_end_date)
  WHERE coa.tenant_id = _tenant
  GROUP BY coa.account_number, coa.account_name
  HAVING COALESCE(SUM(je.debit), 0) <> 0 OR COALESCE(SUM(je.credit), 0) <> 0
  ORDER BY coa.account_number;
END;
$$;
