-- ============================================================
-- ÉCRITURES COMPTABLES AUTOMATIQUES COMPLÈTES
-- Intégration Production, Achats, Salaires, Ventes
-- Valorisation au coût de revient SYSCOHADA
-- ============================================================

-- 1. Fonction pour créer une écriture comptable avec journal entries
CREATE OR REPLACE FUNCTION create_journal_entry(
  p_tenant_id UUID,
  p_transaction_date DATE,
  p_transaction_type TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_debit_account TEXT DEFAULT NULL,
  p_credit_account TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_debit_account_id UUID;
  v_credit_account_id UUID;
  v_debit_account_name TEXT;
  v_credit_account_name TEXT;
BEGIN
  -- Créer la transaction principale
  INSERT INTO transactions (
    tenant_id,
    transaction_date,
    transaction_type,
    amount,
    description,
    reference,
    notes
  ) VALUES (
    p_tenant_id,
    p_transaction_date,
    p_transaction_type,
    p_amount,
    p_description,
    p_reference,
    p_notes
  ) RETURNING id INTO v_transaction_id;

  -- Rechercher les comptes si fournis
  IF p_debit_account IS NOT NULL THEN
    SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
    FROM chart_of_accounts
    WHERE tenant_id = p_tenant_id
      AND account_number LIKE p_debit_account || '%'
      AND is_active = true
    LIMIT 1;
  END IF;

  IF p_credit_account IS NOT NULL THEN
    SELECT id, account_name INTO v_credit_account_id, v_credit_account_name
    FROM chart_of_accounts
    WHERE tenant_id = p_tenant_id
      AND account_number LIKE p_credit_account || '%'
      AND is_active = true
    LIMIT 1;
  END IF;

  -- Créer les lignes du journal (écriture équilibrée)
  IF v_debit_account_id IS NOT NULL THEN
    INSERT INTO journal_entries (
      transaction_id,
      account_id,
      account_number,
      account_name,
      debit,
      credit,
      description
    ) VALUES (
      v_transaction_id,
      v_debit_account_id,
      p_debit_account,
      v_debit_account_name,
      p_amount,
      0,
      p_description
    );
  END IF;

  IF v_credit_account_id IS NOT NULL THEN
    INSERT INTO journal_entries (
      transaction_id,
      account_id,
      account_number,
      account_name,
      debit,
      credit,
      description
    ) VALUES (
      v_transaction_id,
      v_credit_account_id,
      p_credit_account,
      v_credit_account_name,
      0,
      p_amount,
      p_description
    );
  END IF;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger pour les achats → Comptabilité (quand payé)
CREATE OR REPLACE FUNCTION create_accounting_entry_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_id UUID;
  v_supplier_name TEXT;
BEGIN
  -- Créer une écriture comptable quand le statut passe à 'paid'
  IF (TG_OP = 'UPDATE' AND OLD.status != 'paid' AND NEW.status = 'paid') THEN
    
    -- Récupérer le nom du fournisseur
    SELECT name INTO v_supplier_name
    FROM suppliers
    WHERE id = NEW.supplier_id;

    -- Créer l'écriture comptable
    -- Débit: 601 (Achats de matières premières) ou 602 (Autres approvisionnements)
    -- Crédit: 521 (Banque) ou 571 (Caisse)
    SELECT create_journal_entry(
      NEW.tenant_id,
      COALESCE(NEW.actual_delivery_date, NEW.order_date)::DATE,
      'achat',
      NEW.total_amount,
      'Achat - ' || COALESCE(v_supplier_name, 'Fournisseur') || ' - ' || NEW.order_number,
      NEW.order_number,
      NEW.notes,
      '601',  -- Achats matières premières (débit)
      '521'   -- Banque (crédit)
    ) INTO v_transaction_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger si non existant
DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_purchase ON purchase_orders;
CREATE TRIGGER trigger_create_accounting_entry_on_purchase
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_accounting_entry_on_purchase();

-- 3. Trigger pour la production → Comptabilité (valorisation au coût de revient)
CREATE OR REPLACE FUNCTION create_accounting_entry_on_production()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_id UUID;
  v_cost_per_ton NUMERIC;
  v_production_value NUMERIC;
  v_bassin_name TEXT;
BEGIN
  -- Créer une écriture comptable pour la production stockée
  IF (TG_OP = 'INSERT' AND NEW.deleted_at IS NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    
    -- Récupérer le dernier coût par tonne calculé
    SELECT cout_par_tonne INTO v_cost_per_ton
    FROM cost_per_ton
    WHERE tenant_id = NEW.tenant_id
      AND status IN ('validated', 'calculated')
    ORDER BY calculation_date DESC
    LIMIT 1;

    -- Si pas de coût calculé, utiliser une valeur par défaut (0 = comptabilité non impactée)
    IF v_cost_per_ton IS NULL THEN
      v_cost_per_ton := 0;
    END IF;

    -- Calculer la valeur de la production (quantité en kg / 1000 * coût par tonne)
    v_production_value := (COALESCE(NEW.quantity, 0) / 1000) * v_cost_per_ton;

    -- Ne créer l'écriture que si la valeur est significative
    IF v_production_value > 0 THEN
      -- Récupérer le nom du bassin
      SELECT name INTO v_bassin_name
      FROM bassins
      WHERE id = NEW.bassin_id;

      -- Créer l'écriture comptable de production stockée
      -- Débit: 35 (Stocks de produits finis)
      -- Crédit: 72 (Production stockée)
      SELECT create_journal_entry(
        NEW.tenant_id,
        COALESCE(NEW.production_date, CURRENT_DATE),
        'production',
        v_production_value,
        'Production stockée - ' || COALESCE(NEW.salt_type, 'Sel') || 
        ' - ' || COALESCE(NEW.quantity::TEXT, '0') || ' kg' ||
        CASE WHEN v_bassin_name IS NOT NULL THEN ' - ' || v_bassin_name ELSE '' END,
        COALESCE(NEW.batch_number, NEW.traceability_code, 'PROD-' || NEW.id::TEXT),
        'Valorisation au coût de revient: ' || v_cost_per_ton || ' FCFA/tonne',
        '35',   -- Stocks produits finis (débit)
        '72'    -- Production stockée (crédit)
      ) INTO v_transaction_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger si non existant
DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_production ON production_records;
CREATE TRIGGER trigger_create_accounting_entry_on_production
  AFTER INSERT OR UPDATE ON production_records
  FOR EACH ROW
  EXECUTE FUNCTION create_accounting_entry_on_production();

-- 4. Améliorer le trigger des ventes pour générer les journal entries
CREATE OR REPLACE FUNCTION create_accounting_entry_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_id UUID;
  v_client_name TEXT;
  v_cost_per_ton NUMERIC;
  v_cost_of_goods NUMERIC;
BEGIN
  -- Créer une écriture comptable pour les ventes facturées
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.sale_status != NEW.sale_status))
     AND NEW.sale_status IN ('invoiced', 'completed')
     AND NEW.transaction_id IS NULL THEN
    
    -- Récupérer le nom du client
    SELECT name INTO v_client_name
    FROM clients
    WHERE id = NEW.client_id;

    -- Créer l'écriture de vente principale
    -- Débit: 411 (Clients)
    -- Crédit: 701 (Ventes de produits finis)
    SELECT create_journal_entry(
      NEW.tenant_id,
      COALESCE(NEW.sale_date, CURRENT_DATE),
      'recette',
      NEW.total_amount,
      'Vente - ' || COALESCE(v_client_name, NEW.customer_name, 'Client') || 
      ' - ' || COALESCE(NEW.invoice_number, 'N° ' || NEW.id::TEXT),
      COALESCE(NEW.invoice_number, NEW.order_number, 'VENTE-' || NEW.id::TEXT),
      NEW.notes,
      '411',  -- Clients (débit)
      '701'   -- Ventes produits finis (crédit)
    ) INTO v_transaction_id;

    -- Lier la vente à la transaction
    NEW.transaction_id := v_transaction_id;

    -- Si la vente est complète (livrée et payée), calculer le coût des marchandises vendues
    IF NEW.sale_status = 'completed' THEN
      -- Récupérer le coût par tonne
      SELECT cout_par_tonne INTO v_cost_per_ton
      FROM cost_per_ton
      WHERE tenant_id = NEW.tenant_id
        AND status IN ('validated', 'calculated')
      ORDER BY calculation_date DESC
      LIMIT 1;

      IF v_cost_per_ton IS NOT NULL AND v_cost_per_ton > 0 THEN
        -- Calculer le coût des marchandises vendues
        v_cost_of_goods := (COALESCE(NEW.quantity, 0) / 1000) * v_cost_per_ton;

        IF v_cost_of_goods > 0 THEN
          -- Créer l'écriture de sortie de stock (coût des marchandises vendues)
          -- Débit: 603 (Variation des stocks)
          -- Crédit: 35 (Stocks de produits finis)
          PERFORM create_journal_entry(
            NEW.tenant_id,
            COALESCE(NEW.sale_date, CURRENT_DATE),
            'cout_vente',
            v_cost_of_goods,
            'Coût des ventes - ' || COALESCE(v_client_name, 'Client') || 
            ' - ' || COALESCE(NEW.quantity::TEXT, '0') || ' kg',
            COALESCE(NEW.invoice_number, 'CMV-' || NEW.id::TEXT),
            'Sortie stock au coût de revient: ' || v_cost_per_ton || ' FCFA/tonne',
            '603',  -- Variation stocks (débit)
            '35'    -- Stocks produits finis (crédit)
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger des ventes
DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_sale ON sales;
CREATE TRIGGER trigger_create_accounting_entry_on_sale
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION create_accounting_entry_on_sale();

-- 5. Trigger pour les paiements de salaires (backup en cas d'échec du frontend)
CREATE OR REPLACE FUNCTION create_accounting_entry_on_payroll()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_name TEXT;
  v_existing_tx_count INTEGER;
BEGIN
  -- Vérifier si une transaction existe déjà (créée par le frontend)
  SELECT COUNT(*) INTO v_existing_tx_count
  FROM transactions
  WHERE tenant_id = NEW.tenant_id
    AND transaction_type = 'salaire'
    AND reference LIKE 'PAY-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '%'
    AND transaction_date = NEW.payment_date;

  -- Ne créer que si pas déjà fait par le frontend
  IF v_existing_tx_count = 0 THEN
    -- Récupérer le nom de l'employé
    SELECT full_name INTO v_employee_name
    FROM employees
    WHERE id = NEW.paid_to;

    -- Créer l'écriture comptable
    -- Débit: 661 (Rémunérations du personnel)
    -- Crédit: 521 (Banque) ou 571 (Caisse)
    PERFORM create_journal_entry(
      NEW.tenant_id,
      NEW.payment_date,
      'salaire',
      NEW.paid_amount,
      'Paiement salaire - ' || COALESCE(v_employee_name, 'Employé'),
      'PAY-' || SUBSTRING(NEW.id::TEXT, 1, 8),
      NEW.notes,
      '661',  -- Rémunérations personnel (débit)
      '521'   -- Banque (crédit)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger si non existant
DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_payroll ON payroll_payments;
CREATE TRIGGER trigger_create_accounting_entry_on_payroll
  AFTER INSERT ON payroll_payments
  FOR EACH ROW
  EXECUTE FUNCTION create_accounting_entry_on_payroll();

-- 6. Vue pour le grand livre avec soldes
CREATE OR REPLACE VIEW accounting_ledger AS
SELECT 
  je.id,
  je.transaction_id,
  t.transaction_date,
  t.transaction_type,
  je.account_number,
  je.account_name,
  je.debit,
  je.credit,
  je.description,
  t.reference,
  t.tenant_id,
  SUM(je.debit - je.credit) OVER (
    PARTITION BY je.account_number, t.tenant_id 
    ORDER BY t.transaction_date, je.id
  ) as running_balance
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
ORDER BY t.transaction_date DESC, je.id;

-- 7. Fonction pour calculer le solde d'un compte
CREATE OR REPLACE FUNCTION get_account_balance(
  p_tenant_id UUID,
  p_account_number TEXT,
  p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(je.debit - je.credit), 0) INTO v_balance
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = p_tenant_id
    AND je.account_number LIKE p_account_number || '%'
    AND t.transaction_date <= p_as_of_date;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour générer la balance des comptes
CREATE OR REPLACE FUNCTION generate_trial_balance(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  account_number TEXT,
  account_name TEXT,
  account_type TEXT,
  opening_balance NUMERIC,
  period_debit NUMERIC,
  period_credit NUMERIC,
  closing_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    coa.account_number,
    coa.account_name,
    coa.account_type,
    COALESCE(get_account_balance(p_tenant_id, coa.account_number, p_start_date - 1), 0) as opening_balance,
    COALESCE(SUM(je.debit), 0) as period_debit,
    COALESCE(SUM(je.credit), 0) as period_credit,
    COALESCE(get_account_balance(p_tenant_id, coa.account_number, p_end_date), 0) as closing_balance
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_number = coa.account_number
  LEFT JOIN transactions t ON je.transaction_id = t.id
    AND t.tenant_id = p_tenant_id
    AND t.transaction_date BETWEEN p_start_date AND p_end_date
  WHERE coa.tenant_id = p_tenant_id
    AND coa.is_active = true
  GROUP BY coa.account_number, coa.account_name, coa.account_type
  HAVING COALESCE(get_account_balance(p_tenant_id, coa.account_number, p_end_date), 0) != 0
      OR COALESCE(SUM(je.debit), 0) != 0
      OR COALESCE(SUM(je.credit), 0) != 0
  ORDER BY coa.account_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;