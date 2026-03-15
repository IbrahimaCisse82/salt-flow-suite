
-- 1. Fix orphaned_profiles: restrict to admin only
DROP VIEW IF EXISTS public.orphaned_profiles;

CREATE VIEW public.orphaned_profiles
WITH (security_invoker = on) AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  ur.role,
  EXTRACT(EPOCH FROM (now() - p.created_at))/60 as minutes_since_creation
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.tenant_id IS NULL 
  AND p.created_at < (now() - INTERVAL '5 minutes');

GRANT SELECT ON public.orphaned_profiles TO authenticated;
REVOKE ALL ON public.orphaned_profiles FROM anon, public;

-- 2. Fix accounting_ledger: recreate with security_invoker
DROP VIEW IF EXISTS public.accounting_ledger;

CREATE VIEW public.accounting_ledger
WITH (security_invoker = on) AS
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
JOIN transactions t ON je.transaction_id = t.id;

GRANT SELECT ON public.accounting_ledger TO authenticated;
REVOKE ALL ON public.accounting_ledger FROM anon;

-- 3. Fix scheduled_reports: drop the overly broad policy
DROP POLICY IF EXISTS "Users can view scheduled reports from their tenant" ON public.scheduled_reports;
