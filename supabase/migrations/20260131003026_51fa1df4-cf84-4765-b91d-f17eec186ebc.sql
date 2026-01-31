-- ============================================================
-- CORRECTIONS DE SÉCURITÉ - Search Path et View
-- ============================================================

-- Supprimer la vue avec SECURITY DEFINER et la recréer sans
DROP VIEW IF EXISTS accounting_ledger;
CREATE VIEW accounting_ledger AS
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

-- Recréer les fonctions avec search_path fixe

-- 1. Fonction create_journal_entry
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
) RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_debit_account_id UUID;
  v_credit_account_id UUID;
  v_debit_account_name TEXT;
  v_credit_account_name TEXT;
BEGIN
  INSERT INTO transactions (
    tenant_id, transaction_date, transaction_type, amount, description, reference, notes
  ) VALUES (
    p_tenant_id, p_transaction_date, p_transaction_type, p_amount, p_description, p_reference, p_notes
  ) RETURNING id INTO v_transaction_id;

  IF p_debit_account IS NOT NULL THEN
    SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
    FROM chart_of_accounts
    WHERE tenant_id = p_tenant_id AND account_number LIKE p_debit_account || '%' AND is_active = true
    LIMIT 1;
  END IF;

  IF p_credit_account IS NOT NULL THEN
    SELECT id, account_name INTO v_credit_account_id, v_credit_account_name
    FROM chart_of_accounts
    WHERE tenant_id = p_tenant_id AND account_number LIKE p_credit_account || '%' AND is_active = true
    LIMIT 1;
  END IF;

  IF v_debit_account_id IS NOT NULL THEN
    INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, v_debit_account_id, p_debit_account, v_debit_account_name, p_amount, 0, p_description);
  END IF;

  IF v_credit_account_id IS NOT NULL THEN
    INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, v_credit_account_id, p_credit_account, v_credit_account_name, 0, p_amount, p_description);
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- 2. Fonction create_accounting_entry_on_purchase
CREATE OR REPLACE FUNCTION create_accounting_entry_on_purchase()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_supplier_name TEXT;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != 'paid' AND NEW.status = 'paid') THEN
    SELECT name INTO v_supplier_name FROM suppliers WHERE id = NEW.supplier_id;
    SELECT create_journal_entry(
      NEW.tenant_id, COALESCE(NEW.actual_delivery_date, NEW.order_date)::DATE, 'achat', NEW.total_amount,
      'Achat - ' || COALESCE(v_supplier_name, 'Fournisseur') || ' - ' || NEW.order_number,
      NEW.order_number, NEW.notes, '601', '521'
    ) INTO v_transaction_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Fonction create_accounting_entry_on_production
CREATE OR REPLACE FUNCTION create_accounting_entry_on_production()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_cost_per_ton NUMERIC;
  v_production_value NUMERIC;
  v_bassin_name TEXT;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.deleted_at IS NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    
    SELECT cout_par_tonne INTO v_cost_per_ton
    FROM cost_per_ton WHERE tenant_id = NEW.tenant_id AND status IN ('validated', 'calculated')
    ORDER BY calculation_date DESC LIMIT 1;

    IF v_cost_per_ton IS NULL THEN v_cost_per_ton := 0; END IF;
    v_production_value := (COALESCE(NEW.quantity, 0) / 1000) * v_cost_per_ton;

    IF v_production_value > 0 THEN
      SELECT name INTO v_bassin_name FROM bassins WHERE id = NEW.bassin_id;
      SELECT create_journal_entry(
        NEW.tenant_id, COALESCE(NEW.production_date, CURRENT_DATE), 'production', v_production_value,
        'Production stockée - ' || COALESCE(NEW.salt_type, 'Sel') || ' - ' || COALESCE(NEW.quantity::TEXT, '0') || ' kg' ||
        CASE WHEN v_bassin_name IS NOT NULL THEN ' - ' || v_bassin_name ELSE '' END,
        COALESCE(NEW.batch_number, NEW.traceability_code, 'PROD-' || NEW.id::TEXT),
        'Valorisation au coût de revient: ' || v_cost_per_ton || ' FCFA/tonne', '35', '72'
      ) INTO v_transaction_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Fonction create_accounting_entry_on_sale
