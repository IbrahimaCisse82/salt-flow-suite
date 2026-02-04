-- Allow all tenants to read global SYSCOHADA reference data stored under the "global" tenant id
-- Global tenant id observed in existing seed data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'uuid') THEN
    -- no-op safety; uuid type should always exist
    NULL;
  END IF;
END$$;

-- expense_types: replace SELECT policy
DROP POLICY IF EXISTS "Users can view expense types" ON public.expense_types;
CREATE POLICY "Users can view expense types"
ON public.expense_types
FOR SELECT
TO public
USING (
  tenant_id = (SELECT get_user_tenant_id((SELECT auth.uid() AS uid)))
  OR tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- chart_of_accounts: replace SELECT policy
DROP POLICY IF EXISTS "Users can view chart accounts" ON public.chart_of_accounts;
CREATE POLICY "Users can view chart accounts"
ON public.chart_of_accounts
FOR SELECT
TO public
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid() AS uid))
  OR tenant_id = '00000000-0000-0000-0000-000000000001'
);
