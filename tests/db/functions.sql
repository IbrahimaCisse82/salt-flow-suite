SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

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

CREATE OR REPLACE FUNCTION public.assert_accounting_access(_tenant_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _tenant_id IS NULL THEN RAISE EXCEPTION 'Entreprise non identifiée'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR (public.is_tenant_member(auth.uid(), _tenant_id)
              AND public.has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[]))) THEN
    RAISE EXCEPTION 'Accès refusé : opération réservée au gérant, au comptable ou à l''administrateur';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.round_entry_lines(_lines jsonb)
 RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public'
AS $$
DECLARE _out jsonb := '[]'::jsonb; _l jsonb; _i int := 0; _big int := -1; _bigv numeric := -1;
  _d numeric; _c numeric; _sd numeric := 0; _sc numeric := 0; _diff numeric; _bigside text;
BEGIN
  FOR _l IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    _d := ROUND(COALESCE((_l->>'debit')::numeric,0), 0);
    _c := ROUND(COALESCE((_l->>'credit')::numeric,0), 0);
    _sd := _sd + _d; _sc := _sc + _c;
    IF GREATEST(_d,_c) > _bigv THEN _bigv := GREATEST(_d,_c); _big := _i; _bigside := CASE WHEN _d >= _c THEN 'debit' ELSE 'credit' END; END IF;
    _out := _out || jsonb_build_array(_l || jsonb_build_object('debit', _d, 'credit', _c));
    _i := _i + 1;
  END LOOP;
  _diff := _sd - _sc;
  IF _diff <> 0 AND abs(_diff) <= _i AND _big >= 0 THEN
    IF _bigside = 'debit' THEN
      _out := jsonb_set(_out, ARRAY[_big::text,'debit'], to_jsonb((_out->_big->>'debit')::numeric - _diff));
    ELSE
      _out := jsonb_set(_out, ARRAY[_big::text,'credit'], to_jsonb((_out->_big->>'credit')::numeric + _diff));
    END IF;
  END IF;
  RETURN _out;
END $$;

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

CREATE OR REPLACE FUNCTION public.check_period_not_closed()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _period_status fiscal_period_status;
BEGIN
  IF NEW.fiscal_period_id IS NOT NULL THEN
    SELECT status INTO _period_status
      FROM public.fiscal_periods WHERE id = NEW.fiscal_period_id;
    IF _period_status IN ('closed','locked') THEN
      RAISE EXCEPTION 'Période comptable clôturée : modification interdite';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.set_journal_entry_reference()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.next_document_number_for(NEW.tenant_id, 'journal_entry');
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.set_payment_reference()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.next_document_number_for(NEW.tenant_id, 'payment');
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.set_sales_invoice_number()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.next_document_number_for(NEW.tenant_id, 'invoice');
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.next_document_number_for(p_tenant_id uuid, p_doc_type text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _year INT; _next INT; _prefix TEXT;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant introuvable' USING ERRCODE = '42501';
  END IF;
  _prefix := CASE p_doc_type
    WHEN 'invoice' THEN 'FAC' WHEN 'purchase_order' THEN 'BC' WHEN 'journal_entry' THEN 'JRN'
    WHEN 'payment' THEN 'PMT' WHEN 'delivery_note' THEN 'BL' ELSE 'DOC' END;
  _year := EXTRACT(YEAR FROM CURRENT_DATE);
  INSERT INTO public.document_sequences (tenant_id, doc_type, year, last_number)
  VALUES (p_tenant_id, p_doc_type, _year, 1)
  ON CONFLICT (tenant_id, doc_type, year) DO UPDATE
    SET last_number = public.document_sequences.last_number + 1, updated_at = now()
  RETURNING last_number INTO _next;
  RETURN _prefix || '-' || _year::TEXT || '-' || LPAD(_next::TEXT, 5, '0');
END $function$;

CREATE OR REPLACE FUNCTION public.validate_sale_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _stock numeric; _rejected boolean; _wh text; _label text;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide : elle doit être strictement positive';
  END IF;
  IF COALESCE(NEW.unit_price,0) < 0 OR COALESCE(NEW.total_price,0) < 0 THEN
    RAISE EXCEPTION 'Prix invalide : il ne peut pas être négatif';
  END IF;
  IF NEW.inventory_item_id IS NOT NULL THEN
    SELECT quantity - COALESCE(reserved_quantity,0) INTO _stock FROM inventory_items WHERE id = NEW.inventory_item_id FOR UPDATE;
  ELSIF NEW.warehouse_id IS NOT NULL THEN
    SELECT name INTO _wh FROM inventory_items WHERE id = NEW.warehouse_id;
    _label := CASE lower(COALESCE(NEW.salt_type,'')) WHEN 'gros' THEN 'Sel gros' WHEN 'fin' THEN 'Sel fin'
               WHEN 'iode' THEN 'Sel iodé' WHEN 'raffine' THEN 'Sel raffiné' ELSE NEW.salt_type END;
    SELECT COALESCE(sum(quantity - COALESCE(reserved_quantity,0)),0) INTO _stock
      FROM inventory_items
     WHERE tenant_id = NEW.tenant_id AND category = 'production' AND deleted_at IS NULL
       AND (warehouse_id = NEW.warehouse_id OR storage_location = _wh)
       AND (_label IS NULL OR lower(name) = lower(_label) OR name ILIKE '%'||COALESCE(NEW.salt_type,'')||'%');
  END IF;
  IF _stock IS NOT NULL AND NEW.quantity > _stock THEN
    RAISE EXCEPTION 'Stock insuffisant : % t demandées, % t disponibles', NEW.quantity, _stock;
  END IF;
  IF NEW.production_record_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM quality_tests WHERE production_record_id = NEW.production_record_id
                   AND status = 'rejected' AND deleted_at IS NULL) INTO _rejected;
    IF _rejected THEN RAISE EXCEPTION 'Lot non conforme : vente interdite'; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.post_accounting_entry(_tenant_id uuid, _event_type text, _entry_date date, _journal text, _description text, _source_table text, _source_id uuid, _lines jsonb, _tx_type transaction_type DEFAULT 'od'::transaction_type)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _mode TEXT; _tx UUID; _total NUMERIC := 0;
