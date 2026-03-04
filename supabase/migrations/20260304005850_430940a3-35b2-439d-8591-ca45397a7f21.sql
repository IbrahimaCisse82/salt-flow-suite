
-- 1. Fix chart_of_accounts: require authentication for SELECT
-- Drop existing permissive SELECT policies and replace with auth-required ones
DROP POLICY IF EXISTS "Users can view chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Allow read access to chart of accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "chart_of_accounts_select" ON public.chart_of_accounts;

CREATE POLICY "Authenticated users can view chart of accounts"
ON public.chart_of_accounts
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- 2. Fix expense_types: require authentication for SELECT
DROP POLICY IF EXISTS "Users can view expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Allow read access to expense types" ON public.expense_types;
DROP POLICY IF EXISTS "expense_types_select" ON public.expense_types;

CREATE POLICY "Authenticated users can view expense types"
ON public.expense_types
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- 3. Fix admin_settings: require authentication and scope access
DROP POLICY IF EXISTS "Anyone can view public settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_select" ON public.admin_settings;

CREATE POLICY "Authenticated users can view public settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (is_public = true);
