-- Drop the existing insecure view
DROP VIEW IF EXISTS profiles_with_roles CASCADE;

-- Recreate the view with security_barrier enabled to ensure proper security
-- This view uses the secure get_profiles_with_roles() function which enforces proper access control
CREATE VIEW profiles_with_roles
WITH (security_barrier = true)
AS
SELECT * FROM get_profiles_with_roles();

-- Grant SELECT permission only to authenticated users
GRANT SELECT ON profiles_with_roles TO authenticated;

-- Add comment explaining security
COMMENT ON VIEW profiles_with_roles IS 'Secure view of profiles with roles. Access is controlled by the underlying get_profiles_with_roles() function which enforces tenant isolation and role-based access.';