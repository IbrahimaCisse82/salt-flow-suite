
-- ==========================================================
-- 1. Ajouter colonnes pour mode comptant et immobilisation
-- ==========================================================
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'credit'
    CHECK (payment_mode IN ('credit', 'comptant')),
  ADD COLUMN IF NOT EXISTS commissioning_date date,
  ADD COLUMN IF NOT EXISTS useful_life_years integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS depreciation_method text DEFAULT 'lineaire';

-- ==========================================================
-- 2. Contrainte DB: empêcher classe 6 pour immobilisation et classe 2 pour charge
-- ==========================================================
ALTER TABLE public.purchase_orders
  ADD CONSTRAINT chk_account_class_charge 
    CHECK (
      purchase_type != 'charge' OR charge_account_number IS NULL 
      OR charge_account_number LIKE '6%' OR charge_account_number LIKE '61%' OR charge_account_number LIKE '62%'
    ),
  ADD CONSTRAINT chk_account_class_immo 
    CHECK (
      purchase_type != 'immobilisation' OR charge_account_number IS NULL 
      OR charge_account_number LIKE '2%'
    );

-- ==========================================================
-- 3. Mettre à jour le trigger facture pour gérer le mode COMPTANT
-- et la distinction TVA charges (44566) vs immo (44562)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.create_accounting_entry_on_purchase_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_id uuid;
  v_amount_ht numeric;
  v_tva_amount numeric;
  v_total_ttc numeric;
  v_charge_account text;
  v_charge_account_name text;
  v_tva_account text;
  v_tva_account_name text;
  v_credit_account text;
  v_credit_account_name text;
  v_description text;
  v_order_number text;
  v_asset_id uuid;
BEGIN
  -- Ne déclencher que quand le statut passe à 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    
    v_amount_ht := COALESCE(NEW.amount_ht, NEW.subtotal, 0);
    v_tva_amount := COALESCE(NEW.tva_amount, NEW.tax_amount, 0);
    v_total_ttc := COALESCE(NEW.total_amount, v_amount_ht + v_tva_amount);
    v_order_number := NEW.order_number;
    
    -- Déterminer le compte de charge/immobilisation
    IF NEW.purchase_type = 'immobilisation' THEN
      v_charge_account := COALESCE(NEW.charge_account_number, '241');
      v_charge_account_name := CASE 
        WHEN v_charge_account = '231' THEN 'Immobilisations en cours'
        WHEN v_charge_account LIKE '241%' THEN 'Matériel et outillage'
        WHEN v_charge_account LIKE '244%' THEN 'Matériel de transport'
        WHEN v_charge_account LIKE '245%' THEN 'Matériel de bureau'
        ELSE 'Immobilisations'
      END;
      -- TVA sur immobilisations
      v_tva_account := '44562';
      v_tva_account_name := 'TVA déductible sur immobilisations';
    ELSE
      v_charge_account := COALESCE(NEW.charge_account_number, '6011');
      v_charge_account_name := CASE 
        WHEN v_charge_account LIKE '601%' THEN 'Achats de marchandises'
        WHEN v_charge_account LIKE '602%' THEN 'Achats de matières premières'
        WHEN v_charge_account LIKE '604%' THEN 'Achats de services'
        WHEN v_charge_account LIKE '605%' THEN 'Autres achats'
        WHEN v_charge_account LIKE '61%' THEN 'Transports'
        WHEN v_charge_account LIKE '62%' THEN 'Services extérieurs'
        ELSE 'Achats divers'
      END;
      -- TVA sur achats de biens et services
      v_tva_account := '44566';
      v_tva_account_name := 'TVA déductible sur ABS';
    END IF;
    
    -- Déterminer le compte créditeur selon mode de paiement
    IF COALESCE(NEW.payment_mode, 'credit') = 'comptant' THEN
      v_credit_account := '5211';
      v_credit_account_name := 'Banque principale';
    ELSE
      v_credit_account := '4011';
      v_credit_account_name := 'Fournisseurs locaux';
    END IF;
    
    v_description := 'Facture achat ' || v_order_number || COALESCE(' - ' || NEW.invoice_number, '');
    
    -- Créer la transaction
    INSERT INTO public.transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference
    ) VALUES (
      NEW.tenant_id, 
      COALESCE(NEW.order_date, CURRENT_DATE), 
      'achat',
      v_total_ttc, 
      v_description,
      COALESCE(NEW.invoice_number, v_order_number)
    ) RETURNING id INTO v_tx_id;
    
    -- Ligne 1: Débit compte de charge/immobilisation (HT)
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, v_charge_account, v_charge_account_name, v_amount_ht, 0, v_description
    );
    
    -- Ligne 2: Débit TVA déductible (si TVA > 0)
    IF v_tva_amount > 0 THEN
      INSERT INTO public.journal_entries (
        transaction_id, account_number, account_name, debit, credit, description
      ) VALUES (
        v_tx_id, v_tva_account, v_tva_account_name, v_tva_amount, 0, v_description
      );
    END IF;
    
    -- Ligne 3: Crédit Fournisseurs ou Banque (TTC)
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, v_credit_account, v_credit_account_name, 0, v_total_ttc, v_description
    );
    
    -- Si comptant, mettre à jour le solde bancaire et marquer comme payé
    IF COALESCE(NEW.payment_mode, 'credit') = 'comptant' THEN
      UPDATE public.accounts 
      SET balance = COALESCE(balance, 0) - v_total_ttc
      WHERE account_number = '5211' 
        AND tenant_id = NEW.tenant_id;
      
      -- Marquer la commande comme payée (sera appliqué après ce trigger)
      NEW.total_paid := v_total_ttc;
    END IF;
    
    -- Si immobilisation, créer automatiquement la fiche d'immobilisation
    IF NEW.purchase_type = 'immobilisation' THEN
      INSERT INTO public.fixed_assets (
        tenant_id, purchase_order_id, asset_name,
        asset_category, account_number, acquisition_date,
        commissioning_date, acquisition_cost, 
        useful_life_years, depreciation_method,
        net_book_value
      ) VALUES (
        NEW.tenant_id, NEW.id,
        'Immobilisation ' || v_order_number,
        CASE 
          WHEN v_charge_account = '231' THEN 'batiments'
          WHEN v_charge_account LIKE '241%' THEN 'materiel_outillage'
          WHEN v_charge_account LIKE '244%' THEN 'materiel_transport'
          WHEN v_charge_account LIKE '245%' THEN 'materiel_bureau'
          ELSE 'autres'
        END,
        v_charge_account,
        COALESCE(NEW.order_date, CURRENT_DATE),
        NEW.commissioning_date,
        v_amount_ht,
        COALESCE(NEW.useful_life_years, 5),
        COALESCE(NEW.depreciation_method, 'lineaire'),
        v_amount_ht
      ) RETURNING id INTO v_asset_id;
      
      -- Générer automatiquement le plan d'amortissement
      PERFORM generate_depreciation_schedule(v_asset_id);
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================================
-- 4. Mettre à jour le trigger paiement pour gérer les avances (4091)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.create_accounting_entry_on_purchase_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_id uuid;
  v_order_number text;
  v_payment_mode text;
  v_account_number text;
  v_account_name text;
  v_supplier_account text;
  v_supplier_account_name text;
  v_description text;
