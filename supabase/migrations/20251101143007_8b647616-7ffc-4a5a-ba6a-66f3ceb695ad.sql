-- Corriger la vue pour utiliser SECURITY INVOKER au lieu de SECURITY DEFINER
DROP VIEW IF EXISTS public.orphaned_profiles;

CREATE VIEW public.orphaned_profiles 
WITH (security_invoker=true)
AS
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
  AND p.created_at < (now() - INTERVAL '5 minutes')
ORDER BY p.created_at DESC;

-- Autoriser les admins à voir cette vue
GRANT SELECT ON public.orphaned_profiles TO authenticated;

COMMENT ON VIEW public.orphaned_profiles IS 
'Vue pour identifier les profils sans tenant_id après 5 minutes (problème potentiel lors de l''inscription). Utilise SECURITY INVOKER pour respecter RLS.';