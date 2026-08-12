
-- =========================================================
-- LOT A : Moteur de comptabilisation automatique + shadow mode
-- =========================================================

-- 1. Configuration par tenant ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounting_config (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  posting_mode TEXT NOT NULL DEFAULT 'shadow' CHECK (posting_mode IN ('off','shadow','live')),
  shadow_since TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.accounting_config TO authenticated;
GRANT ALL ON public.accounting_config TO service_role;
ALTER TABLE public.accounting_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS acfg_select ON public.accounting_config;
CREATE POLICY acfg_select ON public.accounting_config FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
DROP POLICY IF EXISTS acfg_write ON public.accounting_config;
CREATE POLICY acfg_write ON public.accounting_config FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id)
              AND public.has_any_role(auth.uid(), ARRAY['gerant','comptable','admin']::app_role[]));
DROP POLICY IF EXISTS acfg_update ON public.accounting_config;
CREATE POLICY acfg_update ON public.accounting_config FOR UPDATE TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id)
         AND public.has_any_role(auth.uid(), ARRAY['gerant','comptable','admin']::app_role[]))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER trg_acfg_uat BEFORE UPDATE ON public.accounting_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Écritures simulées (shadow) ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounting_shadow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  entry_date DATE NOT NULL,
  journal_code TEXT NOT NULL,
  description TEXT,
  source_table TEXT,
  source_id UUID,
  lines JSONB NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.accounting_shadow_entries TO authenticated;
