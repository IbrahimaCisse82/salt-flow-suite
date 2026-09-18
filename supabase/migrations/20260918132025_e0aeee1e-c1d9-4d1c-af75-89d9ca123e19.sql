-- 1. push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid,
  endpoint text NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS trg_push_subscriptions_uat ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_uat BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant ON public.push_subscriptions(tenant_id);

-- 2. cost_per_ton
CREATE TABLE IF NOT EXISTS public.cost_per_ton (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  campagne_id uuid REFERENCES public.campagnes(id) ON DELETE SET NULL,
  calculation_date date NOT NULL DEFAULT CURRENT_DATE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_production_kg numeric NOT NULL DEFAULT 0,
  total_production_tons numeric GENERATED ALWAYS AS (total_production_kg / 1000.0) STORED,
  cout_main_oeuvre numeric NOT NULL DEFAULT 0,
  cout_matieres_premieres numeric NOT NULL DEFAULT 0,
  cout_energie numeric NOT NULL DEFAULT 0,
  cout_transport numeric NOT NULL DEFAULT 0,
  cout_maintenance numeric NOT NULL DEFAULT 0,
  cout_amortissement numeric NOT NULL DEFAULT 0,
  autres_couts numeric NOT NULL DEFAULT 0,
  cout_total numeric GENERATED ALWAYS AS (
    cout_main_oeuvre + cout_matieres_premieres + cout_energie + cout_transport
    + cout_maintenance + cout_amortissement + autres_couts) STORED,
  cout_par_tonne numeric GENERATED ALWAYS AS (
    CASE WHEN total_production_kg > 0
      THEN (cout_main_oeuvre + cout_matieres_premieres + cout_energie + cout_transport
            + cout_maintenance + cout_amortissement + autres_couts) / (total_production_kg / 1000.0)
      ELSE 0 END) STORED,
  details_par_type jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'calculated',
  notes text,
  deleted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_per_ton TO authenticated;
GRANT ALL ON public.cost_per_ton TO service_role;

ALTER TABLE public.cost_per_ton ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cost_per_ton_select" ON public.cost_per_ton;
CREATE POLICY "cost_per_ton_select" ON public.cost_per_ton
  FOR SELECT TO authenticated USING (public.is_tenant_member((select auth.uid()), tenant_id));
DROP POLICY IF EXISTS "cost_per_ton_insert" ON public.cost_per_ton;
CREATE POLICY "cost_per_ton_insert" ON public.cost_per_ton
  FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member((select auth.uid()), tenant_id));
DROP POLICY IF EXISTS "cost_per_ton_update" ON public.cost_per_ton;
CREATE POLICY "cost_per_ton_update" ON public.cost_per_ton
  FOR UPDATE TO authenticated USING (public.is_tenant_member((select auth.uid()), tenant_id))
  WITH CHECK (public.is_tenant_member((select auth.uid()), tenant_id));
DROP POLICY IF EXISTS "cost_per_ton_delete" ON public.cost_per_ton;
CREATE POLICY "cost_per_ton_delete" ON public.cost_per_ton
  FOR DELETE TO authenticated USING (public.is_tenant_member((select auth.uid()), tenant_id));

DROP TRIGGER IF EXISTS trg_cost_per_ton_uat ON public.cost_per_ton;
CREATE TRIGGER trg_cost_per_ton_uat BEFORE UPDATE ON public.cost_per_ton
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cost_per_ton_tenant ON public.cost_per_ton(tenant_id, period_end DESC);