BEGIN
  IF _tenant_id IS NULL OR _lines IS NULL OR jsonb_array_length(_lines) = 0 THEN RETURN NULL; END IF;
  SELECT posting_mode INTO _mode FROM public.accounting_config WHERE tenant_id = _tenant_id;
  IF _mode IS NULL THEN
    INSERT INTO public.accounting_config (tenant_id) VALUES (_tenant_id) ON CONFLICT (tenant_id) DO NOTHING;
    _mode := 'shadow';
  END IF;
  IF _mode = 'off' THEN RETURN NULL; END IF;
  _lines := public.round_entry_lines(_lines);
  SELECT COALESCE(SUM((l->>'debit')::numeric), 0) INTO _total FROM jsonb_array_elements(_lines) l;
  IF _total = 0 THEN RETURN NULL; END IF;
  IF _mode = 'shadow' THEN
    INSERT INTO public.accounting_shadow_entries (tenant_id, event_type, entry_date, journal_code, description, source_table, source_id, lines, total_amount, tx_type)
    VALUES (_tenant_id, _event_type, _entry_date, _journal, _description, _source_table, _source_id, _lines, _total, _tx_type::text)
    RETURNING id INTO _tx;
    RETURN _tx;
  END IF;
  RETURN public.post_entry_live(_tenant_id, _event_type, _entry_date, _journal, _description, _source_table, _source_id, _lines, _tx_type);
END; $function$;

CREATE OR REPLACE FUNCTION public.post_entry_live(_tenant_id uuid, _event_type text, _entry_date date, _journal text, _description text, _source_table text, _source_id uuid, _lines jsonb, _tx_type transaction_type DEFAULT 'od'::transaction_type)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _tx UUID; _line JSONB; _acc UUID; _debit NUMERIC; _credit NUMERIC; _total NUMERIC := 0; _tc NUMERIC := 0; _order INT := 0;
BEGIN
  _lines := public.round_entry_lines(_lines);
  SELECT COALESCE(SUM((l->>'debit')::numeric),0), COALESCE(SUM((l->>'credit')::numeric),0) INTO _total, _tc FROM jsonb_array_elements(_lines) l;
  IF _total = 0 THEN RETURN NULL; END IF;
  IF _total <> _tc THEN RAISE EXCEPTION 'Écriture déséquilibrée : débit % ≠ crédit %', _total, _tc; END IF;

  INSERT INTO public.transactions (tenant_id, transaction_date, transaction_type, journal_code, description, amount, status, source_table, source_id, created_by)
  VALUES (_tenant_id, _entry_date, _tx_type, _journal, _description, _total, 'draft', _source_table, _source_id, auth.uid())
  RETURNING id INTO _tx;

  FOR _line IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    _acc := public.resolve_account(_tenant_id, _line->>'account', _line->>'label');
    _debit := COALESCE((_line->>'debit')::NUMERIC, 0);
    _credit := COALESCE((_line->>'credit')::NUMERIC, 0);
    IF _debit = 0 AND _credit = 0 THEN CONTINUE; END IF;
    _order := _order + 1;
    INSERT INTO public.transaction_lines (tenant_id, transaction_id, account_id, debit, credit, description, line_order)
    VALUES (_tenant_id, _tx, _acc, _debit, _credit, COALESCE(_line->>'label', _description), _order);
    INSERT INTO public.journal_entries (tenant_id, transaction_id, entry_date, journal_code, account_id, account_number, account_name, description, debit, credit, created_by)
    SELECT _tenant_id, _tx, _entry_date, _journal, _acc, coa.account_number, coa.account_name, COALESCE(_line->>'label', _description), _debit, _credit, auth.uid()
    FROM public.chart_of_accounts coa WHERE coa.id = _acc;
  END LOOP;

  UPDATE public.transactions SET status = 'validated', is_validated = true WHERE id = _tx;
  PERFORM public.emit_domain_event(_tenant_id, 'accounting.entry_posted', 'transaction', _tx,
    jsonb_build_object('event_type', _event_type, 'amount', _total, 'source', _source_table));
  RETURN _tx;