GRANT ALL ON public.accounting_shadow_entries TO service_role;
ALTER TABLE public.accounting_shadow_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ashadow_select ON public.accounting_shadow_entries;
CREATE POLICY ashadow_select ON public.accounting_shadow_entries FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE INDEX IF NOT EXISTS idx_shadow_tenant_date
  ON public.accounting_shadow_entries (tenant_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_shadow_source
  ON public.accounting_shadow_entries (source_table, source_id);

-- 3. Résolution de compte -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_account(_tenant_id UUID, _number TEXT, _name TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id UUID; _class INT; _type account_type;
BEGIN
  SELECT id INTO _id FROM public.chart_of_accounts
    WHERE tenant_id = _tenant_id AND account_number = _number AND deleted_at IS NULL LIMIT 1;
  IF _id IS NOT NULL THEN RETURN _id; END IF;

  SELECT id INTO _id FROM public.chart_of_accounts
    WHERE tenant_id = _tenant_id AND account_number LIKE _number || '%' AND deleted_at IS NULL
    ORDER BY length(account_number), account_number LIMIT 1;
  IF _id IS NOT NULL THEN RETURN _id; END IF;

  _class := LEFT(_number, 1)::INT;
  _type := CASE _class
    WHEN 1 THEN 'capitaux'::account_type
    WHEN 6 THEN 'charge'::account_type
    WHEN 7 THEN 'produit'::account_type
    WHEN 8 THEN 'charge'::account_type
    ELSE 'actif'::account_type END;

  INSERT INTO public.chart_of_accounts
    (tenant_id, account_number, account_name, account_type, account_class, is_system, is_active)
  VALUES (_tenant_id, _number, COALESCE(_name, 'Compte ' || _number), _type, _class, true, true)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- 4. Moteur de comptabilisation ----------------------------------------------
CREATE OR REPLACE FUNCTION public.post_accounting_entry(
  _tenant_id UUID,
  _event_type TEXT,
  _entry_date DATE,
  _journal TEXT,
  _description TEXT,
  _source_table TEXT,
  _source_id UUID,
  _lines JSONB,
  _tx_type transaction_type DEFAULT 'od'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _mode TEXT;
  _tx UUID;
  _line JSONB;
  _acc UUID;
  _debit NUMERIC; _credit NUMERIC;
  _total NUMERIC := 0;
  _order INT := 0;
BEGIN
  IF _tenant_id IS NULL OR _lines IS NULL OR jsonb_array_length(_lines) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT posting_mode INTO _mode FROM public.accounting_config WHERE tenant_id = _tenant_id;
  IF _mode IS NULL THEN
    INSERT INTO public.accounting_config (tenant_id) VALUES (_tenant_id)
      ON CONFLICT (tenant_id) DO NOTHING;
    _mode := 'shadow';
  END IF;
  IF _mode = 'off' THEN RETURN NULL; END IF;

  SELECT COALESCE(SUM(GREATEST((l->>'debit')::NUMERIC, 0)), 0) INTO _total
    FROM jsonb_array_elements(_lines) l;
  IF _total = 0 THEN RETURN NULL; END IF;

  IF _mode = 'shadow' THEN
    INSERT INTO public.accounting_shadow_entries
      (tenant_id, event_type, entry_date, journal_code, description, source_table, source_id, lines, total_amount)
    VALUES (_tenant_id, _event_type, _entry_date, _journal, _description, _source_table, _source_id, _lines, _total)
    RETURNING id INTO _tx;
    RETURN _tx;
  END IF;

  -- mode live
  INSERT INTO public.transactions
    (tenant_id, transaction_date, transaction_type, journal_code, description, amount,
     status, source_table, source_id, created_by)
  VALUES (_tenant_id, _entry_date, _tx_type, _journal, _description, _total,
          'draft', _source_table, _source_id, auth.uid())
  RETURNING id INTO _tx;

  FOR _line IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    _acc := public.resolve_account(_tenant_id, _line->>'account', _line->>'label');
    _debit := COALESCE((_line->>'debit')::NUMERIC, 0);
    _credit := COALESCE((_line->>'credit')::NUMERIC, 0);
    _order := _order + 1;

    INSERT INTO public.transaction_lines
      (tenant_id, transaction_id, account_id, debit, credit, description, line_order)
    VALUES (_tenant_id, _tx, _acc, _debit, _credit, COALESCE(_line->>'label', _description), _order);

    INSERT INTO public.journal_entries
      (tenant_id, transaction_id, entry_date, journal_code, account_id,
       account_number, account_name, description, debit, credit, created_by)
    SELECT _tenant_id, _tx, _entry_date, _journal, _acc,
           coa.account_number, coa.account_name,
           COALESCE(_line->>'label', _description), _debit, _credit, auth.uid()
    FROM public.chart_of_accounts coa WHERE coa.id = _acc;
  END LOOP;

  UPDATE public.transactions SET status = 'validated', is_validated = true WHERE id = _tx;

  PERFORM public.emit_domain_event(_tenant_id, 'accounting.entry_posted', 'transaction', _tx,
    jsonb_build_object('event_type', _event_type, 'amount', _total, 'source', _source_table));

  RETURN _tx;
END;
$$;

REVOKE ALL ON FUNCTION public.post_accounting_entry(UUID,TEXT,DATE,TEXT,TEXT,TEXT,UUID,JSONB,transaction_type) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_account(UUID,TEXT,TEXT) FROM PUBLIC, anon;

-- =========================================================
-- 5. VENTES
-- =========================================================
CREATE OR REPLACE FUNCTION public.trg_acc_sale_invoiced()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ht NUMERIC; _tva NUMERIC; _ttc NUMERIC; _lines JSONB;
BEGIN
  IF NEW.status NOT IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;

  _ttc := COALESCE(NEW.total_amount, 0);
  _tva := COALESCE(NEW.tva_amount, NEW.tax_amount, 0);
  _ht  := COALESCE(NULLIF(NEW.amount_ht, 0), _ttc - _tva);
  IF _ttc <= 0 THEN RETURN NEW; END IF;

  IF COALESCE(NEW.is_export, false) THEN
    -- E1 : vente export (exonérée de TVA)
    _lines := jsonb_build_array(
      jsonb_build_object('account','411','label','Clients','debit',_ttc,'credit',0),
      jsonb_build_object('account','702','label','Ventes à l''export','debit',0,'credit',_ttc));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_invoiced_export',NEW.sale_date,'VE',
      'Facture export ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'vente_export');
  ELSE
    -- E2 : vente locale avec TVA facturée
    _lines := jsonb_build_array(
      jsonb_build_object('account','411','label','Clients','debit',_ttc,'credit',0),
      jsonb_build_object('account','701','label','Ventes de produits finis','debit',0,'credit',_ht));
    IF _tva > 0 THEN
      _lines := _lines || jsonb_build_array(
        jsonb_build_object('account','4431','label','TVA facturée','debit',0,'credit',_tva));
    END IF;
    PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_invoiced_local',NEW.sale_date,'VE',
      'Facture ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'vente_locale');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_sale_invoiced ON public.sales;
CREATE TRIGGER trg_acc_sale_invoiced AFTER INSERT OR UPDATE OF status ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_sale_invoiced();

-- E3 : coût des ventes (sortie de stock à la livraison)
CREATE OR REPLACE FUNCTION public.trg_acc_sale_cogs()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cost NUMERIC := 0; _lines JSONB;
BEGIN
  IF NEW.status NOT IN ('delivered','completed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('delivered','completed') THEN RETURN NEW; END IF;

  SELECT COALESCE(SUM(si.quantity * COALESCE(ii.cmp, ii.unit_cost, 0)), 0) INTO _cost
    FROM public.sale_items si
    LEFT JOIN public.inventory_items ii ON ii.id = si.inventory_item_id
    WHERE si.sale_id = NEW.id;
  IF _cost <= 0 THEN RETURN NEW; END IF;

  _lines := jsonb_build_array(
    jsonb_build_object('account','6031','label','Variation des stocks de produits finis','debit',_cost,'credit',0),
    jsonb_build_object('account','36','label','Produits finis','debit',0,'credit',_cost));
  PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_cogs',COALESCE(NEW.delivery_date, NEW.sale_date),'ST',
    'Coût des ventes ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'od');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_sale_cogs ON public.sales;
CREATE TRIGGER trg_acc_sale_cogs AFTER INSERT OR UPDATE OF status ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_sale_cogs();

-- E4/E5 : encaissement client / avance client
CREATE OR REPLACE FUNCTION public.trg_acc_client_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cash TEXT; _lines JSONB; _amt NUMERIC;
BEGIN
  _amt := COALESCE(NEW.amount, 0);
  IF _amt <= 0 THEN RETURN NEW; END IF;
  _cash := CASE WHEN NEW.payment_method IN ('especes','cash','mobile_money') THEN '571' ELSE '521' END;

  IF NEW.sale_id IS NULL THEN
    -- avance client sans facture
    _lines := jsonb_build_array(
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',_amt,'credit',0),
      jsonb_build_object('account','4191','label','Clients, avances reçues','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'client_advance',NEW.payment_date,'TR',
      'Avance client','payments',NEW.id,_lines,'encaissement_client');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',_amt,'credit',0),
      jsonb_build_object('account','411','label','Clients','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'client_payment',NEW.payment_date,'TR',
      'Encaissement client ' || COALESCE(NEW.reference,''),'payments',NEW.id,_lines,'encaissement_client');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_client_payment ON public.payments;
CREATE TRIGGER trg_acc_client_payment AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_client_payment();

-- =========================================================
-- 6. ACHATS
-- =========================================================
CREATE OR REPLACE FUNCTION public.trg_acc_purchase_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ht NUMERIC; _tva NUMERIC; _ttc NUMERIC; _lines JSONB; _has_stock BOOLEAN;
BEGIN
  IF NEW.status NOT IN ('received','partially_received') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('received','partially_received') THEN RETURN NEW; END IF;

  _ttc := COALESCE(NEW.total_amount, 0);
  _tva := COALESCE(NEW.tva_amount, NEW.tax_amount, 0);
  _ht  := COALESCE(NULLIF(NEW.amount_ht, 0), _ttc - _tva);
  IF _ttc <= 0 THEN RETURN NEW; END IF;

  SELECT EXISTS (SELECT 1 FROM public.purchase_order_items
                 WHERE purchase_order_id = NEW.id AND inventory_item_id IS NOT NULL)
    INTO _has_stock;

  IF _has_stock THEN
    -- E6 : achat stocké
    _lines := jsonb_build_array(
      jsonb_build_object('account','601','label','Achats de matières premières','debit',_ht,'credit',0));
  ELSE
    -- E7 : achat de services / autres charges externes
    _lines := jsonb_build_array(
      jsonb_build_object('account','605','label','Autres achats','debit',_ht,'credit',0));
  END IF;
  IF _tva > 0 THEN
    _lines := _lines || jsonb_build_array(
      jsonb_build_object('account','4451','label','TVA récupérable','debit',_tva,'credit',0));
  END IF;
  _lines := _lines || jsonb_build_array(
    jsonb_build_object('account','401','label','Fournisseurs','debit',0,'credit',_ttc));

  PERFORM public.post_accounting_entry(NEW.tenant_id,
    CASE WHEN _has_stock THEN 'purchase_received_stock' ELSE 'purchase_received_service' END,
    COALESCE(NEW.delivery_date, NEW.order_date),'AC',
    'Achat ' || COALESCE(NEW.order_number,''),'purchase_orders',NEW.id,_lines,'achat');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_purchase_received ON public.purchase_orders;
CREATE TRIGGER trg_acc_purchase_received AFTER INSERT OR UPDATE OF status ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_purchase_received();

-- E8/E9 : règlement fournisseur / avance fournisseur
CREATE OR REPLACE FUNCTION public.trg_acc_purchase_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cash TEXT; _lines JSONB; _amt NUMERIC;
BEGIN
  _amt := COALESCE(NEW.amount, 0);
  IF _amt <= 0 THEN RETURN NEW; END IF;
  _cash := CASE WHEN NEW.payment_method IN ('especes','cash','mobile_money') THEN '571' ELSE '521' END;

  IF NEW.payment_type = 'advance' THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','4091','label','Fournisseurs, avances versées','debit',_amt,'credit',0),
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'supplier_advance',NEW.payment_date,'TR',
      'Avance fournisseur','purchase_payments',NEW.id,_lines,'paiement');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','401','label','Fournisseurs','debit',_amt,'credit',0),
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'supplier_payment',NEW.payment_date,'TR',
      'Règlement fournisseur','purchase_payments',NEW.id,_lines,'paiement');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_purchase_payment ON public.purchase_payments;
CREATE TRIGGER trg_acc_purchase_payment AFTER INSERT ON public.purchase_payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_purchase_payment();

-- =========================================================
-- 7. PAIE
-- =========================================================
-- E10 : charge de personnel constatée au pointage validé
CREATE OR REPLACE FUNCTION public.trg_acc_attendance_validated()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lines JSONB; _amt NUMERIC;
BEGIN
  IF NEW.status <> 'validated' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'validated' THEN RETURN NEW; END IF;
  _amt := COALESCE(NEW.calculated_amount, 0);
  IF _amt <= 0 THEN RETURN NEW; END IF;

  _lines := jsonb_build_array(
    jsonb_build_object('account','661','label','Rémunérations du personnel','debit',_amt,'credit',0),
    jsonb_build_object('account','422','label','Personnel, rémunérations dues','debit',0,'credit',_amt));
  PERFORM public.post_accounting_entry(NEW.tenant_id,'payroll_accrual',NEW.attendance_date,'OD',
    'Charge de personnel (pointage validé)','team_attendance',NEW.id,_lines,'paie');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_attendance_validated ON public.team_attendance;
CREATE TRIGGER trg_acc_attendance_validated AFTER INSERT OR UPDATE OF status ON public.team_attendance
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_attendance_validated();

-- E11 : paiement de salaire
CREATE OR REPLACE FUNCTION public.trg_acc_payroll_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cash TEXT; _lines JSONB; _amt NUMERIC;
BEGIN
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN RETURN NEW; END IF;
  _amt := COALESCE(NULLIF(NEW.paid_amount,0), NEW.amount, 0);
  IF _amt <= 0 THEN RETURN NEW; END IF;
  _cash := CASE WHEN COALESCE(NEW.payment_method,'') IN ('especes','cash','mobile_money') THEN '571' ELSE '521' END;

  _lines := jsonb_build_array(
    jsonb_build_object('account','422','label','Personnel, rémunérations dues','debit',_amt,'credit',0),
    jsonb_build_object('account',_cash,'label','Trésorerie','debit',0,'credit',_amt));
  PERFORM public.post_accounting_entry(NEW.tenant_id,'payroll_payment',NEW.payment_date,'TR',
    'Paiement salaire','payroll_payments',NEW.id,_lines,'paie');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_payroll_payment ON public.payroll_payments;
CREATE TRIGGER trg_acc_payroll_payment AFTER INSERT OR UPDATE OF status ON public.payroll_payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_payroll_payment();

-- =========================================================
-- 8. PRODUCTION & STOCKS
-- =========================================================
-- E12 : production stockée
CREATE OR REPLACE FUNCTION public.trg_acc_production_stored()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _val NUMERIC; _lines JSONB;
BEGIN
  _val := COALESCE(NEW.quantity_tonnes, NEW.quantity, 0) * COALESCE(NEW.cost_per_ton, 0);
  IF _val <= 0 THEN RETURN NEW; END IF;

  _lines := jsonb_build_array(
    jsonb_build_object('account','36','label','Produits finis','debit',_val,'credit',0),
    jsonb_build_object('account','736','label','Variation des stocks de produits finis','debit',0,'credit',_val));
  PERFORM public.post_accounting_entry(NEW.tenant_id,'production_stored',
    COALESCE(NEW.production_date, NEW.harvest_date),'ST',
    'Production stockée','production_records',NEW.id,_lines,'od');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_production_stored ON public.production_records;
CREATE TRIGGER trg_acc_production_stored AFTER INSERT ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_production_stored();

-- E13/E14 : écarts d'inventaire (perte / gain)
CREATE OR REPLACE FUNCTION public.trg_acc_stock_adjustment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _val NUMERIC; _lines JSONB;
BEGIN
  IF NEW.movement_type <> 'adjustment' THEN RETURN NEW; END IF;
  _val := ABS(COALESCE(NEW.new_quantity,0) - COALESCE(NEW.previous_quantity,0)) * COALESCE(NEW.unit_cost,0);
  IF _val <= 0 THEN RETURN NEW; END IF;

  IF COALESCE(NEW.new_quantity,0) < COALESCE(NEW.previous_quantity,0) THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','6581','label','Pertes sur stocks','debit',_val,'credit',0),
      jsonb_build_object('account','31','label','Stocks','debit',0,'credit',_val));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'stock_loss',NEW.created_at::date,'ST',
      'Écart d''inventaire (perte) — ' || NEW.item_name,'stock_movements',NEW.id,_lines,'od');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','31','label','Stocks','debit',_val,'credit',0),
      jsonb_build_object('account','7581','label','Gains sur stocks','debit',0,'credit',_val));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'stock_gain',NEW.created_at::date,'ST',
      'Écart d''inventaire (gain) — ' || NEW.item_name,'stock_movements',NEW.id,_lines,'od');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_stock_adjustment ON public.stock_movements;
