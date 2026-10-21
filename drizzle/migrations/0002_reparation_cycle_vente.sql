-- =====================================================================
-- Lot 3.1 — Réparation du cycle de vente (commande → facture → livraison → encaissement)
--
-- Constats (base de production, 21/10/2026) :
--  1. Les écrans font avancer la vente dans `sale_status`, mais les écritures
--     automatiques (trg_acc_sale_invoiced / trg_acc_sale_cogs) n'écoutent que
--     `status` → aucune écriture 411/7021/4431 ni 736/361 depuis l'interface.
--  2. Aucun déclencheur ne réserve ni ne sort le stock (l'ancien
--     manage_stock_reservation a disparu lors de la refonte de mai 2026).
--  3. Les lignes de vente saisies à l'écran pointent vers l'entrepôt, jamais vers
--     l'article : le coût des ventes calculé vaut 0.
--  4. L'encaissement passe toujours en 521 (même en espèces), et l'écran tente de
--     modifier `sales.amount_paid`, colonne générée → erreur après que le
--     paiement a déjà été inséré (risque de double encaissement).
--  5. Annuler une facture laisse l'écriture de vente en place.
--
-- Ce lot corrige ces points côté base. Il est idempotent (rejouable).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Un seul statut de vente : `sale_status` (écrans) et `status` (comptabilité)
--    restent toujours identiques, et les transitions sont contrôlées.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_sale_status()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE _old text; _new text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Le plus avancé des deux champs fait foi à la création
    IF NEW.sale_status = 'draft' AND NEW.status <> 'draft' THEN
      NEW.sale_status := NEW.status;
    ELSE
      NEW.status := NEW.sale_status;
    END IF;
  ELSE
    IF NEW.sale_status IS DISTINCT FROM OLD.sale_status THEN
      NEW.status := NEW.sale_status;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.sale_status := NEW.status;
    ELSIF NEW.status IS DISTINCT FROM NEW.sale_status THEN
      -- Ligne historique désynchronisée : on s'aligne sur le plus avancé
      NEW.sale_status := NEW.status;
    END IF;

    _old := OLD.status::text; _new := NEW.status::text;
    IF _new <> _old THEN
      IF _old IN ('completed','cancelled') THEN
        RAISE EXCEPTION 'Vente % : statut « % » définitif, modification impossible%', COALESCE(OLD.invoice_number, OLD.sale_number), _old,
          CASE WHEN _old = 'completed' THEN ' (établissez un avoir pour corriger une vente livrée)' ELSE '' END;
      END IF;
      IF _old = 'delivered' AND _new <> 'completed' THEN
        RAISE EXCEPTION 'Vente % déjà livrée : seule la clôture (terminée) est possible ; établissez un avoir pour la corriger',
          COALESCE(OLD.invoice_number, OLD.sale_number);
      END IF;
      IF _old IN ('confirmed','invoiced') AND _new IN ('draft','pending') THEN
        RAISE EXCEPTION 'Vente % déjà facturée : retour en brouillon impossible (annulez-la ou établissez un avoir)',
          COALESCE(OLD.invoice_number, OLD.sale_number);
      END IF;
      IF _new = 'cancelled' AND COALESCE(OLD.total_paid,0) > 0 THEN
        RAISE EXCEPTION 'Vente % : un encaissement de % FCFA existe déjà, annulation impossible (établissez un avoir)',
          COALESCE(OLD.invoice_number, OLD.sale_number), OLD.total_paid;
      END IF;
    END IF;
  END IF;

  -- Traçabilité de la livraison
  IF NEW.status IN ('delivered','completed')
     AND (TG_OP = 'INSERT' OR OLD.status NOT IN ('delivered','completed')) THEN
    NEW.delivered := true;
    NEW.delivered_at := COALESCE(NEW.delivered_at, now());
    NEW.delivered_by := COALESCE(NEW.delivered_by, auth.uid());
    NEW.delivery_date := COALESCE(NEW.delivery_date, CURRENT_DATE);
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_aa_sync_sale_status ON public.sales;
CREATE TRIGGER trg_aa_sync_sale_status BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sync_sale_status();

