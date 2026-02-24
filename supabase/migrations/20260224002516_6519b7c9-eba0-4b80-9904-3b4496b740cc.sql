
-- =============================================
-- Cession d'immobilisations
-- Écritures automatiques SYSCOHADA:
--   Vente:    Débit 28xx (amort cumulé) + Débit 81x/Trésorerie (prix vente)
--             Crédit 2xx (valeur brute) + Crédit 82x (produit cession)
--   Si plus-value (prix > VNC): Crédit 822 Produits de cession
--   Si moins-value (prix < VNC): Débit 812 VNC des cessions
--   Mise au rebut: prix_vente = 0
-- =============================================

-- 1) Ajouter colonnes de cession sur fixed_assets
ALTER TABLE public.fixed_assets 
  ADD COLUMN IF NOT EXISTS disposal_date date,
  ADD COLUMN IF NOT EXISTS disposal_type text, -- 'vente', 'rebut', 'don'
  ADD COLUMN IF NOT EXISTS disposal_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disposal_notes text,
  ADD COLUMN IF NOT EXISTS disposed_by uuid;

-- 2) Fonction de cession d'immobilisation
CREATE OR REPLACE FUNCTION public.dispose_fixed_asset(
  p_asset_id UUID,
  p_disposal_type TEXT,       -- 'vente', 'rebut', 'don'
  p_disposal_price NUMERIC DEFAULT 0,
  p_disposal_date DATE DEFAULT CURRENT_DATE,
  p_payment_account_id UUID DEFAULT NULL,  -- Compte trésorerie pour encaissement
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_asset RECORD;
  v_vnc NUMERIC;
  v_amort_cumule NUMERIC;
  v_transaction_id UUID;
  v_result_type TEXT; -- 'plus_value' or 'moins_value'
  v_result_amount NUMERIC;
  v_account_2xx TEXT;
  v_account_28xx TEXT;
BEGIN
  -- Récupérer l'actif
  SELECT * INTO v_asset FROM fixed_assets WHERE id = p_asset_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Immobilisation non trouvée';
  END IF;
  
  IF v_asset.status = 'disposed' THEN
    RAISE EXCEPTION 'Cette immobilisation a déjà été cédée';
  END IF;

  -- Calculer VNC et amortissement cumulé
  v_amort_cumule := COALESCE(v_asset.total_depreciated, 0);
  v_vnc := v_asset.acquisition_cost - v_amort_cumule - COALESCE(v_asset.residual_value, 0);
  IF v_vnc < 0 THEN v_vnc := 0; END IF;

  -- Déterminer plus/moins value
  IF p_disposal_price > v_vnc THEN
    v_result_type := 'plus_value';
    v_result_amount := p_disposal_price - v_vnc;
  ELSE
    v_result_type := 'moins_value';
    v_result_amount := v_vnc - p_disposal_price;
  END IF;

  -- Comptes comptables
  v_account_2xx := v_asset.account_number;  -- ex: 241
  v_account_28xx := '28' || substring(v_asset.account_number from 2);  -- ex: 281

  -- 1) Créer la transaction principale
  INSERT INTO transactions (
    tenant_id, transaction_date, transaction_type, amount, 
    description, reference, notes
  ) VALUES (
    v_asset.tenant_id, p_disposal_date, 'depense',
    v_asset.acquisition_cost,
    'Cession immobilisation: ' || v_asset.asset_name || ' (' || p_disposal_type || ')',
    'CESSION-' || v_asset.account_number,
    p_notes
  ) RETURNING id INTO v_transaction_id;

  -- 2) Écritures de journal

  -- Débit 28xx: Reprise amortissements cumulés
  IF v_amort_cumule > 0 THEN
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, v_account_28xx, 'Amortissements ' || v_asset.asset_name, v_amort_cumule, 0, 
            'Reprise amortissements cumulés');
  END IF;

  -- Crédit 2xx: Sortie de l'actif (valeur brute)
  INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
  VALUES (v_transaction_id, v_account_2xx, v_asset.asset_name, 0, v_asset.acquisition_cost, 
          'Sortie immobilisation - valeur brute');

  -- Si vente avec prix > 0: Débit Trésorerie / Crédit 822
  IF p_disposal_price > 0 THEN
    -- Débit Trésorerie (encaissement)
    IF p_payment_account_id IS NOT NULL THEN
      DECLARE
        v_account_name TEXT;
        v_account_number TEXT;
      BEGIN
        SELECT account_name, account_number INTO v_account_name, v_account_number
        FROM accounts WHERE id = p_payment_account_id;
        
        INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
        VALUES (v_transaction_id, v_account_number, v_account_name, p_disposal_price, 0, 
                'Encaissement cession');
        
        -- Mettre à jour le solde du compte
        UPDATE accounts SET balance = COALESCE(balance, 0) + p_disposal_price
        WHERE id = p_payment_account_id;
      END;
    END IF;

    -- Crédit 822: Produit de cession
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '822', 'Produits de cession d''immobilisations', 0, p_disposal_price, 
            'Prix de cession');
  END IF;

  -- Moins-value: Débit 812 VNC des cessions
  IF v_result_type = 'moins_value' AND v_result_amount > 0 THEN
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '812', 'VNC des immobilisations cédées', v_result_amount, 0, 
            'Moins-value de cession');
  END IF;

  -- 3) Mettre à jour l'actif
  UPDATE fixed_assets SET
    status = 'disposed',
    disposal_date = p_disposal_date,
    disposal_type = p_disposal_type,
    disposal_price = p_disposal_price,
    disposal_notes = p_notes,
    disposed_by = auth.uid(),
    net_book_value = 0,
    updated_at = now()
  WHERE id = p_asset_id;

  RETURN jsonb_build_object(
    'success', true,
    'asset_name', v_asset.asset_name,
    'acquisition_cost', v_asset.acquisition_cost,
    'amortissement_cumule', v_amort_cumule,
    'vnc', v_vnc,
    'prix_cession', p_disposal_price,
    'result_type', v_result_type,
    'result_amount', v_result_amount,
    'transaction_id', v_transaction_id
  );
END;
$$;
