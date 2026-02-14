DROP FUNCTION IF EXISTS public.get_profiles_with_roles();

CREATE OR REPLACE FUNCTION public.get_profiles_with_roles()
RETURNS TABLE(
  id uuid,
  tenant_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.tenant_id,
    p.created_at,
    p.updated_at,
    p.email,
    p.full_name,
    p.phone,
    p.avatar_url,
    ur.role
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE 
    p.id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    (
      is_manager_or_admin(auth.uid()) 
      AND p.tenant_id = get_user_tenant_id(auth.uid())
    );
$$;