-- Les écritures automatiques réagissent désormais aux deux champs
DROP TRIGGER IF EXISTS trg_acc_sale_invoiced ON public.sales;
CREATE TRIGGER trg_acc_sale_invoiced AFTER INSERT OR UPDATE OF status, sale_status ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_sale_invoiced();
DROP TRIGGER IF EXISTS trg_acc_sale_cogs ON public.sales;
CREATE TRIGGER trg_acc_sale_cogs AFTER INSERT OR UPDATE OF status, sale_status ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_sale_cogs();

-- ---------------------------------------------------------------------
-- 2. Ligne de vente : rattachement automatique à l'article en stock
--    (indispensable pour la réservation, la sortie et le coût des ventes)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_sale_item()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _stock numeric; _rejected boolean; _wh text; _label text; _item uuid;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide : elle doit être strictement positive';
  END IF;
  IF COALESCE(NEW.unit_price,0) < 0 OR COALESCE(NEW.total_price,0) < 0 THEN
    RAISE EXCEPTION 'Prix invalide : il ne peut pas être négatif';
  END IF;

  IF NEW.inventory_item_id IS NULL AND NEW.warehouse_id IS NOT NULL THEN
    SELECT name INTO _wh FROM inventory_items WHERE id = NEW.warehouse_id;
    _label := CASE lower(COALESCE(NEW.salt_type,'')) WHEN 'gros' THEN 'Sel gros' WHEN 'fin' THEN 'Sel fin'
               WHEN 'iode' THEN 'Sel iodé' WHEN 'raffine' THEN 'Sel raffiné' ELSE NEW.salt_type END;
    -- L'entrepôt choisi peut être lui-même un article stocké (ancien modèle)
    SELECT id INTO _item FROM inventory_items
     WHERE id = NEW.warehouse_id AND COALESCE(category,'') IN ('production','produit_fini');
    IF _item IS NULL THEN
      SELECT id INTO _item FROM inventory_items
       WHERE tenant_id = NEW.tenant_id AND category IN ('production','produit_fini') AND deleted_at IS NULL
         AND (warehouse_id = NEW.warehouse_id OR storage_location = _wh)
         AND (_label IS NULL OR lower(name) = lower(_label) OR name ILIKE '%'||COALESCE(NEW.salt_type,'')||'%')
       ORDER BY (quantity - COALESCE(reserved_quantity,0)) DESC, created_at
       LIMIT 1;
    END IF;
    NEW.inventory_item_id := _item;
  END IF;

  IF NEW.inventory_item_id IS NOT NULL THEN
    SELECT quantity - COALESCE(reserved_quantity,0) INTO _stock
      FROM inventory_items WHERE id = NEW.inventory_item_id AND tenant_id = NEW.tenant_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Article de stock introuvable pour cette entreprise'; END IF;
  ELSIF NEW.warehouse_id IS NOT NULL THEN
    _stock := 0; -- aucun article de ce type dans l'entrepôt
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
END $function$;

DROP TRIGGER IF EXISTS trg_validate_sale_item ON public.sale_items;
CREATE TRIGGER trg_validate_sale_item BEFORE INSERT OR UPDATE OF quantity, unit_price, total_price, inventory_item_id, production_record_id, warehouse_id
  ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.validate_sale_item();

-- ---------------------------------------------------------------------
-- 3. Stock : réservation à la validation, sortie à la livraison,
--    libération à l'annulation. Atomique, jamais de stock négatif.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_sale_stock_flow()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _old text := CASE WHEN TG_OP = 'INSERT' THEN 'draft' ELSE OLD.status::text END;
  _new text := NEW.status::text;
  _was_reserved boolean; _r record; _avail numeric; _prev numeric; _ref text;
