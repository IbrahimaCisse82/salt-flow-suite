-- ENUMS conditionnels
DO $$ BEGIN CREATE TYPE public.client_type AS ENUM ('local','export','particulier'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.sale_status AS ENUM ('draft','confirmed','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.quality_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'vente_locale';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'vente_export';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'virement_interne';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'encaissement_client';

ALTER TABLE public.expense_types ADD COLUMN IF NOT EXISTS syscohada_category TEXT;
ALTER TABLE public.expense_types ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS requires_reapproval BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS previous_total NUMERIC;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS expense_category TEXT;
ALTER TABLE public.ledger_audit_log ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE public.ledger_audit_log ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE public.depreciation_schedule ADD COLUMN IF NOT EXISTS cumulative_depreciation NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.campagnes ADD COLUMN IF NOT EXISTS year INTEGER;

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  client_type client_type NOT NULL DEFAULT 'local',
  contact_person TEXT, phone TEXT, email TEXT, address TEXT, city TEXT,
  country TEXT DEFAULT 'Sénégal', tax_id TEXT, registration_number TEXT,
  payment_terms TEXT, credit_limit NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0, notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON public.clients(tenant_id);
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_ins ON public.clients;
DROP POLICY IF EXISTS clients_upd ON public.clients;
DROP POLICY IF EXISTS clients_del ON public.clients;
CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY clients_ins ON public.clients FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY clients_upd ON public.clients FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY clients_del ON public.clients FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, sale_number TEXT NOT NULL,
  client_id UUID, campagne_id UUID,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE, delivery_date DATE,
  status sale_status NOT NULL DEFAULT 'draft',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  is_export BOOLEAN NOT NULL DEFAULT false,
  can_be_delivered BOOLEAN NOT NULL DEFAULT false,
  subtotal NUMERIC NOT NULL DEFAULT 0, tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0, total_paid NUMERIC NOT NULL DEFAULT 0,
  invoice_number TEXT, notes TEXT, created_by UUID,
  delivered_at TIMESTAMPTZ, delivered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON public.sales(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_number ON public.sales(tenant_id, sale_number);
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_ins ON public.sales;
DROP POLICY IF EXISTS sales_upd ON public.sales;
DROP POLICY IF EXISTS sales_del ON public.sales;
CREATE POLICY sales_select ON public.sales FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY sales_ins ON public.sales FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY sales_upd ON public.sales FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY sales_del ON public.sales FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, sale_id UUID NOT NULL,
  inventory_item_id UUID, production_record_id UUID,
  description TEXT NOT NULL, salt_type TEXT, quality_grade TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0, unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'Tonnes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
DROP POLICY IF EXISTS si_select ON public.sale_items;
DROP POLICY IF EXISTS si_ins ON public.sale_items;
DROP POLICY IF EXISTS si_upd ON public.sale_items;
DROP POLICY IF EXISTS si_del ON public.sale_items;
CREATE POLICY si_select ON public.sale_items FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY si_ins ON public.sale_items FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY si_upd ON public.sale_items FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY si_del ON public.sale_items FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, sale_id UUID, client_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID, reference TEXT, transaction_id UUID, notes TEXT,
  created_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payments_sale ON public.payments(sale_id);
DROP POLICY IF EXISTS pay_select ON public.payments;
DROP POLICY IF EXISTS pay_ins ON public.payments;
DROP POLICY IF EXISTS pay_upd ON public.payments;
DROP POLICY IF EXISTS pay_del ON public.payments;
CREATE POLICY pay_select ON public.payments FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY pay_ins ON public.payments FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY pay_upd ON public.payments FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY pay_del ON public.payments FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.production_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, bassin_id UUID, campagne_id UUID, team_id UUID,
  harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salt_type TEXT NOT NULL DEFAULT 'sel_fin', quality_grade TEXT,
  quantity_tonnes NUMERIC NOT NULL DEFAULT 0, humidity_percent NUMERIC,
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  cost_per_ton NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT, created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pr_bassin ON public.production_records(bassin_id);
DROP POLICY IF EXISTS pr_select ON public.production_records;
DROP POLICY IF EXISTS pr_ins ON public.production_records;
DROP POLICY IF EXISTS pr_upd ON public.production_records;
DROP POLICY IF EXISTS pr_del ON public.production_records;
CREATE POLICY pr_select ON public.production_records FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY pr_ins ON public.production_records FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY pr_upd ON public.production_records FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY pr_del ON public.production_records FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.quality_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, production_record_id UUID,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE, tested_by UUID,
  purity_percent NUMERIC, humidity_percent NUMERIC,
  grain_size TEXT, color_grade TEXT, quality_grade TEXT,
  status quality_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quality_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS qt_select ON public.quality_tests;
DROP POLICY IF EXISTS qt_ins ON public.quality_tests;
DROP POLICY IF EXISTS qt_upd ON public.quality_tests;
DROP POLICY IF EXISTS qt_del ON public.quality_tests;
CREATE POLICY qt_select ON public.quality_tests FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY qt_ins ON public.quality_tests FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY qt_upd ON public.quality_tests FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY qt_del ON public.quality_tests FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.quality_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, quality_test_id UUID, production_record_id UUID,
  certificate_number TEXT NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE, expiry_date DATE,
  issued_by UUID, client_id UUID, notes TEXT, pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quality_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS qc_select ON public.quality_certificates;
DROP POLICY IF EXISTS qc_ins ON public.quality_certificates;
DROP POLICY IF EXISTS qc_upd ON public.quality_certificates;
DROP POLICY IF EXISTS qc_del ON public.quality_certificates;
CREATE POLICY qc_select ON public.quality_certificates FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY qc_ins ON public.quality_certificates FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'admin')));
CREATE POLICY qc_upd ON public.quality_certificates FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'qualite') OR has_role(auth.uid(),'admin')));
CREATE POLICY qc_del ON public.quality_certificates FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.campagne_budget_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, campagne_id UUID NOT NULL,
  phase TEXT NOT NULL DEFAULT 'preparation',
  expense_category TEXT NOT NULL,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  spent_amount NUMERIC NOT NULL DEFAULT 0, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campagne_budget_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cbl_select ON public.campagne_budget_lines;