CREATE TRIGGER trg_acc_stock_adjustment AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_stock_adjustment();

-- =========================================================
-- 9. IMMOBILISATIONS
-- =========================================================
-- E15 : acquisition
CREATE OR REPLACE FUNCTION public.trg_acc_asset_acquisition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lines JSONB; _cost NUMERIC;
BEGIN
  _cost := COALESCE(NEW.acquisition_cost, 0);
  IF _cost <= 0 THEN RETURN NEW; END IF;
  _lines := jsonb_build_array(
    jsonb_build_object('account', COALESCE(NULLIF(NEW.account_number,''), '24'),
                       'label','Immobilisations corporelles','debit',_cost,'credit',0),
    jsonb_build_object('account','481','label','Fournisseurs d''investissement','debit',0,'credit',_cost));
  PERFORM public.post_accounting_entry(NEW.tenant_id,'asset_acquisition',NEW.acquisition_date,'AC',
    'Acquisition immobilisation ' || NEW.asset_name,'fixed_assets',NEW.id,_lines,'achat');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_asset_acquisition ON public.fixed_assets;
CREATE TRIGGER trg_acc_asset_acquisition AFTER INSERT ON public.fixed_assets
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_asset_acquisition();

-- E16 : cession / mise au rebut
CREATE OR REPLACE FUNCTION public.trg_acc_asset_disposal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lines JSONB; _vnc NUMERIC; _cost NUMERIC; _cum NUMERIC; _price NUMERIC;
BEGIN
  IF NEW.status NOT IN ('disposed','scrapped') THEN RETURN NEW; END IF;
  IF OLD.status IN ('disposed','scrapped') THEN RETURN NEW; END IF;

  _cost := COALESCE(NEW.acquisition_cost,0);
  _cum := COALESCE(NEW.accumulated_depreciation,0);
  _vnc := GREATEST(_cost - _cum, 0);
  _price := COALESCE(NEW.disposal_value, 0);

  _lines := jsonb_build_array(
    jsonb_build_object('account','28','label','Amortissements cumulés','debit',_cum,'credit',0),
    jsonb_build_object('account','812','label','Valeur comptable des cessions','debit',_vnc,'credit',0),
    jsonb_build_object('account', COALESCE(NULLIF(NEW.account_number,''), '24'),
                       'label','Immobilisations corporelles','debit',0,'credit',_cost));
  IF _price > 0 THEN
    _lines := _lines || jsonb_build_array(
      jsonb_build_object('account','521','label','Banque','debit',_price,'credit',0),
      jsonb_build_object('account','822','label','Produits de cession','debit',0,'credit',_price));
  END IF;

  PERFORM public.post_accounting_entry(NEW.tenant_id,'asset_disposal',
    COALESCE(NEW.disposal_date, CURRENT_DATE),'OD',
    'Cession immobilisation ' || NEW.asset_name,'fixed_assets',NEW.id,_lines,'od');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_asset_disposal ON public.fixed_assets;