BEGIN
  IF _old = _new THEN RETURN NEW; END IF;
  _was_reserved := _old IN ('confirmed','invoiced');
  _ref := COALESCE(NEW.invoice_number, NEW.sale_number);

  -- a) Validation de la commande : réserver
  IF _new IN ('confirmed','invoiced') AND _old IN ('draft','pending') THEN
    FOR _r IN SELECT si.inventory_item_id AS item, SUM(si.quantity) AS qty
                FROM sale_items si WHERE si.sale_id = NEW.id AND si.deleted_at IS NULL AND si.inventory_item_id IS NOT NULL
               GROUP BY si.inventory_item_id LOOP
      SELECT quantity - COALESCE(reserved_quantity,0) INTO _avail
        FROM inventory_items WHERE id = _r.item FOR UPDATE;
      IF _r.qty > _avail THEN
        RAISE EXCEPTION 'Stock insuffisant pour la vente % : % t demandées, % t disponibles', _ref, _r.qty, _avail;
      END IF;
      UPDATE inventory_items SET reserved_quantity = COALESCE(reserved_quantity,0) + _r.qty, updated_at = now()
       WHERE id = _r.item;
    END LOOP;

  -- b) Livraison : sortie physique du stock
  ELSIF _new IN ('delivered','completed') AND _old NOT IN ('delivered','completed') THEN
    IF TG_OP = 'UPDATE' AND OLD.stock_updated THEN RETURN NEW; END IF; -- déjà sorti (données historiques)
    FOR _r IN SELECT si.inventory_item_id AS item, SUM(si.quantity) AS qty
                FROM sale_items si WHERE si.sale_id = NEW.id AND si.deleted_at IS NULL AND si.inventory_item_id IS NOT NULL
               GROUP BY si.inventory_item_id LOOP
      SELECT quantity INTO _prev FROM inventory_items WHERE id = _r.item FOR UPDATE;
      IF _r.qty > _prev THEN
        RAISE EXCEPTION 'Stock insuffisant pour livrer la vente % : % t à livrer, % t en stock', _ref, _r.qty, _prev;
      END IF;
      UPDATE inventory_items
         SET quantity = quantity - _r.qty,
             reserved_quantity = CASE WHEN _was_reserved THEN GREATEST(0, COALESCE(reserved_quantity,0) - _r.qty)
                                      ELSE COALESCE(reserved_quantity,0) END,
             updated_at = now()
       WHERE id = _r.item;
      INSERT INTO stock_movements (tenant_id, inventory_item_id, item_name, movement_type, quantity,
             previous_quantity, new_quantity, unit_cost, unit_of_measure, reference_type, reference_id, notes, created_by)
      SELECT NEW.tenant_id, ii.id, ii.name, 'exit', _r.qty, _prev, _prev - _r.qty,
             COALESCE(NULLIF(ii.cmp,0), ii.unit_cost, 0), ii.unit_of_measure, 'sale', NEW.id,
             'Livraison vente ' || _ref, auth.uid()
        FROM inventory_items ii WHERE ii.id = _r.item;
    END LOOP;
    UPDATE sales SET stock_updated = true WHERE id = NEW.id AND NOT stock_updated;

  -- c) Annulation : libérer la réservation
  ELSIF _new = 'cancelled' AND _was_reserved THEN
    FOR _r IN SELECT si.inventory_item_id AS item, SUM(si.quantity) AS qty
                FROM sale_items si WHERE si.sale_id = NEW.id AND si.deleted_at IS NULL AND si.inventory_item_id IS NOT NULL
               GROUP BY si.inventory_item_id LOOP
      UPDATE inventory_items SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity,0) - _r.qty), updated_at = now()
       WHERE id = _r.item;
    END LOOP;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_sale_stock_flow ON public.sales;
CREATE TRIGGER trg_sale_stock_flow AFTER INSERT OR UPDATE OF status, sale_status ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_sale_stock_flow();