END; $function$;

CREATE OR REPLACE FUNCTION public.process_stock_movement(
  p_item_id uuid, p_quantity numeric, p_movement_type text, p_unit_cost numeric DEFAULT NULL,
  p_warehouse_from uuid DEFAULT NULL, p_warehouse_to uuid DEFAULT NULL,
  p_reference_type text DEFAULT NULL, p_reference_id uuid DEFAULT NULL, p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.inventory_items%ROWTYPE; v_tenant uuid; v_prev numeric; v_new numeric;
  v_available numeric; v_new_cmp numeric; v_movement_id uuid;
BEGIN
  IF p_movement_type NOT IN ('entry','exit','adjustment','transfer') THEN
    RAISE EXCEPTION 'Type de mouvement invalide: %', p_movement_type;
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'La quantité doit être strictement positive';
  END IF;
  v_tenant := public.get_user_tenant_id(auth.uid());
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'Utilisateur sans organisation'; END IF;
  IF NOT public.has_any_role(auth.uid(), ARRAY['admin','gerant','magasinier','chef_production','commercial']::app_role[]) THEN
    RAISE EXCEPTION 'Accès refusé : mouvement de stock non autorisé pour votre rôle' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_item FROM public.inventory_items WHERE id = p_item_id AND tenant_id = v_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Article introuvable'; END IF;
  v_prev := COALESCE(v_item.quantity, 0);
  v_new_cmp := COALESCE(v_item.cmp, v_item.unit_cost, 0);
  IF p_movement_type = 'entry' THEN
    v_new := v_prev + p_quantity;
    IF v_new > 0 THEN
      v_new_cmp := ROUND(((v_prev * v_new_cmp) + (p_quantity * COALESCE(p_unit_cost, 0))) / v_new, 6);
    END IF;
  ELSIF p_movement_type = 'exit' THEN
    v_available := v_prev - COALESCE(v_item.reserved_quantity, 0);
    IF p_quantity > v_available THEN
      RAISE EXCEPTION 'Stock disponible insuffisant (disponible: %, demandé: %)', v_available, p_quantity;
    END IF;
    v_new := v_prev - p_quantity;
  ELSIF p_movement_type = 'adjustment' THEN
    v_new := p_quantity;
  ELSE
    v_new := v_prev;
  END IF;
  UPDATE public.inventory_items
  SET quantity = v_new, cmp = v_new_cmp,
      unit_cost = CASE WHEN p_movement_type = 'entry' THEN v_new_cmp ELSE unit_cost END,
      updated_at = now()
  WHERE id = p_item_id;
  INSERT INTO public.stock_movements (
    tenant_id, inventory_item_id, item_name, movement_type, quantity, previous_quantity, new_quantity,
    unit_cost, unit_of_measure, warehouse_from, warehouse_to, reference_type, reference_id, notes, created_by
  ) VALUES (
    v_tenant, p_item_id, COALESCE(v_item.item_name, v_item.name), p_movement_type::stock_movement_type, p_quantity,
    v_prev, v_new, COALESCE(p_unit_cost, v_new_cmp), v_item.unit_of_measure,
    p_warehouse_from, p_warehouse_to, p_reference_type, p_reference_id, p_notes, auth.uid()
  ) RETURNING id INTO v_movement_id;
  IF p_movement_type = 'entry' THEN
    INSERT INTO public.inventory_valuation_layers (
      tenant_id, inventory_item_id, movement_type, source_type, reference_id,
      quantity, remaining_quantity, unit_cost, total_cost, layer_date, notes
    ) VALUES (
      v_tenant, p_item_id, 'entry', p_reference_type, p_reference_id,
      p_quantity, p_quantity, COALESCE(p_unit_cost, 0), ROUND(p_quantity * COALESCE(p_unit_cost, 0), 2),
      CURRENT_DATE, p_notes
    );
  END IF;
  PERFORM public.emit_domain_event(v_tenant, 'stock.movement.processed', 'inventory_item', p_item_id,
    jsonb_build_object('movement_id', v_movement_id, 'movement_type', p_movement_type, 'quantity', p_quantity,
      'previous_quantity', v_prev, 'new_quantity', v_new, 'cmp', v_new_cmp));
  RETURN jsonb_build_object('success', true, 'movement_id', v_movement_id,
    'previous_quantity', v_prev, 'new_quantity', v_new, 'cmp', v_new_cmp);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_acc_sale_invoiced()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _ht NUMERIC; _tva NUMERIC; _ttc NUMERIC; _lines JSONB; _ctype text; _foreign boolean;
BEGIN
  IF NEW.status NOT IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;
  SELECT client_type::text INTO _ctype FROM public.clients WHERE id = NEW.client_id;
  _foreign := COALESCE(NEW.is_export, false) OR COALESCE(_ctype,'local') IN ('export','zone_ohada','hors_ohada');
  _ttc := COALESCE(NEW.total_amount, 0);
  _tva := COALESCE(NEW.tva_amount, NEW.tax_amount, 0);
  _ht  := COALESCE(NULLIF(NEW.amount_ht, 0), _ttc - _tva);
  IF _ttc <= 0 THEN RETURN NEW; END IF;
  IF _foreign THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','411','label','Clients','debit',_ttc,'credit',0),
      jsonb_build_object('account','7022','label','Ventes de produits finis hors Région','debit',0,'credit',_ttc));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_invoiced_export',NEW.sale_date,'VE',
      'Facture export ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'vente_export');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','411','label','Clients','debit',_ttc,'credit',0),
      jsonb_build_object('account','7021','label','Ventes de produits finis dans la Région','debit',0,'credit',_ht));
    IF _tva > 0 THEN
      _lines := _lines || jsonb_build_array(
        jsonb_build_object('account','4431','label','TVA facturée sur ventes','debit',0,'credit',_tva));
    END IF;
    PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_invoiced_local',NEW.sale_date,'VE',
      'Facture ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'vente_locale');
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.trg_acc_sale_cogs()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
    jsonb_build_object('account','736','label','Variations des stocks de produits finis','debit',_cost,'credit',0),
    jsonb_build_object('account','361','label','Produits finis','debit',0,'credit',_cost));
  PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_cogs',COALESCE(NEW.delivery_date, NEW.sale_date),'ST',
    'Coût des ventes ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'od');
  RETURN NEW;
