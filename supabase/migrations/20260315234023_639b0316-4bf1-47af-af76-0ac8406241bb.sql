
-- ============================================
-- 1. Replace orphaned_profiles VIEW with a 
--    SECURITY DEFINER function (admin-only)
-- ============================================
DROP VIEW IF EXISTS public.orphaned_profiles;

CREATE OR REPLACE FUNCTION public.get_orphaned_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  role text,
  minutes_since_creation double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    ur.role::text,
    EXTRACT(EPOCH FROM (now() - p.created_at))/60 as minutes_since_creation
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE p.tenant_id IS NULL 
    AND p.created_at < (now() - INTERVAL '5 minutes')
    AND has_role(auth.uid(), 'admin'::app_role);
$$;

REVOKE ALL ON FUNCTION public.get_orphaned_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_orphaned_profiles() TO authenticated;

-- ============================================
-- 2. Replace accounting_ledger VIEW with a
--    SECURITY DEFINER function (tenant + role)
-- ============================================
DROP VIEW IF EXISTS public.accounting_ledger;

CREATE OR REPLACE FUNCTION public.get_accounting_ledger()
RETURNS TABLE (
  id uuid,
  transaction_id uuid,
  transaction_date date,
  description text,
  transaction_type text,
  reference text,
  account_number text,
  account_name text,
  debit numeric,
  credit numeric,
  tenant_id uuid,
  running_balance numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    je.id,
    t.id as transaction_id,
    t.transaction_date,
    t.description,
    t.transaction_type,
    t.reference,
    je.account_number,
    je.account_name,
    je.debit,
    je.credit,
    t.tenant_id,
    SUM(COALESCE(je.debit, 0) - COALESCE(je.credit, 0)) OVER (
      PARTITION BY je.account_number, t.tenant_id
      ORDER BY t.transaction_date, t.created_at
    ) as running_balance
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable');
$$;

REVOKE ALL ON FUNCTION public.get_accounting_ledger() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_accounting_ledger() TO authenticated;
