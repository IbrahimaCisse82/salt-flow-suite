-- Correction des problèmes de sécurité

-- 1. Restreindre l'accès aux informations sensibles dans la table profiles
-- Supprimer les anciennes politiques trop permissives
DROP POLICY IF EXISTS "Admins and managers can view all profiles in tenant" ON profiles;

-- Créer des politiques plus restrictives
-- Les utilisateurs ne peuvent voir que leur propre profil complet
-- Les admins/gérants peuvent voir tous les profils de leur tenant
CREATE POLICY "Users can view profiles with restrictions"
  ON profiles
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      -- L'utilisateur peut voir son propre profil complet
      id = auth.uid()
      OR
      -- Ou c'est un admin/gérant qui peut voir tous les profils
      is_manager_or_admin(auth.uid())
    )
  );

-- 2. Créer une fonction pour obtenir seulement les données publiques des profils
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    avatar_url
  FROM profiles
  WHERE tenant_id = get_user_tenant_id(auth.uid());
$$;

-- 3. Restreindre l'accès aux informations sensibles des tenants
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;

-- Séparer la lecture des infos publiques et sensibles
CREATE POLICY "Users can view their tenant info"
  ON tenants
  FOR SELECT
  USING (id = get_user_tenant_id(auth.uid()));

-- Seuls les gérants/admins peuvent modifier le tenant
CREATE POLICY "Only managers can update tenant info"
  ON tenants
  FOR UPDATE
  USING (
    id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  );

-- 4. Créer une vue publique pour les profils (sans données sensibles)
DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public AS
SELECT 
  id,
  tenant_id,
  full_name,
  avatar_url,
  created_at
FROM profiles;

-- 5. Créer une fonction sécurisée pour obtenir les infos publiques d'un tenant
CREATE OR REPLACE FUNCTION public.get_tenant_public_info(_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  logo_url TEXT,
  is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    logo_url,
    is_active
  FROM tenants
  WHERE id = _tenant_id;
$$;

-- 6. Ajouter des commentaires sur les fonctions SECURITY DEFINER pour documentation
COMMENT ON FUNCTION get_profiles_with_roles() IS 'SECURITY DEFINER intentionnel : évite la récursion RLS. Sécurité gérée dans la fonction.';
COMMENT ON FUNCTION get_employees_safe() IS 'SECURITY DEFINER intentionnel : évite la récursion RLS. Sécurité gérée dans la fonction.';
COMMENT ON FUNCTION get_profiles_safe() IS 'SECURITY DEFINER intentionnel : évite la récursion RLS. Sécurité gérée dans la fonction.';
COMMENT ON FUNCTION get_public_profiles() IS 'Retourne uniquement les données publiques des profils (nom et avatar).';
COMMENT ON FUNCTION get_tenant_public_info(UUID) IS 'Retourne uniquement les données publiques d un tenant.';

-- 7. Ajouter une politique pour limiter la création de tenants
-- Un utilisateur ne peut créer qu'un seul tenant (lors de l'inscription)
DROP POLICY IF EXISTS "Users can create their own tenant during signup" ON tenants;
CREATE POLICY "Users can create tenant only during signup"
  ON tenants
  FOR INSERT
  WITH CHECK (
    -- Vérifier que l'utilisateur n'a pas déjà un tenant
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND tenant_id IS NOT NULL
    )
  );