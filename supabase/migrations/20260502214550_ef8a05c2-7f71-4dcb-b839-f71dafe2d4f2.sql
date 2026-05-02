-- ============================================================
-- MIGRATION 1 : FONDATIONS (Multi-tenant + Auth + Rôles)
-- ============================================================

-- ---------- ENUM rôles ----------
CREATE TYPE public.app_role AS ENUM (
  'gerant',
  'chef_production',
  'comptable',
  'commercial',
  'rh',
  'magasinier',
  'admin'
);

-- ---------- Fonction utilitaire updated_at ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE : tenants
-- ============================================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Sénégal',
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE : profiles
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE : user_roles
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, tenant_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);

-- ============================================================
-- FONCTIONS SECURITY DEFINER (anti-récursion RLS)
-- ============================================================

-- has_role : vérifie si un user a un rôle
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- get_user_tenant_id : récupère le tenant de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- is_tenant_member : vérifie si l'utilisateur appartient au tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  );
$$;

-- ============================================================
-- TRIGGER : auto-création tenant + profile + rôle gérant à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
  _company_name TEXT;
BEGIN
  _company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Création du tenant
  INSERT INTO public.tenants (name, email, is_active)
  VALUES (_company_name, NEW.email, true)
  RETURNING id INTO _tenant_id;

  -- Création du profil
  INSERT INTO public.profiles (user_id, tenant_id, email, full_name)
  VALUES (
    NEW.id,
    _tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Attribution du rôle gérant
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'gerant', _tenant_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS POLICIES : tenants
-- ============================================================
CREATE POLICY "tenants_select_member"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "tenants_update_gerant"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (
    (id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'gerant'))
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============================================================
-- RLS POLICIES : profiles
-- ============================================================
CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "profiles_select_tenant_gerant"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "profiles_update_gerant"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'gerant')
  );

CREATE POLICY "profiles_insert_gerant"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'gerant')
  );

-- ============================================================
-- RLS POLICIES : user_roles
-- ============================================================
CREATE POLICY "user_roles_select_self"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_tenant_gerant"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "user_roles_insert_gerant"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "user_roles_delete_gerant"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'admin'))
  );