CREATE OR REPLACE FUNCTION create_accounting_entry_on_sale()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_client_name TEXT;
  v_cost_per_ton NUMERIC;
  v_cost_of_goods NUMERIC;
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.sale_status != NEW.sale_status))
     AND NEW.sale_status IN ('invoiced', 'completed')
     AND NEW.transaction_id IS NULL THEN
    
    SELECT name INTO v_client_name FROM clients WHERE id = NEW.client_id;

    SELECT create_journal_entry(
      NEW.tenant_id, COALESCE(NEW.sale_date, CURRENT_DATE), 'recette', NEW.total_amount,
      'Vente - ' || COALESCE(v_client_name, NEW.customer_name, 'Client') || ' - ' || COALESCE(NEW.invoice_number, 'N° ' || NEW.id::TEXT),
      COALESCE(NEW.invoice_number, NEW.order_number, 'VENTE-' || NEW.id::TEXT), NEW.notes, '411', '701'
    ) INTO v_transaction_id;

    NEW.transaction_id := v_transaction_id;

    IF NEW.sale_status = 'completed' THEN
      SELECT cout_par_tonne INTO v_cost_per_ton
      FROM cost_per_ton WHERE tenant_id = NEW.tenant_id AND status IN ('validated', 'calculated')
      ORDER BY calculation_date DESC LIMIT 1;

      IF v_cost_per_ton IS NOT NULL AND v_cost_per_ton > 0 THEN
        v_cost_of_goods := (COALESCE(NEW.quantity, 0) / 1000) * v_cost_per_ton;
        IF v_cost_of_goods > 0 THEN
          PERFORM create_journal_entry(
            NEW.tenant_id, COALESCE(NEW.sale_date, CURRENT_DATE), 'cout_vente', v_cost_of_goods,
            'Coût des ventes - ' || COALESCE(v_client_name, 'Client') || ' - ' || COALESCE(NEW.quantity::TEXT, '0') || ' kg',
            COALESCE(NEW.invoice_number, 'CMV-' || NEW.id::TEXT),
            'Sortie stock au coût de revient: ' || v_cost_per_ton || ' FCFA/tonne', '603', '35'
          );
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Fonction create_accounting_entry_on_payroll
CREATE OR REPLACE FUNCTION create_accounting_entry_on_payroll()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_name TEXT;
  v_existing_tx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_existing_tx_count
  FROM transactions
  WHERE tenant_id = NEW.tenant_id AND transaction_type = 'salaire'
    AND reference LIKE 'PAY-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '%'
    AND transaction_date = NEW.payment_date;

  IF v_existing_tx_count = 0 THEN
    SELECT full_name INTO v_employee_name FROM employees WHERE id = NEW.paid_to;
    PERFORM create_journal_entry(
      NEW.tenant_id, NEW.payment_date, 'salaire', NEW.paid_amount,
      'Paiement salaire - ' || COALESCE(v_employee_name, 'Employé'),
      'PAY-' || SUBSTRING(NEW.id::TEXT, 1, 8), NEW.notes, '661', '521'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Fonction get_account_balance
CREATE OR REPLACE FUNCTION get_account_balance(
  p_tenant_id UUID,
  p_account_number TEXT,
  p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 7. Fonction generate_trial_balance
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE coa.tenant_id = p_tenant_id AND coa.is_active = true
  GROUP BY coa.account_number, coa.account_name, coa.account_type
  HAVING COALESCE(get_account_balance(p_tenant_id, coa.account_number, p_end_date), 0) != 0
      OR COALESCE(SUM(je.debit), 0) != 0
      OR COALESCE(SUM(je.credit), 0) != 0
  ORDER BY coa.account_number;
END;
$$;