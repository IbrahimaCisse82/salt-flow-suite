-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.account_type AS ENUM ('actif', 'passif', 'charge', 'produit', 'capitaux');
CREATE TYPE public.cash_account_type AS ENUM ('banque', 'caisse', 'mobile_money');
CREATE TYPE public.bassin_status AS ENUM ('actif', 'inactif', 'maintenance', 'recolte');
CREATE TYPE public.campagne_status AS ENUM ('planifiee', 'en_cours', 'cloturee', 'annulee');

-- =====================================================
-- chart_of_accounts (Plan comptable SYSCOHADA)
-- =====================================================
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type public.account_type NOT NULL,
  account_class INTEGER NOT NULL,
  parent_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, account_number)
);
CREATE INDEX idx_coa_tenant ON public.chart_of_accounts(tenant_id);
CREATE INDEX idx_coa_class ON public.chart_of_accounts(tenant_id, account_class);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coa_select_tenant" ON public.chart_of_accounts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "coa_insert_accounting" ON public.chart_of_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "coa_update_accounting" ON public.chart_of_accounts
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "coa_delete_accounting" ON public.chart_of_accounts
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND is_system = false
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE TRIGGER trg_coa_updated_at BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- expense_types
-- =====================================================
CREATE TABLE public.expense_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX idx_expense_types_tenant ON public.expense_types(tenant_id);

ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_types_select_tenant" ON public.expense_types
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "expense_types_insert_accounting" ON public.expense_types
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "expense_types_update_accounting" ON public.expense_types
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "expense_types_delete_accounting" ON public.expense_types
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE TRIGGER trg_expense_types_updated_at BEFORE UPDATE ON public.expense_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- accounts (banque, caisse, mobile money)
-- =====================================================
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_type public.cash_account_type NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  iban TEXT,
  swift TEXT,
  currency TEXT NOT NULL DEFAULT 'XOF',
  current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  initial_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  chart_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_accounts_tenant ON public.accounts(tenant_id);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select_tenant" ON public.accounts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "accounts_insert_accounting" ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "accounts_update_accounting" ON public.accounts
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "accounts_delete_accounting" ON public.accounts
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'comptable') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- bassins (production geolocalisée)
-- =====================================================
CREATE TABLE public.bassins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  surface_m2 NUMERIC(12,2),
  capacity_tonnes NUMERIC(12,2),
  status public.bassin_status NOT NULL DEFAULT 'actif',
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bassins_tenant ON public.bassins(tenant_id);

ALTER TABLE public.bassins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bassins_select_tenant" ON public.bassins
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "bassins_insert_production" ON public.bassins
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'chef_production') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "bassins_update_production" ON public.bassins
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'chef_production') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "bassins_delete_gerant" ON public.bassins
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE TRIGGER trg_bassins_updated_at BEFORE UPDATE ON public.bassins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- campagnes (campagnes de production saisonnières)
-- =====================================================
CREATE TABLE public.campagnes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status public.campagne_status NOT NULL DEFAULT 'planifiee',
  budget NUMERIC(18,2) NOT NULL DEFAULT 0,
  spent_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  target_production_tonnes NUMERIC(12,2),
  actual_production_tonnes NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campagnes_tenant ON public.campagnes(tenant_id);
CREATE INDEX idx_campagnes_status ON public.campagnes(tenant_id, status);

