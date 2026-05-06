
-- sale_items : colonnes manquantes attendues par le frontend
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS warehouse_id UUID,
  ADD COLUMN IF NOT EXISTS warehouse_name TEXT,
  ADD COLUMN IF NOT EXISTS amount_ht NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED;

-- FK
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_client_id_fkey;
ALTER TABLE public.sales ADD CONSTRAINT sales_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_campagne_id_fkey;
ALTER TABLE public.sales ADD CONSTRAINT sales_campagne_id_fkey FOREIGN KEY (campagne_id) REFERENCES public.campagnes(id) ON DELETE SET NULL;
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;

ALTER TABLE public.production_records DROP CONSTRAINT IF EXISTS production_records_bassin_id_fkey;
ALTER TABLE public.production_records ADD CONSTRAINT production_records_bassin_id_fkey FOREIGN KEY (bassin_id) REFERENCES public.bassins(id) ON DELETE SET NULL;
ALTER TABLE public.production_records DROP CONSTRAINT IF EXISTS production_records_campagne_id_fkey;
ALTER TABLE public.production_records ADD CONSTRAINT production_records_campagne_id_fkey FOREIGN KEY (campagne_id) REFERENCES public.campagnes(id) ON DELETE SET NULL;
ALTER TABLE public.production_records DROP CONSTRAINT IF EXISTS production_records_team_id_fkey;
ALTER TABLE public.production_records ADD CONSTRAINT production_records_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- accounts.balance alias
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS balance NUMERIC GENERATED ALWAYS AS (current_balance) STORED;

-- enums
ALTER TYPE supplier_type ADD VALUE IF NOT EXISTS 'fournisseur';
ALTER TYPE sale_status ADD VALUE IF NOT EXISTS 'invoiced';
ALTER TYPE sale_status ADD VALUE IF NOT EXISTS 'completed';

-- purchase_order_items
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS received_notes TEXT;

-- admin_settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, setting_key)
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS as_select ON public.admin_settings;
CREATE POLICY as_select ON public.admin_settings FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS as_ins ON public.admin_settings;
CREATE POLICY as_ins ON public.admin_settings FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));
DROP POLICY IF EXISTS as_upd ON public.admin_settings;
CREATE POLICY as_upd ON public.admin_settings FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND
    (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));
DROP POLICY IF EXISTS as_del ON public.admin_settings;
CREATE POLICY as_del ON public.admin_settings FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