BEGIN
  -- Récupérer info commande
  SELECT order_number, COALESCE(payment_mode, 'credit') 
  INTO v_order_number, v_payment_mode
  FROM public.purchase_orders WHERE id = NEW.purchase_order_id;
  
  -- Ne pas générer d'écriture si paiement comptant (déjà fait à l'approbation)
  IF v_payment_mode = 'comptant' THEN
    RETURN NEW;
  END IF;
  
  -- Déterminer le compte de trésorerie
  IF NEW.account_id IS NOT NULL THEN
    SELECT account_number, account_name INTO v_account_number, v_account_name
    FROM public.accounts WHERE id = NEW.account_id;
  END IF;
  v_account_number := COALESCE(v_account_number, '5211');
  v_account_name := COALESCE(v_account_name, 'Banque principale');
  
  -- Déterminer le compte fournisseur selon le type de paiement
  IF NEW.payment_type = 'advance' THEN
    v_supplier_account := '4091';
    v_supplier_account_name := 'Avances et acomptes versés sur commandes';
  ELSE
    v_supplier_account := '4011';
    v_supplier_account_name := 'Fournisseurs locaux';
  END IF;
  
  IF NEW.payment_type IN ('advance', 'payment') THEN
    v_description := CASE NEW.payment_type
      WHEN 'advance' THEN 'Avance fournisseur '
      ELSE 'Paiement fournisseur '
    END || COALESCE(v_order_number, '');
    
    INSERT INTO public.transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference
    ) VALUES (
      NEW.tenant_id, NEW.payment_date::date, 'achat', NEW.amount, v_description, 
      COALESCE(v_order_number, NEW.id::text)
    ) RETURNING id INTO v_tx_id;
    
    -- Débit Fournisseurs/Avances
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, v_supplier_account, v_supplier_account_name, NEW.amount, 0, v_description
    );
    
    -- Crédit Trésorerie
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, v_account_number, v_account_name, 0, NEW.amount, v_description
    );
    
    -- Mettre à jour le solde du compte de trésorerie
    IF NEW.account_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET balance = COALESCE(balance, 0) - NEW.amount
      WHERE id = NEW.account_id;
    END IF;
    
  ELSIF NEW.payment_type = 'refund' THEN
    v_description := 'Retour fournisseur ' || COALESCE(v_order_number, '');
    
    INSERT INTO public.transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference
    ) VALUES (
      NEW.tenant_id, NEW.payment_date::date, 'recette', NEW.amount, v_description, 
      COALESCE(v_order_number, NEW.id::text)
    ) RETURNING id INTO v_tx_id;
    
    -- Débit Trésorerie
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, v_account_number, v_account_name, NEW.amount, 0, v_description
    );
    
    -- Crédit Fournisseurs
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, '4011', 'Fournisseurs locaux', 0, NEW.amount, v_description
    );
    
    IF NEW.account_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET balance = COALESCE(balance, 0) + NEW.amount
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================================
-- 5. Corriger le label du compte 231 dans les immobilisations
-- ==========================================================
-- (Corrigé dans le trigger ci-dessus: 231 = "Immobilisations en cours")
