-- Fix profiles_with_roles view to use SECURITY INVOKER
-- This makes the view respect RLS policies of the querying user
ALTER VIEW profiles_with_roles SET (security_invoker = on);

COMMENT ON VIEW profiles_with_roles IS 'View combining profiles with roles. Uses SECURITY INVOKER to respect RLS policies of the querying user.';