END; $function$;

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

CREATE OR REPLACE FUNCTION public.trg_acc_stock_adjustment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _val NUMERIC; _lines JSONB;
BEGIN
  IF NEW.movement_type <> 'adjustment' THEN RETURN NEW; END IF;
  _val := ABS(COALESCE(NEW.new_quantity,0) - COALESCE(NEW.previous_quantity,0)) * COALESCE(NEW.unit_cost,0);
  IF _val <= 0 THEN RETURN NEW; END IF;
  IF COALESCE(NEW.new_quantity,0) < COALESCE(NEW.previous_quantity,0) THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','736','label','Variation des stocks de produits finis (manquant d''inventaire)','debit',_val,'credit',0),
      jsonb_build_object('account','361','label','Produits finis','debit',0,'credit',_val));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'stock_loss',NEW.created_at::date,'ST',
      'Écart d''inventaire (manquant) — ' || NEW.item_name,'stock_movements',NEW.id,_lines,'od');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','361','label','Produits finis','debit',_val,'credit',0),
      jsonb_build_object('account','736','label','Variation des stocks de produits finis (excédent d''inventaire)','debit',0,'credit',_val));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'stock_gain',NEW.created_at::date,'ST',
      'Écart d''inventaire (excédent) — ' || NEW.item_name,'stock_movements',NEW.id,_lines,'od');
  END IF;
  RETURN NEW;
END; $function$;