-- ---------------------------------------------------------------------
-- 4. Annulation d'une facture : contrepassation de l'écriture de vente
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_acc_sale_cancelled()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _ht NUMERIC; _tva NUMERIC; _ttc NUMERIC; _lines JSONB; _ctype text; _foreign boolean; _ref text;
BEGIN
  IF NEW.status <> 'cancelled' OR OLD.status NOT IN ('confirmed','invoiced') THEN RETURN NEW; END IF;
  _ref := COALESCE(NEW.invoice_number, NEW.sale_number);
  SELECT client_type::text INTO _ctype FROM public.clients WHERE id = NEW.client_id;
  _foreign := COALESCE(NEW.is_export, false) OR COALESCE(_ctype,'local') IN ('export','zone_ohada','hors_ohada');
  _ttc := COALESCE(NEW.total_amount, 0);
  _tva := COALESCE(NULLIF(NEW.tva_amount,0), NEW.tax_amount, 0);
  _ht  := COALESCE(NULLIF(NEW.amount_ht, 0), _ttc - _tva);
  IF _ttc <= 0 THEN RETURN NEW; END IF;
  IF _foreign THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','7022','label','Annulation vente hors Région','debit',_ttc,'credit',0),
      jsonb_build_object('account','411','label','Clients','debit',0,'credit',_ttc));
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','7021','label','Annulation vente dans la Région','debit',_ht,'credit',0),
      jsonb_build_object('account','411','label','Clients','debit',0,'credit',_ttc));
    IF _tva > 0 THEN
      _lines := _lines || jsonb_build_array(
        jsonb_build_object('account','4431','label','Annulation TVA facturée','debit',_tva,'credit',0));
    END IF;
  END IF;
  PERFORM public.post_accounting_entry(NEW.tenant_id, 'sale_cancelled', CURRENT_DATE, 'VE',
    'Annulation facture ' || _ref, 'sales', NEW.id, _lines,
    (CASE WHEN _foreign THEN 'vente_export' ELSE 'vente_locale' END)::transaction_type);
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_acc_sale_cancelled ON public.sales;
CREATE TRIGGER trg_acc_sale_cancelled AFTER UPDATE OF status, sale_status ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.trg_acc_sale_cancelled();

-- ---------------------------------------------------------------------
-- 5. Encaissement client : bon compte de trésorerie (521 / 571 / 552)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.treasury_account_number(_account_id uuid, _method text DEFAULT NULL)
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT coa.account_number FROM accounts a JOIN chart_of_accounts coa ON coa.id = a.chart_account_id
      WHERE a.id = _account_id AND coa.account_number ~ '^5'),
    (SELECT CASE a.account_type WHEN 'caisse' THEN '571' WHEN 'mobile_money' THEN '552' ELSE '521' END
       FROM accounts a WHERE a.id = _account_id),
    CASE WHEN _method IN ('especes','cash') THEN '571' WHEN _method = 'mobile_money' THEN '552' ELSE '521' END);
$function$;

CREATE OR REPLACE FUNCTION public.trg_acc_client_payment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _cash TEXT; _lines JSONB; _amt NUMERIC;
BEGIN
  _amt := COALESCE(NEW.amount, 0);
  IF _amt <= 0 THEN RETURN NEW; END IF;
  _cash := public.treasury_account_number(NEW.account_id, NEW.payment_method);

  IF NEW.sale_id IS NULL THEN
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
END; $function$;

