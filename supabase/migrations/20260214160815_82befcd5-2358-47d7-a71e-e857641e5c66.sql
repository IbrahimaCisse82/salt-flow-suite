
-- ==========================================================
-- 1. Ajouter colonnes à purchase_orders pour TVA et type d'achat
-- ==========================================================
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS purchase_type text NOT NULL DEFAULT 'charge'
    CHECK (purchase_type IN ('charge', 'immobilisation')),
  ADD COLUMN IF NOT EXISTS tva_rate numeric DEFAULT 18,
  ADD COLUMN IF NOT EXISTS tva_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_ht numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charge_account_number text,
  ADD COLUMN IF NOT EXISTS invoice_number text;

-- ==========================================================
-- 2. Table des immobilisations (fixed assets)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.fixed_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  purchase_order_id uuid REFERENCES public.purchase_orders(id),
  asset_name text NOT NULL,
  asset_category text NOT NULL CHECK (asset_category IN ('batiments', 'materiel_outillage', 'materiel_transport', 'materiel_bureau', 'autres')),
  account_number text NOT NULL,
  acquisition_date date NOT NULL,
  commissioning_date date,
  acquisition_cost numeric NOT NULL DEFAULT 0,
  residual_value numeric DEFAULT 0,
  useful_life_years integer NOT NULL DEFAULT 5,
  depreciation_method text NOT NULL DEFAULT 'lineaire' CHECK (depreciation_method IN ('lineaire', 'degressif')),
  total_depreciated numeric DEFAULT 0,
  net_book_value numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'fully_depreciated', 'disposed', 'inactive')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for fixed_assets"
  ON public.fixed_assets FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- ==========================================================
-- 3. Table du plan d'amortissement
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.depreciation_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  fixed_asset_id uuid NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  depreciation_amount numeric NOT NULL DEFAULT 0,
  cumulative_depreciation numeric NOT NULL DEFAULT 0,
  net_book_value numeric NOT NULL DEFAULT 0,
  is_posted boolean DEFAULT false,
  posted_at timestamptz,
  transaction_id uuid REFERENCES public.transactions(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.depreciation_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for depreciation_schedule"
  ON public.depreciation_schedule FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- ==========================================================
-- 4. Trigger: Écriture comptable à la facturation achat
-- Quand purchase_orders.status passe à 'approved' (facture validée)
-- Charge: Débit 60x + Débit 4451 / Crédit 4011
-- Immobilisation: Débit 2x + Débit 4451 / Crédit 4011
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
  v_description text;
  v_order_number text;
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
        WHEN v_charge_account LIKE '231%' THEN 'Bâtiments'
        WHEN v_charge_account LIKE '241%' THEN 'Matériel et outillage'
        WHEN v_charge_account LIKE '244%' THEN 'Matériel de transport'
        WHEN v_charge_account LIKE '245%' THEN 'Matériel de bureau'
        ELSE 'Immobilisations'
      END;
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
    END IF;
    
    v_description := 'Facture achat ' || v_order_number;
    
    -- Créer la transaction
    INSERT INTO public.transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference
    ) VALUES (
      NEW.tenant_id, 
      COALESCE(NEW.order_date, CURRENT_DATE), 
      'achat',
      v_total_ttc, 
      v_description,
      v_order_number
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
        v_tx_id, '4451', 'TVA déductible sur achats', v_tva_amount, 0, v_description
      );
    END IF;
    
    -- Ligne 3: Crédit Fournisseurs (TTC)
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, '4011', 'Fournisseurs locaux', 0, v_total_ttc, v_description
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_purchase_invoice_accounting ON public.purchase_orders;
CREATE TRIGGER trg_purchase_invoice_accounting
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_accounting_entry_on_purchase_invoice();

-- ==========================================================
-- 5. Trigger: Écriture comptable au paiement fournisseur
-- Débit 4011 / Crédit 5211 (ou 5711 caisse)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.create_accounting_entry_on_purchase_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_id uuid;
  v_order_number text;
  v_account_number text;
  v_account_name text;
  v_description text;
