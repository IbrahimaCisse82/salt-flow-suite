-- ============================================
-- MIGRATION DE SÉCURITÉ: Séparation des rôles
-- ============================================

-- 1. Créer le type ENUM pour les rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'gerant', 'commercial', 'comptable', 'production');

-- 2. Créer la table user_roles avec RLS
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Index pour les performances
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Activer RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Créer la fonction SECURITY DEFINER pour vérifier les rôles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Fonction pour obtenir le rôle principal d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_primary_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'gerant' THEN 2
      WHEN 'comptable' THEN 3
      WHEN 'commercial' THEN 4
      WHEN 'production' THEN 5
    END
  LIMIT 1
$$;

-- 5. Fonction helper pour vérifier si l'utilisateur est manager ou admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'gerant')
  )
$$;

-- 6. Créer la table d'audit pour les changements de rôles
CREATE TABLE public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_changed_at ON public.security_audit_log(changed_at);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Seuls les admins peuvent voir les logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Migrer les données existantes de profiles.role vers user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT id, role::app_role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. RLS Policies pour user_roles

-- Les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Les admins et gérants peuvent voir tous les rôles de leur tenant
CREATE POLICY "Managers can view roles in their tenant"
ON public.user_roles
FOR SELECT
USING (
  public.is_manager_or_admin(auth.uid()) AND
  EXISTS (
    SELECT 1
    FROM public.profiles p1
    JOIN public.profiles p2 ON p1.tenant_id = p2.tenant_id
    WHERE p1.id = auth.uid()
      AND p2.id = user_roles.user_id
  )
);

-- Seuls les admins peuvent assigner/modifier des rôles
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Trigger pour audit des changements de rôles
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.security_audit_log (user_id, action, new_value, changed_by)
    VALUES (NEW.user_id, 'role_assigned', NEW.role::TEXT, NEW.assigned_by);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.security_audit_log (user_id, action, old_value, changed_by)
    VALUES (OLD.user_id, 'role_removed', OLD.role::TEXT, auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_role_change
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_role_changes();

-- 10. Mettre à jour get_user_role pour utiliser user_roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_primary_user_role(user_id)::TEXT
$$;

-- 11. Mettre à jour handle_new_user pour créer un rôle dans user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, email, full_name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (NEW.raw_user_meta_data->>'tenant_id')::UUID
  );
  
  -- Assigner le rôle
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'production')::app_role;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- 12. Supprimer la colonne role de profiles (SÉCURITÉ)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 13. Créer une vue safe pour les profils avec rôles (pour compatibilité)
CREATE OR REPLACE VIEW public.profiles_with_roles AS
SELECT 
  p.*,
  (SELECT public.get_primary_user_role(p.id)::TEXT) as role
FROM public.profiles p;

-- Grant access à la vue
GRANT SELECT ON public.profiles_with_roles TO authenticated;

-- 14. Politique de sécurité: Empêcher la modification des rôles admin par les gérants
CREATE OR REPLACE FUNCTION public.prevent_admin_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si quelqu'un essaie d'assigner le rôle admin ou gerant
  IF NEW.role IN ('admin', 'gerant') THEN
    -- Vérifier que l'assignateur est admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Seuls les administrateurs peuvent assigner des rôles admin ou gérant';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_role_escalation
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_role_escalation();