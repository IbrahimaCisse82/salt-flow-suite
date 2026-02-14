
-- Fix tenants SELECT policy to allow admins to see all tenants
DROP POLICY "Users can view their tenant" ON public.tenants;
CREATE POLICY "Users can view their tenant" ON public.tenants
  FOR SELECT USING (
    id = get_user_tenant_id(auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

-- Fix profiles SELECT policy to allow admins to see all profiles
DROP POLICY "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR (is_manager_or_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))
  );