BEGIN
  -- Ne traiter que les paiements (pas les remboursements pour l'instant)
  IF NEW.payment_type IN ('advance', 'payment') THEN
    
    -- Récupérer le numéro de commande
    SELECT order_number INTO v_order_number
    FROM public.purchase_orders WHERE id = NEW.purchase_order_id;
    
    -- Déterminer le compte de trésorerie utilisé
    IF NEW.account_id IS NOT NULL THEN
      SELECT account_number, account_name INTO v_account_number, v_account_name
      FROM public.accounts WHERE id = NEW.account_id;
    END IF;
    
    -- Fallback si pas de compte
    v_account_number := COALESCE(v_account_number, '5211');
    v_account_name := COALESCE(v_account_name, 'Banque principale');
    
    v_description := 'Paiement fournisseur ' || COALESCE(v_order_number, '');
    
    -- Créer la transaction
    INSERT INTO public.transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference
    ) VALUES (
      NEW.tenant_id, 
      NEW.payment_date::date, 
      'achat',
      NEW.amount, 
      v_description,
      COALESCE(v_order_number, NEW.id::text)
    ) RETURNING id INTO v_tx_id;
    
    -- Débit 4011 - Fournisseurs
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, '4011', 'Fournisseurs locaux', NEW.amount, 0, v_description
    );
    
    -- Crédit compte de trésorerie
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
    -- Remboursement : écriture inverse
    SELECT order_number INTO v_order_number
    FROM public.purchase_orders WHERE id = NEW.purchase_order_id;
    
    IF NEW.account_id IS NOT NULL THEN
      SELECT account_number, account_name INTO v_account_number, v_account_name
      FROM public.accounts WHERE id = NEW.account_id;
    END IF;
    
    v_account_number := COALESCE(v_account_number, '5211');
    v_account_name := COALESCE(v_account_name, 'Banque principale');
    v_description := 'Retour fournisseur ' || COALESCE(v_order_number, '');
    
    INSERT INTO public.transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference
    ) VALUES (
      NEW.tenant_id, NEW.payment_date::date, 'recette', NEW.amount, v_description, COALESCE(v_order_number, NEW.id::text)
    ) RETURNING id INTO v_tx_id;
    
    -- Débit trésorerie
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, v_account_number, v_account_name, NEW.amount, 0, v_description
    );
    
    -- Crédit fournisseurs
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      v_tx_id, '4011', 'Fournisseurs locaux', 0, NEW.amount, v_description
    );
    
    -- Mettre à jour le solde
    IF NEW.account_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET balance = COALESCE(balance, 0) + NEW.amount
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_purchase_payment_accounting ON public.purchase_payments;
CREATE TRIGGER trg_purchase_payment_accounting
  AFTER INSERT ON public.purchase_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_accounting_entry_on_purchase_payment();

