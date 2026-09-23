CREATE OR REPLACE FUNCTION public.trg_acc_sale_invoiced()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _ht NUMERIC; _tva NUMERIC; _ttc NUMERIC; _lines JSONB;
BEGIN
  IF NEW.status NOT IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;
  _ttc := COALESCE(NEW.total_amount, 0);
  _tva := COALESCE(NEW.tva_amount, NEW.tax_amount, 0);
  _ht  := COALESCE(NULLIF(NEW.amount_ht, 0), _ttc - _tva);
  IF _ttc <= 0 THEN RETURN NEW; END IF;
  IF COALESCE(NEW.is_export, false) THEN
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

CREATE OR REPLACE FUNCTION public.trg_acc_purchase_received()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
    _lines := jsonb_build_array(
      jsonb_build_object('account','602','label','Achats de matières premières et fournitures liées','debit',_ht,'credit',0));
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','605','label','Autres achats','debit',_ht,'credit',0));
  END IF;
  IF _tva > 0 THEN
    _lines := _lines || jsonb_build_array(
      jsonb_build_object('account','4452','label','TVA récupérable sur achats','debit',_tva,'credit',0));
  END IF;
  _lines := _lines || jsonb_build_array(
    jsonb_build_object('account','401','label','Fournisseurs','debit',0,'credit',_ttc));
  PERFORM public.post_accounting_entry(NEW.tenant_id,
    CASE WHEN _has_stock THEN 'purchase_received_stock' ELSE 'purchase_received_service' END,
    COALESCE(NEW.delivery_date, NEW.order_date),'AC',
    'Achat ' || COALESCE(NEW.order_number,''),'purchase_orders',NEW.id,_lines,'achat');
  RETURN NEW;