-- 3. calculate_cost_per_ton
CREATE OR REPLACE FUNCTION public.calculate_cost_per_ton(
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date,
  p_campagne_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kg numeric; _tons numeric;
  _mo numeric; _mp numeric; _energie numeric; _transport numeric;
  _maintenance numeric; _amort numeric; _autres numeric; _total numeric;
  _stock_value numeric; _stock_qty numeric;
  _details jsonb;
BEGIN
  IF NOT (public.is_tenant_member(auth.uid(), p_tenant_id)
          OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT COALESCE(SUM(quantity_kg),0) INTO _kg
    FROM public.production_records
   WHERE tenant_id = p_tenant_id
     AND production_date BETWEEN p_period_start AND p_period_end
     AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);
  _tons := _kg / 1000.0;

  SELECT
    COALESCE(SUM(CASE WHEN left(account_number,2) IN ('66','63') THEN debit - credit END),0),
    COALESCE(SUM(CASE WHEN left(account_number,2) IN ('60','61') AND left(account_number,3) NOT IN ('605','606','611') THEN debit - credit END),0),
    COALESCE(SUM(CASE WHEN left(account_number,3) IN ('605','606') THEN debit - credit END),0),
    COALESCE(SUM(CASE WHEN left(account_number,3) IN ('611','612','613') THEN debit - credit END),0),
    COALESCE(SUM(CASE WHEN left(account_number,3) IN ('615','624') THEN debit - credit END),0),
    COALESCE(SUM(CASE WHEN left(account_number,2) = '68' THEN debit - credit END),0),
    COALESCE(SUM(CASE WHEN left(account_number,1) = '6'
                       AND left(account_number,2) NOT IN ('66','63','60','61','68')
                      THEN debit - credit END),0)
  INTO _mo, _mp, _energie, _transport, _maintenance, _amort, _autres
  FROM public.journal_entries
  WHERE tenant_id = p_tenant_id
    AND entry_date BETWEEN p_period_start AND p_period_end;

  _mo := GREATEST(_mo,0); _mp := GREATEST(_mp,0); _energie := GREATEST(_energie,0);
  _transport := GREATEST(_transport,0); _maintenance := GREATEST(_maintenance,0);
  _amort := GREATEST(_amort,0); _autres := GREATEST(_autres,0);
  _total := _mo + _mp + _energie + _transport + _maintenance + _amort + _autres;

  SELECT COALESCE(SUM(quantity * COALESCE(unit_cost,0)),0), COALESCE(SUM(quantity),0)
    INTO _stock_value, _stock_qty
    FROM public.inventory_items
   WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;

  SELECT COALESCE(jsonb_object_agg(t.salt_type, jsonb_build_object(
           'production_kg', t.kg,
           'production_tons', t.kg / 1000.0,
           'cout_estime', CASE WHEN _kg > 0 THEN _total * (t.kg / _kg) ELSE 0 END,
           'cmp_unitaire', CASE WHEN t.kg > 0 AND _kg > 0
                                THEN (_total * (t.kg / _kg)) / t.kg ELSE 0 END)), '{}'::jsonb)
    INTO _details
    FROM (
      SELECT COALESCE(salt_type,'non_defini') AS salt_type, COALESCE(SUM(quantity_kg),0) AS kg
        FROM public.production_records
       WHERE tenant_id = p_tenant_id
         AND production_date BETWEEN p_period_start AND p_period_end
         AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id)
       GROUP BY 1
    ) t;

  RETURN jsonb_build_object(
    'total_production_kg', _kg,
    'total_production_tons', _tons,
    'cout_main_oeuvre', _mo,
    'cout_matieres_premieres', _mp,
    'cout_energie', _energie,
    'cout_transport', _transport,
    'cout_maintenance', _maintenance,
    'cout_amortissement', _amort,
    'autres_couts', _autres,
    'cout_total', _total,
    'cout_par_tonne', CASE WHEN _tons > 0 THEN _total / _tons ELSE 0 END,
    'stock_value', _stock_value,
    'stock_cmp_moyen', CASE WHEN _stock_qty > 0 THEN _stock_value / _stock_qty ELSE 0 END,
    'details_par_type', _details,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'generated_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_cost_per_ton(uuid,date,date,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_cost_per_ton(uuid,date,date,uuid) TO authenticated, service_role;

-- 4. dispose_fixed_asset
CREATE OR REPLACE FUNCTION public.dispose_fixed_asset(
  p_asset_id uuid,
  p_disposal_type text,
  p_disposal_price numeric DEFAULT 0,
  p_disposal_date date DEFAULT CURRENT_DATE,
  p_payment_account_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _asset public.fixed_assets%ROWTYPE;
  _vnc numeric; _price numeric; _result numeric; _status fixed_asset_status;
BEGIN
  SELECT * INTO _asset FROM public.fixed_assets WHERE id = p_asset_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Immobilisation introuvable'; END IF;

  PERFORM public.assert_accounting_access(_asset.tenant_id);

  IF _asset.status IN ('disposed','scrapped') THEN
    RAISE EXCEPTION 'Cette immobilisation a déjà été cédée';
  END IF;

  _price := CASE WHEN p_disposal_type = 'scrap' THEN 0 ELSE COALESCE(p_disposal_price,0) END;
  _vnc := GREATEST(COALESCE(_asset.acquisition_cost,0) - COALESCE(_asset.accumulated_depreciation,0), 0);
  _result := _price - _vnc;
  _status := CASE WHEN p_disposal_type = 'scrap' THEN 'scrapped' ELSE 'disposed' END;

  UPDATE public.fixed_assets
     SET status = _status,
         disposal_date = COALESCE(p_disposal_date, CURRENT_DATE),
         disposal_value = _price,
         net_book_value = 0,
         notes = COALESCE(p_notes, notes),
         updated_at = now()
   WHERE id = p_asset_id;

  PERFORM public.emit_domain_event(_asset.tenant_id, 'fixed_asset.disposed', 'fixed_asset', p_asset_id,
    jsonb_build_object('disposal_type', p_disposal_type, 'price', _price, 'vnc', _vnc, 'result', _result));

  RETURN jsonb_build_object(
    'asset_id', p_asset_id,
    'asset_name', _asset.asset_name,
    'disposal_type', p_disposal_type,
    'disposal_price', _price,
    'net_book_value', _vnc,
    'result_type', CASE WHEN _result >= 0 THEN 'plus_value' ELSE 'moins_value' END,
    'result_amount', abs(_result));
END;
$$;

REVOKE ALL ON FUNCTION public.dispose_fixed_asset(uuid,text,numeric,date,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispose_fixed_asset(uuid,text,numeric,date,uuid,text) TO authenticated, service_role;