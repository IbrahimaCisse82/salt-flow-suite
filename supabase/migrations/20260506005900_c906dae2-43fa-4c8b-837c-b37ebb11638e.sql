
ALTER TABLE public.production_records
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS production_date DATE,
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS traceability_code TEXT;
UPDATE public.production_records SET quantity = quantity_tonnes WHERE quantity IS NULL;
UPDATE public.production_records SET production_date = harvest_date WHERE production_date IS NULL;

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS item_category TEXT,
  ADD COLUMN IF NOT EXISTS is_received BOOLEAN NOT NULL DEFAULT false;
DO $$ BEGIN
  ALTER TABLE public.purchase_order_items
    ADD COLUMN line_total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
UPDATE public.purchase_order_items SET item_name = description WHERE item_name IS NULL;

ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'pending_approval';

ALTER TABLE public.campagnes ADD COLUMN IF NOT EXISTS actual_production NUMERIC;
UPDATE public.campagnes SET actual_production = actual_production_tonnes WHERE actual_production IS NULL;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tenant_id UUID;

DROP FUNCTION IF EXISTS public.post_depreciation(UUID);
CREATE FUNCTION public.post_depreciation(p_schedule_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _tenant UUID;
BEGIN
  _tenant := get_user_tenant_id(auth.uid());
  UPDATE public.depreciation_schedule SET is_posted = true, posted_at = now()
    WHERE id = p_schedule_id AND tenant_id = _tenant;
  RETURN jsonb_build_object('success', true);
END; $$;
