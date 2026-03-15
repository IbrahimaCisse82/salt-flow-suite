
DROP VIEW IF EXISTS public.orphaned_profiles;

CREATE VIEW public.orphaned_profiles
WITH (security_invoker = on) AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  ur.role,
  EXTRACT(EPOCH FROM (now() - p.created_at))/60 as minutes_since_creation
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.tenant_id IS NULL 
  AND p.created_at < (now() - INTERVAL '5 minutes');

GRANT SELECT ON public.orphaned_profiles TO authenticated;
REVOKE ALL ON public.orphaned_profiles FROM anon;