ALTER TABLE public.campagnes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campagnes_select_tenant" ON public.campagnes
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "campagnes_insert_management" ON public.campagnes
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'chef_production') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "campagnes_update_management" ON public.campagnes
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'chef_production') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "campagnes_delete_gerant" ON public.campagnes
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE TRIGGER trg_campagnes_updated_at BEFORE UPDATE ON public.campagnes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Seed du plan comptable SYSCOHADA pour nouveau tenant
-- =====================================================
CREATE OR REPLACE FUNCTION public.seed_chart_of_accounts(_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, account_class, is_system) VALUES
    -- Classe 1 : Capitaux
    (_tenant_id, '101', 'Capital social', 'capitaux', 1, true),
    (_tenant_id, '106', 'Réserves', 'capitaux', 1, true),
    (_tenant_id, '120', 'Résultat de l''exercice', 'capitaux', 1, true),
    (_tenant_id, '161', 'Emprunts auprès des établissements de crédit', 'passif', 1, true),
    -- Classe 2 : Immobilisations
    (_tenant_id, '211', 'Terrains', 'actif', 2, true),
    (_tenant_id, '213', 'Bâtiments', 'actif', 2, true),
    (_tenant_id, '215', 'Installations techniques', 'actif', 2, true),
    (_tenant_id, '218', 'Autres immobilisations corporelles', 'actif', 2, true),
    (_tenant_id, '281', 'Amortissements des immobilisations', 'actif', 2, true),
    -- Classe 3 : Stocks
    (_tenant_id, '311', 'Matières premières', 'actif', 3, true),
    (_tenant_id, '321', 'Matières consommables', 'actif', 3, true),
    (_tenant_id, '331', 'Produits en cours', 'actif', 3, true),
    (_tenant_id, '361', 'Produits finis', 'actif', 3, true),
    -- Classe 4 : Tiers
    (_tenant_id, '401', 'Fournisseurs', 'passif', 4, true),
    (_tenant_id, '411', 'Clients', 'actif', 4, true),
    (_tenant_id, '421', 'Personnel - rémunérations dues', 'passif', 4, true),
    (_tenant_id, '431', 'Sécurité sociale', 'passif', 4, true),
    (_tenant_id, '441', 'État - impôts sur les bénéfices', 'passif', 4, true),
    (_tenant_id, '443', 'État - TVA', 'passif', 4, true),
    -- Classe 5 : Trésorerie
    (_tenant_id, '521', 'Banques', 'actif', 5, true),
    (_tenant_id, '531', 'Caisse', 'actif', 5, true),
    (_tenant_id, '551', 'Mobile money', 'actif', 5, true),
    -- Classe 6 : Charges
    (_tenant_id, '601', 'Achats de marchandises', 'charge', 6, true),
    (_tenant_id, '604', 'Achats de matières premières', 'charge', 6, true),
    (_tenant_id, '605', 'Autres achats', 'charge', 6, true),
    (_tenant_id, '611', 'Transports', 'charge', 6, true),
    (_tenant_id, '622', 'Locations', 'charge', 6, true),
    (_tenant_id, '624', 'Entretien et réparations', 'charge', 6, true),
    (_tenant_id, '627', 'Services bancaires', 'charge', 6, true),
    (_tenant_id, '641', 'Impôts et taxes', 'charge', 6, true),
    (_tenant_id, '661', 'Charges de personnel', 'charge', 6, true),
    (_tenant_id, '681', 'Dotations aux amortissements', 'charge', 6, true),
    -- Classe 7 : Produits
    (_tenant_id, '701', 'Ventes de produits finis', 'produit', 7, true),
    (_tenant_id, '706', 'Prestations de services', 'produit', 7, true),
    (_tenant_id, '707', 'Ventes de marchandises', 'produit', 7, true),
    (_tenant_id, '771', 'Produits financiers', 'produit', 7, true)
  ON CONFLICT (tenant_id, account_number) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_chart_of_accounts(UUID) FROM PUBLIC, anon, authenticated;

-- =====================================================
-- Mise à jour de handle_new_user pour seed le plan comptable
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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

  INSERT INTO public.tenants (name, email, is_active)
  VALUES (_company_name, NEW.email, true)
  RETURNING id INTO _tenant_id;

  INSERT INTO public.profiles (user_id, tenant_id, email, full_name)
  VALUES (
    NEW.id,
    _tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'gerant', _tenant_id);

  -- Initialise le plan comptable SYSCOHADA
  PERFORM public.seed_chart_of_accounts(_tenant_id);

  RETURN NEW;
END;
$$;