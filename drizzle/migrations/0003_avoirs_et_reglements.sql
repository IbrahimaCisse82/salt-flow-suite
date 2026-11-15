-- =====================================================================
-- Lot 3.2 — Avoirs clients et fournisseurs, règlements fournisseurs
--
--  * Avoirs clients : retour de marchandise (avec réintégration en stock)
--    ou rabais (réduction de prix), imputés sur la facture, avec
--    remboursement éventuel si la facture était déjà payée.
--  * Avoirs fournisseurs : retour de marchandise (sortie de stock) ou rabais
--    obtenu, avec remboursement éventuel reçu du fournisseur.
--  * Règlements fournisseurs : l'écran comptait sur un déclencheur
--    (trg_handle_purchase_payment) absent de la base → montant payé, statut
--    de la commande et solde du compte n'étaient jamais mis à jour.
--    Le compte de trésorerie suit désormais le type de compte (521/571/552)
--    et un remboursement reçu est enregistré dans le bon sens.
--
-- Comptes SYSCOHADA révisé utilisés :
--   Avoir client retour  : D 7021/7022 (HT) + D 4431 (TVA) / C 411 (TTC)
--                          + D 361 / C 736 au coût de sortie (réintégration)
--   Avoir client rabais  : D 7029 (HT) + D 4431 (TVA) / C 411 (TTC)
--   Remboursement client : D 411 / C 521-571-552
--   Avoir fourn. retour  : D 401 (TTC) / C 602 ou 605 (HT) + C 4452 (TVA)
--   Avoir fourn. rabais  : D 401 (TTC) / C 6029 ou 6059 (HT) + C 4452 (TVA)
--   Remboursement fourn. : D 521-571-552 / C 401
-- Idempotent (rejouable). Dépend de 0002.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Numérotation : AV (avoir client) et AVF (avoir fournisseur)
-- ---------------------------------------------------------------------
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
    WHEN 'payment' THEN 'PMT' WHEN 'delivery_note' THEN 'BL'
    WHEN 'credit_note' THEN 'AV' WHEN 'supplier_credit_note' THEN 'AVF' ELSE 'DOC' END;
  _year := EXTRACT(YEAR FROM CURRENT_DATE);
  INSERT INTO public.document_sequences (tenant_id, doc_type, year, last_number)
  VALUES (p_tenant_id, p_doc_type, _year, 1)
  ON CONFLICT (tenant_id, doc_type, year) DO UPDATE
    SET last_number = public.document_sequences.last_number + 1, updated_at = now()
  RETURNING last_number INTO _next;
  RETURN _prefix || '-' || _year::TEXT || '-' || LPAD(_next::TEXT, 5, '0');
END $function$;

-- ---------------------------------------------------------------------
-- 1. Montants avoirés sur les documents d'origine
-- ---------------------------------------------------------------------
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS credited_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS credited_amount numeric NOT NULL DEFAULT 0;

-- Un bon de commande réceptionné reste verrouillé, sauf pour le suivi des
-- règlements et des avoirs.
CREATE OR REPLACE FUNCTION public.prevent_modify_received_po()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE _skip text[] := ARRAY['total_paid','credited_amount','status','updated_at'];
BEGIN
  IF OLD.status = 'received' AND NEW.status IN ('received','partially_paid','paid')
     AND (to_jsonb(NEW) - _skip) IS DISTINCT FROM (to_jsonb(OLD) - _skip) THEN
    RAISE EXCEPTION 'Bon de commande déjà livré : modification interdite';
  END IF;
  RETURN NEW;
END $function$;

