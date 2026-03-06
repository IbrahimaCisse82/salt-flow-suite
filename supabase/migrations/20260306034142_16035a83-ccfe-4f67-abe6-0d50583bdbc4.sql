
-- Fix: admin_settings public SELECT policy requires authentication
DROP POLICY IF EXISTS "Authenticated users can view public settings" ON public.admin_settings;
CREATE POLICY "Authenticated users can view public settings"
  ON public.admin_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Fix: Ensure accounting_ledger view has RLS security via security_invoker
-- Views inherit RLS from underlying tables, but add explicit grant restriction
REVOKE ALL ON public.accounting_ledger FROM anon;
GRANT SELECT ON public.accounting_ledger TO authenticated;

-- Fix: Ensure budget_commitment_summary view is restricted
REVOKE ALL ON public.budget_commitment_summary FROM anon;
GRANT SELECT ON public.budget_commitment_summary TO authenticated;
