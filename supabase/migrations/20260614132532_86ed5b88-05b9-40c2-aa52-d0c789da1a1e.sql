
-- ============== P0 FINALIZATION ==============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'u' AND conname = 'profiles_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN duplicate_table OR unique_violation THEN
      CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_uniq ON public.profiles(user_id);
    END;
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_tenant_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.tenant_id IS NOT NULL AND NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'tenant_id du profil est immuable';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_profile_tenant_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_tenant_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_tenant_change();

DO $$
DECLARE _p RECORD;
BEGIN
  FOR _p IN
    SELECT polname FROM pg_policy WHERE polrelid = 'public.scheduled_reports'::regclass AND polcmd = 'r'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.scheduled_reports', _p.polname);
  END LOOP;
END$$;

CREATE POLICY scheduled_reports_select_financial ON public.scheduled_reports
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gerant'::app_role)
      OR public.has_role(auth.uid(), 'comptable'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- ============== P1a SCHEMA ADDITIONS ==============
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS item_category TEXT GENERATED ALWAYS AS (category) STORED,
  ADD COLUMN IF NOT EXISTS quantity_on_hand NUMERIC GENERATED ALWAYS AS (quantity) STORED;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC NOT NULL DEFAULT 0;

ALTER TYPE public.po_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.po_status ADD VALUE IF NOT EXISTS 'partially_received';

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS item_description TEXT GENERATED ALWAYS AS (description) STORED;

CREATE TABLE IF NOT EXISTS public.purchase_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  changed_by UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.purchase_order_history TO authenticated;
GRANT ALL ON public.purchase_order_history TO service_role;

ALTER TABLE public.purchase_order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS poh_select_tenant ON public.purchase_order_history;
CREATE POLICY poh_select_tenant ON public.purchase_order_history
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS poh_insert_financial ON public.purchase_order_history;
CREATE POLICY poh_insert_financial ON public.purchase_order_history
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gerant'::app_role)
      OR public.has_role(auth.uid(), 'comptable'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'magasinier'::app_role)
    )
  );

CREATE INDEX IF NOT EXISTS idx_poh_tenant ON public.purchase_order_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_poh_po ON public.purchase_order_history(purchase_order_id);

ALTER TABLE public.quality_tests
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS salt_purity NUMERIC GENERATED ALWAYS AS (purity_percent) STORED;

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'autre';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'depense';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS campagne_phase TEXT;

CREATE OR REPLACE FUNCTION public.validate_transaction(_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tenant UUID;
BEGIN
  _tenant := public.get_user_tenant_id(auth.uid());
  IF NOT (public.has_role(auth.uid(),'comptable'::app_role)
       OR public.has_role(auth.uid(),'gerant'::app_role)
       OR public.has_role(auth.uid(),'admin'::app_role)) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  UPDATE public.transactions
     SET status = 'validated', is_validated = true,
         validated_by = auth.uid(), validated_at = now()
   WHERE id = _id AND tenant_id = _tenant;
  RETURN jsonb_build_object('success', true);
END $$;

CREATE OR REPLACE FUNCTION public.validate_transactions_bulk(_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tenant UUID; _count int;
BEGIN
  _tenant := public.get_user_tenant_id(auth.uid());
  IF NOT (public.has_role(auth.uid(),'comptable'::app_role)
       OR public.has_role(auth.uid(),'gerant'::app_role)
       OR public.has_role(auth.uid(),'admin'::app_role)) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  UPDATE public.transactions
     SET status = 'validated', is_validated = true,
         validated_by = auth.uid(), validated_at = now()
   WHERE id = ANY(_ids) AND tenant_id = _tenant;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'count', _count);
END $$;

REVOKE EXECUTE ON FUNCTION public.validate_transaction(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_transactions_bulk(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_transaction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_transactions_bulk(uuid[]) TO authenticated;

ALTER TABLE public.campagnes
  ADD COLUMN IF NOT EXISTS active_phase_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase_end_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS salt_type TEXT,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS traceability_code TEXT;
