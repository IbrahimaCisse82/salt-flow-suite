
-- Fix chart_of_accounts: remove old permissive duplicate policies, keep only tenant-scoped ones
DROP POLICY IF EXISTS "Users can view chart accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Managers can delete chart accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Managers can insert chart accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Managers can update chart accounts" ON public.chart_of_accounts;

-- Ensure remaining SELECT policy requires authentication
DROP POLICY IF EXISTS "Authenticated users can view chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "Authenticated users can view chart of accounts"
  ON public.chart_of_accounts
  FOR SELECT
  TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) OR (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid));