CREATE TRIGGER trg_acc_asset_disposal AFTER UPDATE OF status ON public.fixed_assets
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_asset_disposal();

-- E17 : dotation aux amortissements (via post_depreciation)
CREATE OR REPLACE FUNCTION public.post_depreciation(p_schedule_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tenant UUID; _row RECORD; _lines JSONB; _tx UUID;
BEGIN
  _tenant := public.get_user_tenant_id(auth.uid());
  SELECT ds.*, fa.asset_name, fa.account_number
    INTO _row
    FROM public.depreciation_schedule ds
    JOIN public.fixed_assets fa ON fa.id = ds.fixed_asset_id
    WHERE ds.id = p_schedule_id AND ds.tenant_id = _tenant;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Échéance introuvable');
  END IF;
  IF _row.is_posted THEN
    RETURN jsonb_build_object('success', false, 'error', 'Déjà comptabilisée');
  END IF;

  _lines := jsonb_build_array(
    jsonb_build_object('account','681','label','Dotations aux amortissements','debit',_row.depreciation_amount,'credit',0),
    jsonb_build_object('account','28','label','Amortissements cumulés','debit',0,'credit',_row.depreciation_amount));
  _tx := public.post_accounting_entry(_tenant,'depreciation',_row.period_end,'OD',
    'Dotation amortissement ' || _row.asset_name,'depreciation_schedule',_row.id,_lines,'amortissement');

  UPDATE public.depreciation_schedule
    SET is_posted = true, posted_at = now(), transaction_id = _tx
    WHERE id = p_schedule_id;

  UPDATE public.fixed_assets
    SET accumulated_depreciation = COALESCE(accumulated_depreciation,0) + _row.depreciation_amount,
        net_book_value = GREATEST(COALESCE(acquisition_cost,0)
                          - (COALESCE(accumulated_depreciation,0) + _row.depreciation_amount), 0)
    WHERE id = _row.fixed_asset_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', _tx);
END; $$;

-- =========================================================
-- 10. TRÉSORERIE & OPÉRATIONS DIVERSES
-- =========================================================
-- E18 virement interne, E19 dépense diverse, E20 recette diverse
CREATE OR REPLACE FUNCTION public.trg_acc_manual_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lines JSONB; _amt NUMERIC; _cash TEXT;
BEGIN
  IF NEW.source_table IS NOT NULL THEN RETURN NEW; END IF;
  _amt := COALESCE(NEW.amount, 0);
  IF _amt <= 0 THEN RETURN NEW; END IF;
  _cash := '521';

  IF NEW.transaction_type = 'virement_interne' THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','585','label','Virements internes','debit',_amt,'credit',0),
      jsonb_build_object('account','521','label','Banque','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'internal_transfer',NEW.transaction_date,'TR',
      COALESCE(NEW.description,'Virement interne'),'transactions',NEW.id,_lines,'virement_interne');
  ELSIF NEW.transaction_type IN ('depense','autre') THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','628','label','Charges diverses','debit',_amt,'credit',0),
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'misc_expense',NEW.transaction_date,'OD',
      COALESCE(NEW.description,'Dépense diverse'),'transactions',NEW.id,_lines,'depense');
  ELSIF NEW.transaction_type = 'recette' THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',_amt,'credit',0),
      jsonb_build_object('account','758','label','Produits divers','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'misc_income',NEW.transaction_date,'OD',
      COALESCE(NEW.description,'Recette diverse'),'transactions',NEW.id,_lines,'recette');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_acc_manual_transaction ON public.transactions;
CREATE TRIGGER trg_acc_manual_transaction AFTER INSERT ON public.transactions
  FOR EACH ROW WHEN (NEW.source_table IS NULL)
  EXECUTE FUNCTION public.trg_acc_manual_transaction();

-- 11. Initialiser la config des tenants existants (mode shadow)
INSERT INTO public.accounting_config (tenant_id)
SELECT id FROM public.tenants ON CONFLICT (tenant_id) DO NOTHING;
