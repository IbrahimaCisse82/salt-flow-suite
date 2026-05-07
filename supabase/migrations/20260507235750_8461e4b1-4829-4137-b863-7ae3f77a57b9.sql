
DROP FUNCTION IF EXISTS public.generate_trial_balance(DATE, DATE);
DROP FUNCTION IF EXISTS public.generate_trial_balance(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION public.generate_trial_balance(
  p_tenant_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  account_number TEXT,
  account_name TEXT,
  account_type TEXT,
  opening_balance NUMERIC,
  period_debit NUMERIC,
  period_credit NUMERIC,
  closing_balance NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _tenant UUID;
BEGIN
  _tenant := COALESCE(p_tenant_id, get_user_tenant_id(auth.uid()));
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant introuvable';
  END IF;
  -- Vérification d'appartenance
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR _tenant = get_user_tenant_id(auth.uid())) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN QUERY
  WITH opening AS (
    SELECT je.account_id,
           COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0) AS opening_bal
    FROM public.journal_entries je
    WHERE je.tenant_id = _tenant
      AND (p_start_date IS NULL OR je.entry_date < p_start_date)
    GROUP BY je.account_id
  ),
  period AS (
    SELECT je.account_id,
           COALESCE(SUM(je.debit),0) AS pd,
           COALESCE(SUM(je.credit),0) AS pc
    FROM public.journal_entries je
    WHERE je.tenant_id = _tenant
      AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
      AND (p_end_date IS NULL OR je.entry_date <= p_end_date)
    GROUP BY je.account_id
  )
  SELECT
    coa.account_number,
    coa.account_name,
    coa.account_type::text,
    COALESCE(o.opening_bal, 0) AS opening_balance,
    COALESCE(p.pd, 0) AS period_debit,
    COALESCE(p.pc, 0) AS period_credit,
    COALESCE(o.opening_bal, 0) + COALESCE(p.pd, 0) - COALESCE(p.pc, 0) AS closing_balance
  FROM public.chart_of_accounts coa
  LEFT JOIN opening o ON o.account_id = coa.id
  LEFT JOIN period  p ON p.account_id = coa.id
  WHERE coa.tenant_id = _tenant
    AND (COALESCE(o.opening_bal,0) <> 0 OR COALESCE(p.pd,0) <> 0 OR COALESCE(p.pc,0) <> 0)
  ORDER BY coa.account_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_account_balance(
  p_tenant_id UUID,
  p_account_number TEXT,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant UUID;
  _balance NUMERIC;
BEGIN
  _tenant := COALESCE(p_tenant_id, get_user_tenant_id(auth.uid()));
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR _tenant = get_user_tenant_id(auth.uid())) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0)
    INTO _balance
    FROM public.journal_entries je
    JOIN public.chart_of_accounts coa ON coa.id = je.account_id
   WHERE je.tenant_id = _tenant
     AND coa.account_number = p_account_number
     AND je.entry_date <= p_as_of_date;

  RETURN COALESCE(_balance, 0);
END;
$$;