-- Une facture ayant déjà fait l'objet d'un avoir ne peut plus être annulée
-- (la contrepassation intégrale doublerait l'avoir) : on complète par avoir.
CREATE OR REPLACE FUNCTION public.block_cancel_credited_sale()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND COALESCE(OLD.credited_amount,0) > 0 THEN
    RAISE EXCEPTION 'Vente % : un avoir de % FCFA existe déjà, annulation impossible (complétez par un avoir)',
      COALESCE(OLD.invoice_number, OLD.sale_number), OLD.credited_amount;
  END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS trg_ab_block_cancel_credited ON public.sales;
CREATE TRIGGER trg_ab_block_cancel_credited BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.block_cancel_credited_sale();

-- ---------------------------------------------------------------------
-- 2. Tables des avoirs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.get_user_tenant_id(auth.uid()) REFERENCES public.tenants(id) ON DELETE CASCADE,
  credit_note_number text NOT NULL,
  sale_id uuid NOT NULL REFERENCES public.sales(id),
  client_id uuid REFERENCES public.clients(id),
  credit_date date NOT NULL DEFAULT CURRENT_DATE,
  kind text NOT NULL CHECK (kind IN ('retour','rabais')),
  reason text NOT NULL CHECK (length(trim(reason)) >= 3),
  amount_ht numeric NOT NULL CHECK (amount_ht > 0),
  tva_amount numeric NOT NULL DEFAULT 0 CHECK (tva_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  cost_amount numeric NOT NULL DEFAULT 0,
  refund_amount numeric NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  refund_account_id uuid REFERENCES public.accounts(id),
  status text NOT NULL DEFAULT 'validated' CHECK (status IN ('validated')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, credit_note_number)
);
CREATE TABLE IF NOT EXISTS public.credit_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.get_user_tenant_id(auth.uid()),
  credit_note_id uuid NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  sale_item_id uuid REFERENCES public.sale_items(id),
  inventory_item_id uuid REFERENCES public.inventory_items(id),
  description text,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  unit_cost numeric NOT NULL DEFAULT 0,
  amount_ht numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.supplier_credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.get_user_tenant_id(auth.uid()) REFERENCES public.tenants(id) ON DELETE CASCADE,
  credit_note_number text NOT NULL,
  supplier_reference text,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  credit_date date NOT NULL DEFAULT CURRENT_DATE,
  kind text NOT NULL CHECK (kind IN ('retour','rabais')),
  reason text NOT NULL CHECK (length(trim(reason)) >= 3),
  amount_ht numeric NOT NULL CHECK (amount_ht > 0),
  tva_amount numeric NOT NULL DEFAULT 0 CHECK (tva_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  refund_amount numeric NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  refund_account_id uuid REFERENCES public.accounts(id),
  status text NOT NULL DEFAULT 'validated' CHECK (status IN ('validated')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, credit_note_number)
);
CREATE TABLE IF NOT EXISTS public.supplier_credit_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.get_user_tenant_id(auth.uid()),
  supplier_credit_note_id uuid NOT NULL REFERENCES public.supplier_credit_notes(id) ON DELETE CASCADE,
  purchase_order_item_id uuid REFERENCES public.purchase_order_items(id),
  inventory_item_id uuid REFERENCES public.inventory_items(id),
  description text,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  amount_ht numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_notes_sale ON public.credit_notes (tenant_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_note_items_cn ON public.credit_note_items (credit_note_id);
CREATE INDEX IF NOT EXISTS idx_credit_note_items_si ON public.credit_note_items (sale_item_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cn_po ON public.supplier_credit_notes (tenant_id, purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cn_items ON public.supplier_credit_note_items (supplier_credit_note_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cn_items_poi ON public.supplier_credit_note_items (purchase_order_item_id);

-- Lecture par les membres de l'entreprise ; écriture uniquement via les
-- fonctions serveur ci-dessous (aucune politique INSERT/UPDATE/DELETE).
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_credit_note_items ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['credit_notes','credit_note_items','supplier_credit_notes','supplier_credit_note_items'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())) OR public.has_role(auth.uid(), ''admin''::app_role))', t||'_select', t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 3. Encaissement client : le reste à payer tient compte des avoirs
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sale_remaining_due(_sale public.sales)
 RETURNS numeric LANGUAGE sql IMMUTABLE AS $function$
  SELECT COALESCE(_sale.total_amount,0) - COALESCE(_sale.credited_amount,0) - COALESCE(_sale.total_paid,0);
$function$;

CREATE OR REPLACE FUNCTION public.record_sale_payment(
  p_sale_id uuid, p_account_id uuid, p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE, p_payment_method text DEFAULT NULL,
  p_can_be_delivered boolean DEFAULT NULL, p_notes text DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _tenant uuid := public.get_user_tenant_id(auth.uid());
  _sale public.sales%ROWTYPE; _acc public.accounts%ROWTYPE;
  _amount numeric; _remaining numeric; _method text; _pay uuid; _ref text; _paid numeric; _left numeric;
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
  _remaining := public.sale_remaining_due(_sale);
  IF _amount > _remaining THEN
    RAISE EXCEPTION 'Montant supérieur au reste à payer (% FCFA)', GREATEST(_remaining,0);
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
  _left := _remaining - _amount;
  UPDATE sales
     SET total_paid = _paid,
         payment_status = (CASE WHEN _left <= 0 THEN 'paid' ELSE 'partial' END)::payment_status,
         can_be_delivered = COALESCE(p_can_be_delivered, can_be_delivered)
   WHERE id = _sale.id;

  UPDATE accounts SET current_balance = COALESCE(current_balance,0) + _amount, updated_at = now() WHERE id = _acc.id;

  RETURN jsonb_build_object('payment_id', _pay, 'reference', _ref, 'amount', _amount,
    'total_paid', _paid, 'remaining', _left,
    'payment_status', CASE WHEN _left <= 0 THEN 'paid' ELSE 'partial' END,
    'treasury_account', public.treasury_account_number(_acc.id, _method));
END $function$;

-- Contrôles communs aux remboursements
CREATE OR REPLACE FUNCTION public.assert_treasury_account(_tenant uuid, _account_id uuid)
 RETURNS public.accounts LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _acc public.accounts%ROWTYPE;
BEGIN
  SELECT * INTO _acc FROM accounts WHERE id = _account_id AND tenant_id = _tenant AND deleted_at IS NULL AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Compte de trésorerie introuvable ou inactif'; END IF;
  RETURN _acc;
END $function$;

-- ---------------------------------------------------------------------
-- 4. Avoir client
--    p_lines (retour) : [{"sale_item_id": "...", "quantity": 5}, ...]
--    p_amount_ht (rabais) : montant HT de la réduction
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_sale_credit_note(
  p_sale_id uuid, p_kind text, p_reason text,
  p_lines jsonb DEFAULT NULL, p_amount_ht numeric DEFAULT NULL,
  p_credit_date date DEFAULT CURRENT_DATE, p_refund_account_id uuid DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _tenant uuid := public.get_user_tenant_id(auth.uid());
  _sale public.sales%ROWTYPE; _acc public.accounts%ROWTYPE;
  _foreign boolean; _ctype text; _rate numeric; _ref text;
  _cn uuid; _num text; _l jsonb; _si record; _qty numeric; _already numeric;
  _ht numeric := 0; _tva numeric; _ttc numeric; _cost numeric := 0; _line_ht numeric; _unit_cost numeric;
  _sale_ht numeric; _sale_tva numeric; _remaining numeric; _refund numeric := 0; _lines jsonb; _prev numeric;
  _treasury text;
BEGIN
  IF _tenant IS NULL THEN RAISE EXCEPTION 'Utilisateur sans entreprise' USING ERRCODE = '42501'; END IF;
  IF NOT public.has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[]) THEN
    RAISE EXCEPTION 'Accès refusé : avoir réservé au gérant ou au comptable' USING ERRCODE = '42501';
  END IF;
  IF p_kind NOT IN ('retour','rabais') THEN RAISE EXCEPTION 'Type d''avoir invalide (retour ou rabais)'; END IF;
  IF length(trim(COALESCE(p_reason,''))) < 3 THEN RAISE EXCEPTION 'Le motif de l''avoir est obligatoire'; END IF;

  SELECT * INTO _sale FROM sales WHERE id = p_sale_id AND tenant_id = _tenant AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Facture introuvable'; END IF;
  _ref := COALESCE(_sale.invoice_number, _sale.sale_number);
  IF _sale.status::text NOT IN ('confirmed','invoiced','delivered','completed') THEN
    RAISE EXCEPTION 'Un avoir ne peut porter que sur une facture émise (vente % : %)', _ref, _sale.status;
  END IF;
  IF p_kind = 'retour' AND _sale.status::text NOT IN ('delivered','completed') THEN
    RAISE EXCEPTION 'Facture % non livrée : annulez-la ou faites un avoir de type rabais', _ref;
  END IF;

  SELECT client_type::text INTO _ctype FROM clients WHERE id = _sale.client_id;
  _foreign := COALESCE(_sale.is_export,false) OR COALESCE(_ctype,'local') IN ('export','zone_ohada','hors_ohada');
  _sale_tva := COALESCE(NULLIF(_sale.tva_amount,0), _sale.tax_amount, 0);
  _sale_ht := COALESCE(NULLIF(_sale.amount_ht,0), _sale.total_amount - _sale_tva);
  _rate := CASE WHEN _foreign OR _sale_tva = 0 OR _sale_ht = 0 THEN 0
                WHEN COALESCE(_sale.tva_rate,0) > 0 THEN _sale.tva_rate / 100.0
                ELSE _sale_tva / _sale_ht END;

  _num := public.next_document_number_for(_tenant, 'credit_note');
  INSERT INTO credit_notes (tenant_id, credit_note_number, sale_id, client_id, credit_date, kind, reason,
                            amount_ht, tva_amount, total_amount, created_by)
  VALUES (_tenant, _num, _sale.id, _sale.client_id, COALESCE(p_credit_date, CURRENT_DATE), p_kind, trim(p_reason),
          1, 0, 1, auth.uid())
  RETURNING id INTO _cn;

  IF p_kind = 'retour' THEN
    IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
      RAISE EXCEPTION 'Indiquez au moins une ligne retournée';
    END IF;
    FOR _l IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
      _qty := COALESCE((_l->>'quantity')::numeric, 0);
      IF _qty <= 0 THEN CONTINUE; END IF;
      SELECT si.* INTO _si FROM sale_items si
       WHERE si.id = (_l->>'sale_item_id')::uuid AND si.sale_id = _sale.id AND si.deleted_at IS NULL;
      IF NOT FOUND THEN RAISE EXCEPTION 'Ligne de facture introuvable'; END IF;
      SELECT COALESCE(SUM(cni.quantity),0) INTO _already FROM credit_note_items cni WHERE cni.sale_item_id = _si.id;
      IF _qty > _si.quantity - _already THEN
        RAISE EXCEPTION 'Retour de % t impossible : % t facturées, % t déjà retournées', _qty, _si.quantity, _already;
      END IF;
      _line_ht := round(_qty * COALESCE(_si.unit_price,0), 0);
      _unit_cost := 0;
      IF _si.inventory_item_id IS NOT NULL THEN
        -- Coût de la sortie d'origine, à défaut le coût moyen actuel
        SELECT COALESCE((SELECT sm.unit_cost FROM stock_movements sm
                          WHERE sm.reference_type = 'sale' AND sm.reference_id = _sale.id
                            AND sm.inventory_item_id = _si.inventory_item_id AND sm.movement_type = 'exit'
                          ORDER BY sm.created_at DESC LIMIT 1),
                        NULLIF(ii.cmp,0), ii.unit_cost, 0), ii.quantity
          INTO _unit_cost, _prev
          FROM inventory_items ii WHERE ii.id = _si.inventory_item_id FOR UPDATE;
        UPDATE inventory_items
           SET cmp = CASE WHEN quantity + _qty > 0 THEN round(((quantity * COALESCE(cmp,0)) + (_qty * _unit_cost)) / (quantity + _qty), 6) ELSE cmp END,
               quantity = quantity + _qty, updated_at = now()
         WHERE id = _si.inventory_item_id;
        INSERT INTO stock_movements (tenant_id, inventory_item_id, item_name, movement_type, quantity, previous_quantity,
               new_quantity, unit_cost, unit_of_measure, reference_type, reference_id, notes, created_by)
        SELECT _tenant, ii.id, ii.name, 'entry', _qty, _prev, _prev + _qty, _unit_cost, ii.unit_of_measure,
               'credit_note', _cn, 'Retour client ' || _num || ' (facture ' || _ref || ')', auth.uid()
          FROM inventory_items ii WHERE ii.id = _si.inventory_item_id;
        _cost := _cost + round(_qty * _unit_cost, 0);
      END IF;
      INSERT INTO credit_note_items (tenant_id, credit_note_id, sale_item_id, inventory_item_id, description, quantity, unit_price, unit_cost, amount_ht)
      VALUES (_tenant, _cn, _si.id, _si.inventory_item_id, COALESCE(_si.description, _si.salt_type), _qty, COALESCE(_si.unit_price,0), _unit_cost, _line_ht);
      _ht := _ht + _line_ht;
    END LOOP;
    IF _ht <= 0 THEN RAISE EXCEPTION 'Aucune quantité retournée'; END IF;
  ELSE
    _ht := round(COALESCE(p_amount_ht,0), 0);
    IF _ht <= 0 THEN RAISE EXCEPTION 'Le montant HT du rabais doit être strictement positif'; END IF;
    INSERT INTO credit_note_items (tenant_id, credit_note_id, description, quantity, unit_price, amount_ht)
    VALUES (_tenant, _cn, 'Rabais sur facture ' || _ref, 1, _ht, _ht);
  END IF;

  _tva := round(_ht * _rate, 0);
  _ttc := _ht + _tva;
  IF _ttc > COALESCE(_sale.total_amount,0) - COALESCE(_sale.credited_amount,0) THEN
    RAISE EXCEPTION 'Avoir de % FCFA supérieur au montant restant de la facture % (% FCFA)',
      _ttc, _ref, COALESCE(_sale.total_amount,0) - COALESCE(_sale.credited_amount,0);
  END IF;

  -- Partie déjà payée à rembourser au client
  _remaining := public.sale_remaining_due(_sale);
  _refund := GREATEST(0, _ttc - GREATEST(_remaining, 0));

  UPDATE credit_notes SET amount_ht = _ht, tva_amount = _tva, total_amount = _ttc, cost_amount = _cost WHERE id = _cn;

  -- Écriture de l'avoir
  IF _foreign THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account', CASE WHEN p_kind = 'retour' THEN '7022' ELSE '7029' END,
        'label', CASE WHEN p_kind = 'retour' THEN 'Retour sur ventes hors Région' ELSE 'Rabais, remises et ristournes accordés' END,
        'debit', _ht, 'credit', 0));
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account', CASE WHEN p_kind = 'retour' THEN '7021' ELSE '7029' END,
        'label', CASE WHEN p_kind = 'retour' THEN 'Retour sur ventes dans la Région' ELSE 'Rabais, remises et ristournes accordés' END,
        'debit', _ht, 'credit', 0));
    IF _tva > 0 THEN
      _lines := _lines || jsonb_build_array(jsonb_build_object('account','4431','label','TVA facturée (avoir)','debit',_tva,'credit',0));
    END IF;
  END IF;
  _lines := _lines || jsonb_build_array(jsonb_build_object('account','411','label','Clients','debit',0,'credit',_ttc));
  PERFORM public.post_accounting_entry(_tenant, 'sale_credit_note', COALESCE(p_credit_date, CURRENT_DATE), 'VE',
    'Avoir ' || _num || ' sur facture ' || _ref, 'credit_notes', _cn, _lines,
    (CASE WHEN _foreign THEN 'vente_export' ELSE 'vente_locale' END)::transaction_type);

  -- Réintégration en stock au coût
  IF _cost > 0 THEN
    PERFORM public.post_accounting_entry(_tenant, 'sale_return_stock', COALESCE(p_credit_date, CURRENT_DATE), 'ST',
      'Retour en stock — avoir ' || _num, 'credit_notes', _cn,
      jsonb_build_array(
        jsonb_build_object('account','361','label','Produits finis','debit',_cost,'credit',0),
        jsonb_build_object('account','736','label','Variations des stocks de produits finis (retour client)','debit',0,'credit',_cost)),
      'od');
  END IF;

  -- Remboursement immédiat du trop-perçu
  IF _refund > 0 AND p_refund_account_id IS NOT NULL THEN
    _acc := public.assert_treasury_account(_tenant, p_refund_account_id);
    IF COALESCE(_acc.current_balance,0) < _refund THEN
      RAISE EXCEPTION 'Solde insuffisant sur « % » pour rembourser % FCFA', _acc.account_name, _refund;
    END IF;
    _treasury := public.treasury_account_number(_acc.id, NULL);
    PERFORM public.post_accounting_entry(_tenant, 'client_refund', COALESCE(p_credit_date, CURRENT_DATE), 'TR',
      'Remboursement client — avoir ' || _num, 'credit_notes', _cn,
      jsonb_build_array(
        jsonb_build_object('account','411','label','Clients','debit',_refund,'credit',0),
        jsonb_build_object('account',_treasury,'label','Trésorerie','debit',0,'credit',_refund)),
      'paiement');
    UPDATE accounts SET current_balance = current_balance - _refund, updated_at = now() WHERE id = _acc.id;
    UPDATE credit_notes SET refund_amount = _refund, refund_account_id = _acc.id WHERE id = _cn;
    UPDATE sales SET total_paid = total_paid - _refund WHERE id = _sale.id;
  END IF;

  UPDATE sales
     SET credited_amount = credited_amount + _ttc,
         payment_status = (CASE WHEN total_amount - (credited_amount + _ttc) - total_paid <= 0 THEN 'paid'
                                WHEN total_paid > 0 THEN 'partial' ELSE payment_status::text END)::payment_status
   WHERE id = _sale.id;

  RETURN jsonb_build_object('credit_note_id', _cn, 'credit_note_number', _num, 'amount_ht', _ht, 'tva_amount', _tva,
    'total_amount', _ttc, 'cost_amount', _cost,
    'refund_due', CASE WHEN p_refund_account_id IS NULL THEN _refund ELSE 0 END,
    'refunded', CASE WHEN p_refund_account_id IS NULL THEN 0 ELSE _refund END);
