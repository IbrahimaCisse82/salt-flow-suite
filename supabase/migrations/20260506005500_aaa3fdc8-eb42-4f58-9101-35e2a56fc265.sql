
-- ============================================
-- BASSINS : colonnes manquantes pour le frontend
-- ============================================
ALTER TABLE public.bassins
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS area NUMERIC,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Synchroniser is_active avec status
UPDATE public.bassins SET is_active = (status = 'actif') WHERE is_active IS NULL OR is_active = true;
UPDATE public.bassins SET area = surface_m2 WHERE area IS NULL AND surface_m2 IS NOT NULL;
UPDATE public.bassins SET location = address WHERE location IS NULL AND address IS NOT NULL;

-- ============================================
-- CAMPAGNES : colonnes alias pour le frontend
-- ============================================
ALTER TABLE public.campagnes
  ADD COLUMN IF NOT EXISTS target_production NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_total NUMERIC;

UPDATE public.campagnes SET target_production = target_production_tonnes WHERE target_production IS NULL;
UPDATE public.campagnes SET budget_total = budget WHERE budget_total IS NULL;

-- Adapter le statut 'planifiee' -> 'active' pour cohérence avec le frontend
ALTER TYPE campagne_status ADD VALUE IF NOT EXISTS 'active';

-- ============================================
-- SALES : table principale (workflow commercial)
-- ============================================
DO $$ BEGIN
  CREATE TYPE sale_status AS ENUM ('draft','confirmed','invoiced','delivered','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','partial','paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  campagne_id UUID,
  warehouse_id UUID,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  order_number TEXT,
  invoice_number TEXT,
  customer_name TEXT,
  salt_type TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount_ht NUMERIC NOT NULL DEFAULT 0,
  tva_rate NUMERIC NOT NULL DEFAULT 0,
  tva_amount NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  sale_status TEXT NOT NULL DEFAULT 'draft',
  can_be_delivered BOOLEAN NOT NULL DEFAULT false,
  delivered BOOLEAN NOT NULL DEFAULT false,
  stock_updated BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_select ON public.sales;
CREATE POLICY sales_select ON public.sales FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS sales_ins ON public.sales;
CREATE POLICY sales_ins ON public.sales FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS sales_upd ON public.sales;
CREATE POLICY sales_upd ON public.sales FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS sales_del ON public.sales;
CREATE POLICY sales_del ON public.sales FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- ============================================
-- SALE_ITEMS : lignes de vente multi-produits
-- ============================================
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  salt_type TEXT NOT NULL,
  warehouse_id UUID,
  warehouse_name TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount_ht NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS si_select ON public.sale_items;
CREATE POLICY si_select ON public.sale_items FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS si_ins ON public.sale_items;
CREATE POLICY si_ins ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS si_upd ON public.sale_items;
CREATE POLICY si_upd ON public.sale_items FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS si_del ON public.sale_items;
CREATE POLICY si_del ON public.sale_items FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- ============================================
-- Trigger updated_at sur sales
-- ============================================
DROP TRIGGER IF EXISTS sales_updated_at ON public.sales;
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
