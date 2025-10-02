-- Supprimer la vue publique profiles_with_roles qui expose les données sensibles
DROP VIEW IF EXISTS public.profiles_with_roles CASCADE;

-- Créer une fonction sécurisée qui remplace la vue
-- Cette fonction applique automatiquement les contrôles d'accès
CREATE OR REPLACE FUNCTION public.get_profiles_with_roles()
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
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
    -- L'utilisateur peut voir son propre profil
    p.id = auth.uid()
    OR
    -- Ou les admins/gérants peuvent voir les profils de leur tenant
    (
      is_manager_or_admin(auth.uid()) 
      AND p.tenant_id = get_user_tenant_id(auth.uid())
    );
$$;

-- Créer une vue sécurisée qui utilise la fonction
-- Cette vue n'expose les données qu'aux utilisateurs autorisés
CREATE VIEW public.profiles_with_roles 
WITH (security_invoker = true) 
AS SELECT * FROM public.get_profiles_with_roles();

-- Activer RLS sur la vue (même si elle utilise security_invoker)
ALTER VIEW profiles_with_roles SET (security_invoker = on);

-- Donner les permissions nécessaires
GRANT SELECT ON public.profiles_with_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_with_roles() TO authenticated;