END $function$;

-- ---------------------------------------------------------------------
-- 5. Règlements fournisseurs : bon compte de trésorerie, remboursement
--    dans le bon sens, et mise à jour de la commande et du solde.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_acc_purchase_payment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _cash TEXT; _lines JSONB; _amt NUMERIC;
BEGIN
  _amt := COALESCE(NEW.amount, 0);
  IF _amt <= 0 THEN RETURN NEW; END IF;
  _cash := public.treasury_account_number(NEW.account_id, NEW.payment_method);

  IF NEW.payment_type = 'advance' THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','4091','label','Fournisseurs, avances versées','debit',_amt,'credit',0),
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'supplier_advance',NEW.payment_date,'TR',
      'Avance fournisseur','purchase_payments',NEW.id,_lines,'paiement');
  ELSIF NEW.payment_type = 'refund' THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',_amt,'credit',0),
      jsonb_build_object('account','401','label','Fournisseurs','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'supplier_refund',NEW.payment_date,'TR',
      'Remboursement reçu du fournisseur','purchase_payments',NEW.id,_lines,'encaissement');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','401','label','Fournisseurs','debit',_amt,'credit',0),
      jsonb_build_object('account',_cash,'label','Trésorerie','debit',0,'credit',_amt));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'supplier_payment',NEW.payment_date,'TR',
      'Règlement fournisseur','purchase_payments',NEW.id,_lines,'paiement');
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.validate_purchase_payment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _po public.purchase_orders%ROWTYPE; _acc public.accounts%ROWTYPE; _due numeric; _m text;
BEGIN
  NEW.amount := round(COALESCE(NEW.amount,0), 0);
  IF NEW.amount <= 0 THEN RAISE EXCEPTION 'Le montant doit être strictement positif'; END IF;
  SELECT * INTO _po FROM purchase_orders WHERE id = NEW.purchase_order_id AND tenant_id = NEW.tenant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bon de commande introuvable'; END IF;
  IF _po.status::text IN ('draft','cancelled','rejected') THEN
    RAISE EXCEPTION 'Bon de commande % non validé (statut : %)', _po.order_number, _po.status;
  END IF;
  _due := COALESCE(_po.total_amount,0) - COALESCE(_po.credited_amount,0) - COALESCE(_po.total_paid,0);
  IF NEW.payment_type IN ('payment','advance') AND NEW.amount > _due THEN
    RAISE EXCEPTION 'Montant supérieur au reste à payer (% FCFA)', GREATEST(_due,0);
  END IF;
  IF NEW.payment_type = 'refund' AND NEW.amount > GREATEST(-_due, 0) THEN
    RAISE EXCEPTION 'Remboursement supérieur au trop-payé (% FCFA)', GREATEST(-_due,0);
  END IF;
  IF NEW.account_id IS NOT NULL THEN
    SELECT * INTO _acc FROM accounts WHERE id = NEW.account_id AND tenant_id = NEW.tenant_id AND deleted_at IS NULL AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Compte de trésorerie introuvable ou inactif'; END IF;
    _m := lower(COALESCE(NEW.payment_method,''));
    IF _m IN ('especes','cash') AND _acc.account_type <> 'caisse' THEN
      RAISE EXCEPTION 'Un paiement en espèces doit passer par une caisse';
    END IF;
    IF _m IN ('virement','cheque','carte') AND _acc.account_type <> 'banque' THEN
      RAISE EXCEPTION 'Un virement ou un chèque doit passer par un compte bancaire';
    END IF;
    IF NEW.payment_type <> 'refund' AND COALESCE(_acc.current_balance,0) < NEW.amount THEN
      RAISE EXCEPTION 'Solde insuffisant sur « % » (% FCFA disponibles)', _acc.account_name, _acc.current_balance;
    END IF;
  END IF;
  NEW.processed_by := COALESCE(NEW.processed_by, auth.uid());
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.settle_purchase_payment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _sign numeric := CASE WHEN NEW.payment_type = 'refund' THEN -1 ELSE 1 END; _po public.purchase_orders%ROWTYPE; _due numeric;
BEGIN
  UPDATE purchase_orders SET total_paid = COALESCE(total_paid,0) + _sign * NEW.amount
   WHERE id = NEW.purchase_order_id RETURNING * INTO _po;
  _due := COALESCE(_po.total_amount,0) - COALESCE(_po.credited_amount,0) - COALESCE(_po.total_paid,0);
  IF _po.status::text IN ('received','partially_paid','paid') THEN
    UPDATE purchase_orders
       SET status = (CASE WHEN _due <= 0 THEN 'paid' WHEN _po.total_paid > 0 THEN 'partially_paid' ELSE 'received' END)::po_status
     WHERE id = _po.id AND status::text IS DISTINCT FROM (CASE WHEN _due <= 0 THEN 'paid' WHEN _po.total_paid > 0 THEN 'partially_paid' ELSE 'received' END);
  END IF;
  IF NEW.account_id IS NOT NULL THEN
    UPDATE accounts SET current_balance = COALESCE(current_balance,0) - _sign * NEW.amount, updated_at = now()
     WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_validate_purchase_payment ON public.purchase_payments;