-- ==========================================================
-- 6. Mettre à jour le trigger trg_generate_journal_entries pour
-- exclure le type 'achat' (géré par les nouveaux triggers dédiés)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.generate_journal_entries()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne traiter que les types non gérés par des triggers dédiés
  -- 'achat' est maintenant géré par trg_purchase_invoice_accounting et trg_purchase_payment_accounting
  -- Les ventes sont gérées par create_accounting_entry_on_sale
  -- La production par create_accounting_entry_on_production
  
  IF NEW.transaction_type = 'salaire' THEN
    -- Débit 661 - Rémunérations du personnel
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      NEW.id, '661', 'Rémunérations du personnel', NEW.amount, 0, NEW.description
    );
    -- Crédit 521 - Banque
    INSERT INTO public.journal_entries (
      transaction_id, account_number, account_name, debit, credit, description
    ) VALUES (
      NEW.id, '521', 'Banque', 0, NEW.amount, NEW.description
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================================
-- 7. Fonction pour générer le plan d'amortissement
-- ==========================================================
CREATE OR REPLACE FUNCTION public.generate_depreciation_schedule(p_asset_id uuid)
RETURNS void AS $$
DECLARE
  v_asset record;
  v_annual_depreciation numeric;
  v_period_start date;
  v_period_end date;
  v_cumulative numeric := 0;
  v_nbv numeric;
  v_year integer;
BEGIN
  SELECT * INTO v_asset FROM public.fixed_assets WHERE id = p_asset_id;
  
  IF v_asset IS NULL THEN
    RAISE EXCEPTION 'Immobilisation non trouvée';
  END IF;
  
  -- Supprimer le plan existant non posté
  DELETE FROM public.depreciation_schedule 
  WHERE fixed_asset_id = p_asset_id AND is_posted = false;
  
  -- Calcul amortissement linéaire
  v_annual_depreciation := (v_asset.acquisition_cost - COALESCE(v_asset.residual_value, 0)) / v_asset.useful_life_years;
  v_nbv := v_asset.acquisition_cost;
  
  FOR v_year IN 1..v_asset.useful_life_years LOOP
    v_period_start := (COALESCE(v_asset.commissioning_date, v_asset.acquisition_date) + ((v_year - 1) * interval '1 year'))::date;
    v_period_end := (v_period_start + interval '1 year' - interval '1 day')::date;
    v_cumulative := v_cumulative + v_annual_depreciation;
    v_nbv := v_asset.acquisition_cost - v_cumulative;
    
    -- Dernière année: ajuster pour valeur résiduelle
    IF v_year = v_asset.useful_life_years THEN
      v_nbv := COALESCE(v_asset.residual_value, 0);
      v_cumulative := v_asset.acquisition_cost - v_nbv;
    END IF;
    
    INSERT INTO public.depreciation_schedule (
      tenant_id, fixed_asset_id, period_start, period_end,
      depreciation_amount, cumulative_depreciation, net_book_value
    ) VALUES (
      v_asset.tenant_id, p_asset_id, v_period_start, v_period_end,
      v_annual_depreciation, v_cumulative, v_nbv
    );
  END LOOP;
  
  -- Mettre à jour la valeur nette de l'immobilisation
  UPDATE public.fixed_assets 
  SET net_book_value = v_asset.acquisition_cost,
      total_depreciated = 0
  WHERE id = p_asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================================
-- 8. Fonction pour comptabiliser une dotation aux amortissements
-- Débit 681 / Crédit 28x
-- ==========================================================
CREATE OR REPLACE FUNCTION public.post_depreciation(p_schedule_id uuid)
RETURNS void AS $$
DECLARE
  v_sched record;
  v_asset record;
  v_tx_id uuid;
  v_amort_account text;
  v_description text;
BEGIN
  SELECT * INTO v_sched FROM public.depreciation_schedule WHERE id = p_schedule_id;
  IF v_sched IS NULL OR v_sched.is_posted THEN RETURN; END IF;
  
  SELECT * INTO v_asset FROM public.fixed_assets WHERE id = v_sched.fixed_asset_id;
  
  -- Déterminer le compte d'amortissement (28x = amortissement du compte 2x)
  v_amort_account := '28' || substring(v_asset.account_number from 2);
  v_description := 'Dotation amortissement ' || v_asset.asset_name || ' - ' || v_sched.period_start || '/' || v_sched.period_end;
  
  -- Créer la transaction
  INSERT INTO public.transactions (
    tenant_id, transaction_date, transaction_type, amount, description, reference
  ) VALUES (
    v_asset.tenant_id, v_sched.period_end, 'autre', v_sched.depreciation_amount, v_description, v_asset.id::text
  ) RETURNING id INTO v_tx_id;
  
  -- Débit 681 - Dotations aux amortissements
  INSERT INTO public.journal_entries (
    transaction_id, account_number, account_name, debit, credit, description
  ) VALUES (
    v_tx_id, '681', 'Dotations aux amortissements d''exploitation', v_sched.depreciation_amount, 0, v_description
  );
  
  -- Crédit 28x - Amortissement de l'immobilisation
  INSERT INTO public.journal_entries (
    transaction_id, account_number, account_name, debit, credit, description
  ) VALUES (
    v_tx_id, v_amort_account, 'Amortissement ' || v_asset.asset_name, 0, v_sched.depreciation_amount, v_description
  );
  
  -- Marquer comme posté
  UPDATE public.depreciation_schedule 
  SET is_posted = true, posted_at = now(), transaction_id = v_tx_id
  WHERE id = p_schedule_id;
  
  -- Mettre à jour l'immobilisation
  UPDATE public.fixed_assets
  SET total_depreciated = COALESCE(total_depreciated, 0) + v_sched.depreciation_amount,
      net_book_value = acquisition_cost - (COALESCE(total_depreciated, 0) + v_sched.depreciation_amount),
      status = CASE 
        WHEN acquisition_cost - (COALESCE(total_depreciated, 0) + v_sched.depreciation_amount) <= COALESCE(residual_value, 0) 
        THEN 'fully_depreciated' 
        ELSE 'active' 
      END
  WHERE id = v_sched.fixed_asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
