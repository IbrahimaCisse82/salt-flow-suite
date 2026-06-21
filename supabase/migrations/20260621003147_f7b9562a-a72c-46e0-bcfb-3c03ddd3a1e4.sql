
-- 1. inventory_items aliases
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS item_name TEXT GENERATED ALWAYS AS (name) STORED,
  ADD COLUMN IF NOT EXISTS storage_location TEXT;

-- 2. fixed_assets alias
ALTER TABLE public.fixed_assets
  ADD COLUMN IF NOT EXISTS total_depreciated NUMERIC(15,2) GENERATED ALWAYS AS (accumulated_depreciation) STORED;

-- 3. payroll_payments enrichments
ALTER TABLE public.payroll_payments
  ADD COLUMN IF NOT EXISTS attendance_id UUID REFERENCES public.team_attendance(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_to TEXT,
  ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

UPDATE public.payroll_payments SET paid_amount = amount WHERE paid_amount = 0 AND amount > 0;

-- 4. notification_history enrichments
ALTER TABLE public.notification_history
  ADD COLUMN IF NOT EXISTS reference_id UUID,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT now();

UPDATE public.notification_history SET sent_at = created_at WHERE sent_at IS NULL;

-- 5. sale_status: add 'pending'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'sale_status')) THEN
    ALTER TYPE public.sale_status ADD VALUE 'pending';
  END IF;
END $$;

-- 6. Inventory valuation tables
CREATE TABLE IF NOT EXISTS public.inventory_valuation_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  source_type TEXT,
  reference_id UUID,
  quantity NUMERIC NOT NULL,
  remaining_quantity NUMERIC NOT NULL,
  unit_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  layer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_valuation_layers TO authenticated;
GRANT ALL ON public.inventory_valuation_layers TO service_role;
ALTER TABLE public.inventory_valuation_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ivl_select" ON public.inventory_valuation_layers FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "ivl_insert" ON public.inventory_valuation_layers FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "ivl_update" ON public.inventory_valuation_layers FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "ivl_delete" ON public.inventory_valuation_layers FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND (public.has_role(auth.uid(),'gerant'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));

CREATE INDEX IF NOT EXISTS idx_ivl_tenant_item ON public.inventory_valuation_layers(tenant_id, inventory_item_id);

CREATE TABLE IF NOT EXISTS public.inventory_valuation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_on_hand NUMERIC NOT NULL DEFAULT 0,
  cmp NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, snapshot_date, inventory_item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_valuation_snapshots TO authenticated;
GRANT ALL ON public.inventory_valuation_snapshots TO service_role;
ALTER TABLE public.inventory_valuation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ivs_select" ON public.inventory_valuation_snapshots FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "ivs_insert" ON public.inventory_valuation_snapshots FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "ivs_update" ON public.inventory_valuation_snapshots FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "ivs_delete" ON public.inventory_valuation_snapshots FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND (public.has_role(auth.uid(),'gerant'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));

CREATE INDEX IF NOT EXISTS idx_ivs_tenant_date ON public.inventory_valuation_snapshots(tenant_id, snapshot_date);

-- 7. RPC: create monthly valuation snapshot
CREATE OR REPLACE FUNCTION public.create_valuation_snapshot(p_snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant UUID;
  _count INT;
BEGIN
  _tenant := public.get_user_tenant_id(auth.uid());
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant introuvable';
  END IF;
  IF NOT (public.has_role(auth.uid(),'comptable'::app_role)
       OR public.has_role(auth.uid(),'gerant'::app_role)
       OR public.has_role(auth.uid(),'admin'::app_role)) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  INSERT INTO public.inventory_valuation_snapshots
    (tenant_id, snapshot_date, inventory_item_id, quantity_on_hand, cmp, total_value)
  SELECT i.tenant_id, p_snapshot_date, i.id, i.quantity, i.cmp, (i.quantity * i.cmp)
    FROM public.inventory_items i
   WHERE i.tenant_id = _tenant AND i.is_active = true
  ON CONFLICT (tenant_id, snapshot_date, inventory_item_id) DO UPDATE
    SET quantity_on_hand = EXCLUDED.quantity_on_hand,
        cmp = EXCLUDED.cmp,
        total_value = EXCLUDED.total_value;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'count', _count, 'snapshot_date', p_snapshot_date);
END $$;

REVOKE EXECUTE ON FUNCTION public.create_valuation_snapshot(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_valuation_snapshot(DATE) TO authenticated;