CREATE TRIGGER trg_validate_purchase_payment BEFORE INSERT ON public.purchase_payments
  FOR EACH ROW EXECUTE FUNCTION public.validate_purchase_payment();
DROP TRIGGER IF EXISTS trg_settle_purchase_payment ON public.purchase_payments;
CREATE TRIGGER trg_settle_purchase_payment AFTER INSERT ON public.purchase_payments
  FOR EACH ROW EXECUTE FUNCTION public.settle_purchase_payment();

-- ---------------------------------------------------------------------
-- 6. Avoir fournisseur
--    p_lines (retour) : [{"purchase_order_item_id": "...", "quantity": 10}, ...]
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_supplier_credit_note(
  p_purchase_order_id uuid, p_kind text, p_reason text,
  p_lines jsonb DEFAULT NULL, p_amount_ht numeric DEFAULT NULL,
  p_credit_date date DEFAULT CURRENT_DATE, p_supplier_reference text DEFAULT NULL,
  p_refund_account_id uuid DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _tenant uuid := public.get_user_tenant_id(auth.uid());
  _po public.purchase_orders%ROWTYPE; _acc public.accounts%ROWTYPE;
  _cn uuid; _num text; _l jsonb; _it record; _qty numeric; _already numeric; _prev numeric;
  _ht numeric := 0; _tva numeric; _ttc numeric; _line_ht numeric; _rate numeric; _po_ht numeric; _po_tva numeric;
  _has_stock boolean; _lines jsonb; _due numeric; _refund numeric := 0; _method text;
BEGIN
  IF _tenant IS NULL THEN RAISE EXCEPTION 'Utilisateur sans entreprise' USING ERRCODE = '42501'; END IF;
  IF NOT public.has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[]) THEN
    RAISE EXCEPTION 'Accès refusé : avoir réservé au gérant ou au comptable' USING ERRCODE = '42501';
  END IF;
  IF p_kind NOT IN ('retour','rabais') THEN RAISE EXCEPTION 'Type d''avoir invalide (retour ou rabais)'; END IF;
  IF length(trim(COALESCE(p_reason,''))) < 3 THEN RAISE EXCEPTION 'Le motif de l''avoir est obligatoire'; END IF;

  SELECT * INTO _po FROM purchase_orders WHERE id = p_purchase_order_id AND tenant_id = _tenant AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bon de commande introuvable'; END IF;
  IF _po.status::text NOT IN ('received','partially_received','partially_paid','paid') THEN
    RAISE EXCEPTION 'Un avoir fournisseur ne porte que sur une commande réceptionnée (% : %)', _po.order_number, _po.status;
  END IF;

  _po_tva := COALESCE(NULLIF(_po.tva_amount,0), _po.tax_amount, 0);
  _po_ht := COALESCE(NULLIF(_po.amount_ht,0), _po.total_amount - _po_tva);
  _rate := CASE WHEN _po_tva = 0 OR _po_ht = 0 THEN 0
                WHEN COALESCE(_po.tva_rate,0) > 0 THEN _po.tva_rate / 100.0 ELSE _po_tva / _po_ht END;
  SELECT EXISTS (SELECT 1 FROM purchase_order_items WHERE purchase_order_id = _po.id AND inventory_item_id IS NOT NULL) INTO _has_stock;

  _num := public.next_document_number_for(_tenant, 'supplier_credit_note');
  INSERT INTO supplier_credit_notes (tenant_id, credit_note_number, supplier_reference, purchase_order_id, supplier_id,
         credit_date, kind, reason, amount_ht, tva_amount, total_amount, created_by)
  VALUES (_tenant, _num, NULLIF(trim(COALESCE(p_supplier_reference,'')),''), _po.id, _po.supplier_id,
          COALESCE(p_credit_date, CURRENT_DATE), p_kind, trim(p_reason), 1, 0, 1, auth.uid())
  RETURNING id INTO _cn;

  IF p_kind = 'retour' THEN
    IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
      RAISE EXCEPTION 'Indiquez au moins une ligne retournée';
    END IF;
    FOR _l IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
      _qty := COALESCE((_l->>'quantity')::numeric, 0);
      IF _qty <= 0 THEN CONTINUE; END IF;
      SELECT poi.* INTO _it FROM purchase_order_items poi
       WHERE poi.id = (_l->>'purchase_order_item_id')::uuid AND poi.purchase_order_id = _po.id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Ligne de commande introuvable'; END IF;
      SELECT COALESCE(SUM(quantity),0) INTO _already FROM supplier_credit_note_items WHERE purchase_order_item_id = _it.id;
      IF _qty > COALESCE(_it.received_quantity,0) - _already THEN
        RAISE EXCEPTION 'Retour de % impossible : % reçus, % déjà retournés', _qty, COALESCE(_it.received_quantity,0), _already;
      END IF;
      _line_ht := round(_qty * COALESCE(_it.unit_price,0), 0);
      IF _it.inventory_item_id IS NOT NULL THEN
        SELECT quantity INTO _prev FROM inventory_items WHERE id = _it.inventory_item_id FOR UPDATE;
        IF _qty > _prev THEN
          RAISE EXCEPTION 'Stock insuffisant pour retourner % (% en stock)', _qty, _prev;
        END IF;
        UPDATE inventory_items SET quantity = quantity - _qty, updated_at = now() WHERE id = _it.inventory_item_id;
        INSERT INTO stock_movements (tenant_id, inventory_item_id, item_name, movement_type, quantity, previous_quantity,
               new_quantity, unit_cost, unit_of_measure, reference_type, reference_id, notes, created_by)
        SELECT _tenant, ii.id, ii.name, 'exit', _qty, _prev, _prev - _qty, COALESCE(_it.unit_price,0), ii.unit_of_measure,
               'supplier_credit_note', _cn, 'Retour fournisseur ' || _num || ' (BC ' || _po.order_number || ')', auth.uid()
          FROM inventory_items ii WHERE ii.id = _it.inventory_item_id;
      END IF;
      INSERT INTO supplier_credit_note_items (tenant_id, supplier_credit_note_id, purchase_order_item_id, inventory_item_id,
             description, quantity, unit_price, amount_ht)
      VALUES (_tenant, _cn, _it.id, _it.inventory_item_id, COALESCE(_it.item_name, _it.description), _qty, COALESCE(_it.unit_price,0), _line_ht);
      _ht := _ht + _line_ht;
    END LOOP;
    IF _ht <= 0 THEN RAISE EXCEPTION 'Aucune quantité retournée'; END IF;
  ELSE
    _ht := round(COALESCE(p_amount_ht,0), 0);
    IF _ht <= 0 THEN RAISE EXCEPTION 'Le montant HT du rabais doit être strictement positif'; END IF;
    INSERT INTO supplier_credit_note_items (tenant_id, supplier_credit_note_id, description, quantity, unit_price, amount_ht)
    VALUES (_tenant, _cn, 'Rabais obtenu sur BC ' || _po.order_number, 1, _ht, _ht);
  END IF;

  _tva := round(_ht * _rate, 0);
  _ttc := _ht + _tva;
  IF _ttc > COALESCE(_po.total_amount,0) - COALESCE(_po.credited_amount,0) THEN
    RAISE EXCEPTION 'Avoir de % FCFA supérieur au montant restant de la commande % (% FCFA)',
      _ttc, _po.order_number, COALESCE(_po.total_amount,0) - COALESCE(_po.credited_amount,0);
  END IF;
  UPDATE supplier_credit_notes SET amount_ht = _ht, tva_amount = _tva, total_amount = _ttc WHERE id = _cn;

  _lines := jsonb_build_array(jsonb_build_object('account','401','label','Fournisseurs','debit',_ttc,'credit',0),
    jsonb_build_object('account',
      CASE WHEN p_kind = 'retour' THEN CASE WHEN _has_stock THEN '602' ELSE '605' END
           ELSE CASE WHEN _has_stock THEN '6029' ELSE '6059' END END,
      'label', CASE WHEN p_kind = 'retour' THEN 'Retour sur achats' ELSE 'Rabais, remises et ristournes obtenus' END,
      'debit', 0, 'credit', _ht));
  IF _tva > 0 THEN
    _lines := _lines || jsonb_build_array(jsonb_build_object('account','4452','label','TVA récupérable (avoir)','debit',0,'credit',_tva));
  END IF;
  PERFORM public.post_accounting_entry(_tenant, 'supplier_credit_note', COALESCE(p_credit_date, CURRENT_DATE), 'AC',
    'Avoir fournisseur ' || _num || ' sur BC ' || _po.order_number, 'supplier_credit_notes', _cn, _lines, 'achat');

  UPDATE purchase_orders SET credited_amount = COALESCE(credited_amount,0) + _ttc WHERE id = _po.id
  RETURNING * INTO _po;
  _due := COALESCE(_po.total_amount,0) - COALESCE(_po.credited_amount,0) - COALESCE(_po.total_paid,0);
  _refund := GREATEST(0, -_due);

  IF _refund > 0 AND p_refund_account_id IS NOT NULL THEN
    _acc := public.assert_treasury_account(_tenant, p_refund_account_id);
    _method := CASE _acc.account_type WHEN 'caisse' THEN 'especes' WHEN 'mobile_money' THEN 'mobile_money' ELSE 'virement' END;
    INSERT INTO purchase_payments (tenant_id, purchase_order_id, payment_type, amount, payment_method, payment_date, account_id, notes, processed_by)
    VALUES (_tenant, _po.id, 'refund', _refund, _method, COALESCE(p_credit_date, CURRENT_DATE), _acc.id, 'Remboursement avoir ' || _num, auth.uid());
    UPDATE supplier_credit_notes SET refund_amount = _refund, refund_account_id = _acc.id WHERE id = _cn;
  ELSIF _po.status::text IN ('received','partially_paid') AND _due <= 0 THEN
    UPDATE purchase_orders SET status = 'paid' WHERE id = _po.id;
  END IF;

  RETURN jsonb_build_object('credit_note_id', _cn, 'credit_note_number', _num, 'amount_ht', _ht, 'tva_amount', _tva,
    'total_amount', _ttc,
    'refund_due', CASE WHEN p_refund_account_id IS NULL THEN _refund ELSE 0 END,
    'refunded', CASE WHEN p_refund_account_id IS NULL THEN 0 ELSE _refund END);
END $function$;

-- ---------------------------------------------------------------------
-- 7. Droits d'exécution
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.create_sale_credit_note(uuid, text, text, jsonb, numeric, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale_credit_note(uuid, text, text, jsonb, numeric, date, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.create_supplier_credit_note(uuid, text, text, jsonb, numeric, date, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_supplier_credit_note(uuid, text, text, jsonb, numeric, date, text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.assert_treasury_account(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_purchase_payment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_purchase_payment() FROM PUBLIC, anon, authenticated;