END; $function$;

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
      jsonb_build_object('account','6588','label','Autres charges diverses (pertes sur stocks)','debit',_val,'credit',0),
      jsonb_build_object('account','361','label','Produits finis','debit',0,'credit',_val));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'stock_loss',NEW.created_at::date,'ST',
      'Écart d''inventaire (perte) — ' || NEW.item_name,'stock_movements',NEW.id,_lines,'od');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','361','label','Produits finis','debit',_val,'credit',0),
      jsonb_build_object('account','7588','label','Autres produits divers (gains sur stocks)','debit',0,'credit',_val));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'stock_gain',NEW.created_at::date,'ST',
      'Écart d''inventaire (gain) — ' || NEW.item_name,'stock_movements',NEW.id,_lines,'od');
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.trg_acc_production_stored()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _val NUMERIC; _lines JSONB;
BEGIN
  _val := COALESCE(NEW.quantity_tonnes, NEW.quantity, 0) * COALESCE(NEW.cost_per_ton, 0);
  IF _val <= 0 THEN RETURN NEW; END IF;
  _lines := jsonb_build_array(
    jsonb_build_object('account','361','label','Produits finis','debit',_val,'credit',0),
    jsonb_build_object('account','736','label','Variations des stocks de produits finis','debit',0,'credit',_val));
  PERFORM public.post_accounting_entry(NEW.tenant_id,'production_stored',
    COALESCE(NEW.production_date, NEW.harvest_date),'ST',
    'Production stockée','production_records',NEW.id,_lines,'od');
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.seed_chart_of_accounts(_tenant_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, account_class, is_system) VALUES
    (_tenant_id, '101', 'Capital social', 'capitaux', 1, true),
    (_tenant_id, '111', 'Réserve légale', 'capitaux', 1, true),
    (_tenant_id, '118', 'Autres réserves', 'capitaux', 1, true),
    (_tenant_id, '121', 'Report à nouveau créditeur', 'capitaux', 1, true),
    (_tenant_id, '129', 'Report à nouveau débiteur', 'capitaux', 1, true),
    (_tenant_id, '131', 'Résultat net : bénéfice', 'capitaux', 1, true),
    (_tenant_id, '139', 'Résultat net : perte', 'capitaux', 1, true),
    (_tenant_id, '162', 'Emprunts et dettes auprès des établissements de crédit', 'passif', 1, true),
    (_tenant_id, '213', 'Logiciels et sites internet', 'actif', 2, true),
    (_tenant_id, '221', 'Terrains agricoles et forestiers', 'actif', 2, true),
    (_tenant_id, '231', 'Bâtiments industriels, agricoles, administratifs et commerciaux sur sol propre', 'actif', 2, true),
    (_tenant_id, '241', 'Matériel et outillage industriel et commercial', 'actif', 2, true),
    (_tenant_id, '244', 'Matériel et mobilier', 'actif', 2, true),
    (_tenant_id, '245', 'Matériel de transport', 'actif', 2, true),
    (_tenant_id, '283', 'Amortissements des bâtiments, installations techniques et agencements', 'actif', 2, true),
    (_tenant_id, '284', 'Amortissements du matériel', 'actif', 2, true),
    (_tenant_id, '311', 'Marchandises', 'actif', 3, true),
    (_tenant_id, '321', 'Matières premières', 'actif', 3, true),
    (_tenant_id, '331', 'Matières consommables', 'actif', 3, true),
    (_tenant_id, '341', 'Produits en cours', 'actif', 3, true),
    (_tenant_id, '361', 'Produits finis', 'actif', 3, true),
    (_tenant_id, '401', 'Fournisseurs, dettes en compte', 'passif', 4, true),
    (_tenant_id, '4091', 'Fournisseurs, avances et acomptes versés', 'actif', 4, true),
    (_tenant_id, '411', 'Clients', 'actif', 4, true),
    (_tenant_id, '4191', 'Clients, avances et acomptes reçus', 'passif', 4, true),
    (_tenant_id, '421', 'Personnel, avances et acomptes', 'actif', 4, true),
    (_tenant_id, '422', 'Personnel, rémunérations dues', 'passif', 4, true),
    (_tenant_id, '431', 'Sécurité sociale', 'passif', 4, true),
    (_tenant_id, '441', 'État, impôt sur les bénéfices', 'passif', 4, true),
    (_tenant_id, '4431', 'TVA facturée sur ventes', 'passif', 4, true),
    (_tenant_id, '4451', 'TVA récupérable sur immobilisations', 'actif', 4, true),
    (_tenant_id, '4452', 'TVA récupérable sur achats', 'actif', 4, true),
    (_tenant_id, '481', 'Fournisseurs d''investissements', 'passif', 4, true),
    (_tenant_id, '521', 'Banques locales', 'actif', 5, true),
    (_tenant_id, '552', 'Monnaie électronique - téléphone portable', 'actif', 5, true),
    (_tenant_id, '571', 'Caisse siège social', 'actif', 5, true),
    (_tenant_id, '585', 'Virements de fonds', 'actif', 5, true),
    (_tenant_id, '601', 'Achats de marchandises', 'charge', 6, true),
    (_tenant_id, '602', 'Achats de matières premières et fournitures liées', 'charge', 6, true),
    (_tenant_id, '604', 'Achats stockés de matières et fournitures consommables', 'charge', 6, true),
    (_tenant_id, '605', 'Autres achats', 'charge', 6, true),
    (_tenant_id, '611', 'Transports sur achats', 'charge', 6, true),
    (_tenant_id, '622', 'Locations, charges locatives', 'charge', 6, true),
    (_tenant_id, '624', 'Entretien, réparations, remise en état et maintenance', 'charge', 6, true),
    (_tenant_id, '631', 'Frais bancaires', 'charge', 6, true),
    (_tenant_id, '641', 'Impôts et taxes directs', 'charge', 6, true),
    (_tenant_id, '6588', 'Autres charges diverses', 'charge', 6, true),
    (_tenant_id, '661', 'Rémunérations directes versées au personnel national', 'charge', 6, true),
    (_tenant_id, '664', 'Charges sociales', 'charge', 6, true),
    (_tenant_id, '681', 'Dotations aux amortissements d''exploitation', 'charge', 6, true),
    (_tenant_id, '7021', 'Ventes de produits finis dans la Région', 'produit', 7, true),
    (_tenant_id, '7022', 'Ventes de produits finis hors Région', 'produit', 7, true),
    (_tenant_id, '706', 'Services vendus', 'produit', 7, true),
    (_tenant_id, '707', 'Produits accessoires', 'produit', 7, true),
    (_tenant_id, '736', 'Variations des stocks de produits finis', 'produit', 7, true),
    (_tenant_id, '7588', 'Autres produits divers', 'produit', 7, true),
    (_tenant_id, '771', 'Intérêts de prêts et créances diverses', 'produit', 7, true)
  ON CONFLICT (tenant_id, account_number) DO NOTHING;
END;
$function$;