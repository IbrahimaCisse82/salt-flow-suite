-- Optimize RLS policies to avoid re-evaluation of auth.uid() for each row
-- Fix "Users can update profiles" policy on profiles table
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
USING (
  id = (select auth.uid()) 
  OR has_role((select auth.uid()), 'admin'::app_role)
)
WITH CHECK (
  id = (select auth.uid()) 
  OR has_role((select auth.uid()), 'admin'::app_role)
);

-- Fix "Users can view roles" policy on user_roles table
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

CREATE POLICY "Users can view roles"
ON public.user_roles
FOR SELECT
USING (
  user_id = (select auth.uid())
  OR has_role((select auth.uid()), 'admin'::app_role)
  OR (
    is_manager_or_admin((select auth.uid())) 
    AND EXISTS (
      SELECT 1 
      FROM profiles p1
      JOIN profiles p2 ON p1.tenant_id = p2.tenant_id
      WHERE p1.id = (select auth.uid())
      AND p2.id = user_roles.user_id
    )
  )
);