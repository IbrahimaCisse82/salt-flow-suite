-- ============================================================
-- PHASE 0 — FOUNDATION
-- ============================================================

-- 1) has_any_role -------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;

-- 2) domain_events -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.domain_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  event_type    TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id  UUID NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  processing_error TEXT,
  created_by    UUID
);

GRANT SELECT ON public.domain_events TO authenticated;
GRANT ALL ON public.domain_events TO service_role;

ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "domain_events_select_tenant" ON public.domain_events;
CREATE POLICY "domain_events_select_tenant" ON public.domain_events
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid())
         OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_domain_events_unprocessed
  ON public.domain_events (occurred_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_domain_events_tenant_type
  ON public.domain_events (tenant_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate
  ON public.domain_events (aggregate_type, aggregate_id);

CREATE OR REPLACE FUNCTION public.emit_domain_event(
  _tenant_id uuid, _event_type text, _aggregate_type text,
  _aggregate_id uuid, _payload jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.domain_events (tenant_id, event_type, aggregate_type, aggregate_id, payload, created_by)
  VALUES (_tenant_id, _event_type, _aggregate_type, _aggregate_id, COALESCE(_payload,'{}'::jsonb), auth.uid())
  RETURNING id INTO _id;
  RETURN _id;
END $$;

REVOKE EXECUTE ON FUNCTION public.emit_domain_event(uuid,text,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emit_domain_event(uuid,text,text,uuid,jsonb) TO service_role;

-- 3) prevent_tenant_change généralisé -----------------------------
CREATE OR REPLACE FUNCTION public.prevent_tenant_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'tenant_id immuable (table %)', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DO $do$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN information_schema.columns col
      ON col.table_schema = 'public' AND col.table_name = c.relname AND col.column_name = 'tenant_id'
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname NOT IN ('profiles','domain_events','document_sequences')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_tenant_change ON public.%I', r.relname);
    EXECUTE format(
      'CREATE TRIGGER trg_prevent_tenant_change BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_change()', r.relname);
  END LOOP;
END $do$;

-- 4) deleted_at généralisé ----------------------------------------
DO $do$
DECLARE t TEXT;
  tables TEXT[] := ARRAY[
    'sales','sale_items','suppliers','inventory_items','campagnes','teams',
    'daily_workers','warehouses','chart_of_accounts','expense_types','accounts',
    'production_records','fixed_assets','quality_tests','quality_certificates',
    'payroll_payments','scheduled_reports','admin_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_not_deleted ON public.%I (tenant_id) WHERE deleted_at IS NULL', t, t);
    END IF;
  END LOOP;
END $do$;

-- 5) Audit intégral sur les tables financières --------------------
DO $do$
DECLARE t TEXT;
  fin_tables TEXT[] := ARRAY[
    'stock_movements','sale_items','sales','purchase_payments','purchase_orders',
    'purchase_order_items','payments','payroll_payments','depreciation_schedule',
    'accounts','inventory_items','transaction_lines','user_roles',
    'inventory_valuation_layers','chart_of_accounts'
  ];
BEGIN
  FOREACH t IN ARRAY fin_tables LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%s ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.log_ledger_change()', t, t);
    END IF;
  END LOOP;
END $do$;

-- 6) updated_at sur domain-critical manquants ---------------------
CREATE INDEX IF NOT EXISTS idx_ledger_audit_tenant_created
  ON public.ledger_audit_log (tenant_id, created_at DESC);
