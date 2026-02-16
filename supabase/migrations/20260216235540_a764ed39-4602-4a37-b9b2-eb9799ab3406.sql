
CREATE OR REPLACE FUNCTION public.generate_trial_balance(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  account_number TEXT,
  account_name TEXT,
  account_type TEXT,
  opening_balance NUMERIC,
  period_debit NUMERIC,
  period_credit NUMERIC,
  closing_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    coa.account_number,
    coa.account_name,
    coa.account_type,
    COALESCE(get_account_balance(p_tenant_id, coa.account_number, p_start_date - 1), 0) as opening_balance,
    COALESCE(SUM(je.debit), 0) as period_debit,
    COALESCE(SUM(je.credit), 0) as period_credit,
    COALESCE(get_account_balance(p_tenant_id, coa.account_number, p_end_date), 0) as closing_balance
  FROM chart_of_accounts coa
  LEFT JOIN (
    journal_entries je
    INNER JOIN transactions t ON je.transaction_id = t.id
      AND t.tenant_id = p_tenant_id
      AND t.transaction_date BETWEEN p_start_date AND p_end_date
  ) ON je.account_number = coa.account_number
  WHERE (coa.tenant_id = p_tenant_id OR coa.tenant_id = '00000000-0000-0000-0000-000000000001')
    AND coa.is_active = true
  GROUP BY coa.account_number, coa.account_name, coa.account_type
  HAVING COALESCE(get_account_balance(p_tenant_id, coa.account_number, p_end_date), 0) != 0
      OR COALESCE(SUM(je.debit), 0) != 0
      OR COALESCE(SUM(je.credit), 0) != 0
  ORDER BY coa.account_number;
END;
$$;
