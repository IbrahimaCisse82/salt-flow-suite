CREATE OR REPLACE FUNCTION public.check_user_active(p_user_id uuid)
 RETURNS TABLE(user_active boolean, tenant_active boolean, tenant_name text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(),'admin'::app_role)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT COALESCE(p.is_active, false), COALESCE(t.is_active, true), t.name
  FROM public.profiles p LEFT JOIN public.tenants t ON t.id = p.tenant_id
  WHERE p.user_id = p_user_id LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_account_balance(p_tenant_id uuid, p_account_number text, p_as_of_date date DEFAULT CURRENT_DATE)
 RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _tenant UUID; _balance NUMERIC;
BEGIN
  _tenant := COALESCE(p_tenant_id, get_user_tenant_id(auth.uid()));
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR (_tenant = get_user_tenant_id(auth.uid()) AND has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[]))) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  SELECT COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0) INTO _balance
    FROM public.journal_entries je JOIN public.chart_of_accounts coa ON coa.id = je.account_id
   WHERE je.tenant_id = _tenant AND coa.account_number = p_account_number AND je.entry_date <= p_as_of_date;
  RETURN COALESCE(_balance, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_trial_balance(p_tenant_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(account_number text, account_name text, account_type text, opening_balance numeric, period_debit numeric, period_credit numeric, closing_balance numeric)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _tenant UUID;
BEGIN
  _tenant := COALESCE(p_tenant_id, get_user_tenant_id(auth.uid()));
  IF _tenant IS NULL THEN RAISE EXCEPTION 'Tenant introuvable'; END IF;
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR (_tenant = get_user_tenant_id(auth.uid()) AND has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[]))) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  WITH opening AS (
    SELECT je.account_id, COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0) AS opening_bal
    FROM public.journal_entries je
    WHERE je.tenant_id = _tenant AND (p_start_date IS NULL OR je.entry_date < p_start_date)
    GROUP BY je.account_id
  ),
  period AS (
    SELECT je.account_id, COALESCE(SUM(je.debit),0) AS pd, COALESCE(SUM(je.credit),0) AS pc
    FROM public.journal_entries je
    WHERE je.tenant_id = _tenant
      AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
      AND (p_end_date IS NULL OR je.entry_date <= p_end_date)
    GROUP BY je.account_id
  )
  SELECT coa.account_number, coa.account_name, coa.account_type::text,
    COALESCE(o.opening_bal, 0), COALESCE(p.pd, 0), COALESCE(p.pc, 0),
    COALESCE(o.opening_bal, 0) + COALESCE(p.pd, 0) - COALESCE(p.pc, 0)
  FROM public.chart_of_accounts coa
  LEFT JOIN opening o ON o.account_id = coa.id
  LEFT JOIN period  p ON p.account_id = coa.id
  WHERE coa.tenant_id = _tenant
    AND (COALESCE(o.opening_bal,0) <> 0 OR COALESCE(p.pd,0) <> 0 OR COALESCE(p.pc,0) <> 0)
  ORDER BY coa.account_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.post_depreciation(p_schedule_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _tenant UUID; _row RECORD; _lines JSONB; _tx UUID;
BEGIN
  _tenant := public.get_user_tenant_id(auth.uid());
  PERFORM public.assert_accounting_access(_tenant);
  SELECT ds.*, fa.asset_name, fa.account_number INTO _row
    FROM public.depreciation_schedule ds JOIN public.fixed_assets fa ON fa.id = ds.fixed_asset_id
    WHERE ds.id = p_schedule_id AND ds.tenant_id = _tenant;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Échéance introuvable'); END IF;
  IF _row.is_posted THEN RETURN jsonb_build_object('success', false, 'error', 'Déjà comptabilisée'); END IF;
  _lines := jsonb_build_array(
    jsonb_build_object('account','681','label','Dotations aux amortissements','debit',_row.depreciation_amount,'credit',0),
    jsonb_build_object('account','28','label','Amortissements cumulés','debit',0,'credit',_row.depreciation_amount));
  _tx := public.post_accounting_entry(_tenant,'depreciation',_row.period_end,'OD',
    'Dotation amortissement ' || _row.asset_name,'depreciation_schedule',_row.id,_lines,'amortissement');
  UPDATE public.depreciation_schedule SET is_posted = true, posted_at = now(), transaction_id = _tx WHERE id = p_schedule_id;
  UPDATE public.fixed_assets
    SET accumulated_depreciation = COALESCE(accumulated_depreciation,0) + _row.depreciation_amount,
        net_book_value = GREATEST(COALESCE(acquisition_cost,0) - (COALESCE(accumulated_depreciation,0) + _row.depreciation_amount), 0)
    WHERE id = _row.fixed_asset_id;
  RETURN jsonb_build_object('success', true, 'transaction_id', _tx);
END; $function$;

CREATE OR REPLACE FUNCTION public.process_stock_movement(p_item_id uuid, p_quantity numeric, p_movement_type text, p_unit_cost numeric DEFAULT 0, p_warehouse_from uuid DEFAULT NULL::uuid, p_warehouse_to uuid DEFAULT NULL::uuid, p_reference_type text DEFAULT NULL::text, p_reference_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  SET quantity = v_new, quantity_on_hand = v_new, cmp = v_new_cmp,
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
      quantity, remaining_quantity, unit_cost, total_cost, total_value, layer_date, notes
    ) VALUES (
      v_tenant, p_item_id, 'entry', p_reference_type, p_reference_id,
      p_quantity, p_quantity, COALESCE(p_unit_cost, 0), ROUND(p_quantity * COALESCE(p_unit_cost, 0), 2),
      ROUND(p_quantity * COALESCE(p_unit_cost, 0), 2), CURRENT_DATE, p_notes
    );
  END IF;
  PERFORM public.emit_domain_event(v_tenant, 'stock.movement.processed', 'inventory_item', p_item_id,
    jsonb_build_object('movement_id', v_movement_id, 'movement_type', p_movement_type, 'quantity', p_quantity,
      'previous_quantity', v_prev, 'new_quantity', v_new, 'cmp', v_new_cmp));
  RETURN jsonb_build_object('success', true, 'movement_id', v_movement_id,
    'previous_quantity', v_prev, 'new_quantity', v_new, 'cmp', v_new_cmp);
END;
$function$;