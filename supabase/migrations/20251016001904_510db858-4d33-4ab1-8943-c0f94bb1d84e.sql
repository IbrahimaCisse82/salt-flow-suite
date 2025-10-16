-- Fix remaining multiple permissive policies warnings
-- Consolidate profiles UPDATE policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Consolidate user_roles SELECT policies
DROP POLICY IF EXISTS "Managers can view roles in their tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view roles"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_manager_or_admin(auth.uid()) 
    AND EXISTS (
      SELECT 1 
      FROM profiles p1
      JOIN profiles p2 ON p1.tenant_id = p2.tenant_id
      WHERE p1.id = auth.uid() 
      AND p2.id = user_roles.user_id
    )
  )
);