-- Enregistrement d'un encaissement en une seule opération atomique
CREATE OR REPLACE FUNCTION public.record_sale_payment(
  p_sale_id uuid, p_account_id uuid, p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE, p_payment_method text DEFAULT NULL,
  p_can_be_delivered boolean DEFAULT NULL, p_notes text DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _tenant uuid := public.get_user_tenant_id(auth.uid());
  _sale public.sales%ROWTYPE; _acc public.accounts%ROWTYPE;
  _amount numeric; _remaining numeric; _method text; _pay uuid; _ref text; _paid numeric;
BEGIN
  IF _tenant IS NULL THEN RAISE EXCEPTION 'Utilisateur sans entreprise' USING ERRCODE = '42501'; END IF;
  IF NOT public.has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[]) THEN
    RAISE EXCEPTION 'Accès refusé : encaissement réservé au gérant ou au comptable' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _sale FROM sales WHERE id = p_sale_id AND tenant_id = _tenant AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Facture introuvable'; END IF;
  IF _sale.status::text NOT IN ('confirmed','invoiced','delivered','completed') THEN
    RAISE EXCEPTION 'La vente % n''est pas facturée (statut : %)', COALESCE(_sale.invoice_number,_sale.sale_number), _sale.status;
  END IF;

  _amount := round(COALESCE(p_amount,0), 0);
  IF _amount <= 0 THEN RAISE EXCEPTION 'Le montant encaissé doit être strictement positif'; END IF;
  _remaining := COALESCE(_sale.total_amount,0) - COALESCE(_sale.total_paid,0);
  IF _amount > _remaining THEN
    RAISE EXCEPTION 'Montant supérieur au reste à payer (% FCFA)', _remaining;
  END IF;

  SELECT * INTO _acc FROM accounts WHERE id = p_account_id AND tenant_id = _tenant AND deleted_at IS NULL AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Compte de trésorerie introuvable ou inactif'; END IF;

  _method := lower(COALESCE(NULLIF(p_payment_method,''),
              CASE _acc.account_type WHEN 'caisse' THEN 'especes' WHEN 'mobile_money' THEN 'mobile_money' ELSE 'virement' END));
  IF _method IN ('especes','cash') AND _acc.account_type <> 'caisse' THEN
    RAISE EXCEPTION 'Un paiement en espèces doit être encaissé sur une caisse';
  END IF;
  IF _method IN ('virement','cheque','carte') AND _acc.account_type <> 'banque' THEN
    RAISE EXCEPTION 'Un virement ou un chèque doit être encaissé sur un compte bancaire';
  END IF;
  IF _method = 'mobile_money' AND _acc.account_type NOT IN ('mobile_money','caisse') THEN
    RAISE EXCEPTION 'Un paiement mobile money doit être encaissé sur un compte mobile money';
  END IF;

  INSERT INTO payments (tenant_id, sale_id, client_id, amount, payment_method, payment_date, account_id, notes, created_by)
  VALUES (_tenant, _sale.id, _sale.client_id, _amount, _method, COALESCE(p_payment_date, CURRENT_DATE), _acc.id, p_notes, auth.uid())
  RETURNING id, reference INTO _pay, _ref;

  _paid := COALESCE(_sale.total_paid,0) + _amount;
  UPDATE sales
     SET total_paid = _paid,
         payment_status = (CASE WHEN _paid >= COALESCE(total_amount,0) THEN 'paid' ELSE 'partial' END)::payment_status,
         can_be_delivered = COALESCE(p_can_be_delivered, can_be_delivered)
   WHERE id = _sale.id;

  UPDATE accounts SET current_balance = COALESCE(current_balance,0) + _amount, updated_at = now() WHERE id = _acc.id;

  RETURN jsonb_build_object('payment_id', _pay, 'reference', _ref, 'amount', _amount,
    'total_paid', _paid, 'remaining', COALESCE(_sale.total_amount,0) - _paid,
    'payment_status', CASE WHEN _paid >= COALESCE(_sale.total_amount,0) THEN 'paid' ELSE 'partial' END,
    'treasury_account', public.treasury_account_number(_acc.id, _method));
END $function$;

REVOKE ALL ON FUNCTION public.record_sale_payment(uuid, uuid, numeric, date, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_sale_payment(uuid, uuid, numeric, date, text, boolean, text) TO authenticated;
REVOKE ALL ON FUNCTION public.treasury_account_number(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sync_sale_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_sale_stock_flow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_acc_sale_cancelled() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. Réalignement des ventes historiques (status ≠ sale_status).
--    Aucune écriture ni mouvement de stock n'est rejoué : les déclencheurs
--    ne réagissent qu'à un changement de `status`, qui reste inchangé ici.
-- ---------------------------------------------------------------------
UPDATE public.sales SET sale_status = status WHERE sale_status IS DISTINCT FROM status;
