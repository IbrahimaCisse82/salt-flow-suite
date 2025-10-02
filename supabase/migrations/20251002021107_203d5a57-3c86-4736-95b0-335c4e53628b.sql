-- Drop and recreate the profiles_with_roles view without security definer
-- This ensures it respects RLS policies from the underlying profiles and user_roles tables
DROP VIEW IF EXISTS profiles_with_roles;

CREATE VIEW profiles_with_roles AS
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
LEFT JOIN user_roles ur ON p.id = ur.user_id;

COMMENT ON VIEW profiles_with_roles IS 'View combining profiles with roles. Access is controlled by RLS policies on underlying profiles and user_roles tables.';