DROP POLICY IF EXISTS cbl_ins ON public.campagne_budget_lines;
DROP POLICY IF EXISTS cbl_upd ON public.campagne_budget_lines;
DROP POLICY IF EXISTS cbl_del ON public.campagne_budget_lines;
CREATE POLICY cbl_select ON public.campagne_budget_lines FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY cbl_ins ON public.campagne_budget_lines FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY cbl_upd ON public.campagne_budget_lines FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY cbl_del ON public.campagne_budget_lines FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TABLE IF NOT EXISTS public.campagne_phase_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL, campagne_id UUID NOT NULL,
  phase TEXT NOT NULL,
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,
  spent_amount NUMERIC NOT NULL DEFAULT 0,
  start_date DATE, end_date DATE,
  is_locked BOOLEAN NOT NULL DEFAULT false, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campagne_phase_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cpb_select ON public.campagne_phase_budgets;
DROP POLICY IF EXISTS cpb_ins ON public.campagne_phase_budgets;
DROP POLICY IF EXISTS cpb_upd ON public.campagne_phase_budgets;
DROP POLICY IF EXISTS cpb_del ON public.campagne_phase_budgets;
CREATE POLICY cpb_select ON public.campagne_phase_budgets FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY cpb_ins ON public.campagne_phase_budgets FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY cpb_upd ON public.campagne_phase_budgets FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY cpb_del ON public.campagne_phase_budgets FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

DROP TRIGGER IF EXISTS trg_clients_uat ON public.clients;
CREATE TRIGGER trg_clients_uat BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_sales_uat ON public.sales;
CREATE TRIGGER trg_sales_uat BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_pr_uat ON public.production_records;
CREATE TRIGGER trg_pr_uat BEFORE UPDATE ON public.production_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_qt_uat ON public.quality_tests;
CREATE TRIGGER trg_qt_uat BEFORE UPDATE ON public.quality_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_qc_uat ON public.quality_certificates;
CREATE TRIGGER trg_qc_uat BEFORE UPDATE ON public.quality_certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_cbl_uat ON public.campagne_budget_lines;
CREATE TRIGGER trg_cbl_uat BEFORE UPDATE ON public.campagne_budget_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_cpb_uat ON public.campagne_phase_budgets;
CREATE TRIGGER trg_cpb_uat BEFORE UPDATE ON public.campagne_phase_budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.post_depreciation(_schedule_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tenant UUID;
BEGIN
  _tenant := get_user_tenant_id(auth.uid());
  UPDATE public.depreciation_schedule SET is_posted = true, posted_at = now()
    WHERE id = _schedule_id AND tenant_id = _tenant;
  RETURN jsonb_build_object('success', true);
END; $$;
REVOKE ALL ON FUNCTION public.post_depreciation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_depreciation(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_profile_to_tenant(_user_id UUID, _tenant_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET tenant_id = _tenant_id WHERE user_id = _user_id;
  RETURN jsonb_build_object('success', true);
END; $$;
REVOKE ALL ON FUNCTION public.link_profile_to_tenant(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_profile_to_tenant(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_profiles_with_roles()
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT, phone TEXT, is_active BOOLEAN, tenant_id UUID, roles TEXT[])
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tenant UUID;
BEGIN
  _tenant := get_user_tenant_id(auth.uid());
  IF NOT (has_role(auth.uid(), 'gerant') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT p.user_id, p.email, p.full_name, p.phone, p.is_active, p.tenant_id,
    COALESCE(ARRAY_AGG(ur.role::TEXT) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::TEXT[])
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE p.tenant_id = _tenant
  GROUP BY p.user_id, p.email, p.full_name, p.phone, p.is_active, p.tenant_id;
END; $$;
REVOKE ALL ON FUNCTION public.get_profiles_with_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_with_roles() TO authenticated;