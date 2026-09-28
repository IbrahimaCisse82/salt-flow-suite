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

CREATE OR REPLACE FUNCTION public.post_depreciation(p_schedule_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _tenant UUID; _row RECORD; _lines JSONB; _tx UUID;
  _acc TEXT; _dot TEXT; _dot_lbl TEXT; _amort TEXT;
BEGIN
  _tenant := public.get_user_tenant_id(auth.uid());
  PERFORM public.assert_accounting_access(_tenant);
  SELECT ds.*, fa.asset_name, fa.account_number INTO _row
    FROM public.depreciation_schedule ds JOIN public.fixed_assets fa ON fa.id = ds.fixed_asset_id
    WHERE ds.id = p_schedule_id AND ds.tenant_id = _tenant;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Échéance introuvable'); END IF;
  IF _row.is_posted THEN RETURN jsonb_build_object('success', false, 'error', 'Déjà comptabilisée'); END IF;

  _acc := regexp_replace(COALESCE(_row.account_number,''), '[^0-9]', '', 'g');
  IF _acc !~ '^2[1-4][0-9]' THEN _acc := '245'; END IF; -- défaut : matériel de transport
  IF left(_acc,2) = '21' THEN
    _dot := '6812'; _dot_lbl := 'Dotations aux amortissements des immobilisations incorporelles';
  ELSE
    _dot := '6813'; _dot_lbl := 'Dotations aux amortissements des immobilisations corporelles';
  END IF;
  _amort := '28' || substr(_acc,2,2);   -- ex. 245x -> 2845, 241x -> 2841, 231x -> 2831

  _lines := jsonb_build_array(
    jsonb_build_object('account',_dot,'label',_dot_lbl,'debit',_row.depreciation_amount,'credit',0),
    jsonb_build_object('account',_amort,'label','Amortissements ' || _row.asset_name,'debit',0,'credit',_row.depreciation_amount));
  _tx := public.post_accounting_entry(_tenant,'depreciation',_row.period_end,'OD',
    'Dotation amortissement ' || _row.asset_name,'depreciation_schedule',_row.id,_lines,'amortissement');
  UPDATE public.depreciation_schedule SET is_posted = true, posted_at = now(), transaction_id = _tx WHERE id = p_schedule_id;
  UPDATE public.fixed_assets
    SET accumulated_depreciation = COALESCE(accumulated_depreciation,0) + _row.depreciation_amount,
        net_book_value = GREATEST(COALESCE(acquisition_cost,0) - (COALESCE(accumulated_depreciation,0) + _row.depreciation_amount), 0)
    WHERE id = _row.fixed_asset_id;
  RETURN jsonb_build_object('success', true, 'transaction_id', _tx);
END; $function$;
REVOKE EXECUTE ON FUNCTION public.post_depreciation(uuid) FROM PUBLIC, anon;