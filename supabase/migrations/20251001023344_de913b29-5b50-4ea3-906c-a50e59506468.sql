-- Helper function to avoid recursion in profiles policies
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

-- Replace recursive profiles policies with safe versions (transactional)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles: view self or same tenant"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR tenant_id = public.current_tenant_id()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Public read-only access to active chart of accounts
DROP POLICY IF EXISTS "Public can read active chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "Public can read active chart of accounts"
ON public.chart_of_accounts
FOR SELECT
USING (is_active = true);