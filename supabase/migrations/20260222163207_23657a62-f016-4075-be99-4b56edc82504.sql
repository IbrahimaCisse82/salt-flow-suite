
-- Trigger pour créer les écritures comptables lors d'un paiement achat
-- ET mettre à jour total_paid + status de la commande
CREATE OR REPLACE FUNCTION public.handle_purchase_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_number TEXT;
  v_account_name TEXT;
  v_supplier_name TEXT;
  v_order_number TEXT;
  v_transaction_id UUID;
  v_total_amount NUMERIC;
  v_new_total_paid NUMERIC;
  v_description TEXT;
  v_debit_account TEXT;
  v_debit_name TEXT;
  v_credit_account TEXT;
  v_credit_name TEXT;
BEGIN
  -- Récupérer les infos du compte de trésorerie
  IF NEW.account_id IS NOT NULL THEN
    SELECT account_number, account_name INTO v_account_number, v_account_name
    FROM accounts WHERE id = NEW.account_id;
  ELSE
    v_account_number := '5211';
    v_account_name := 'Banque principale';
  END IF;

  -- Récupérer les infos de la commande et du fournisseur
  SELECT po.order_number, po.total_amount, s.name
  INTO v_order_number, v_total_amount, v_supplier_name
  FROM purchase_orders po
  LEFT JOIN suppliers s ON s.id = po.supplier_id
  WHERE po.id = NEW.purchase_order_id;

  v_description := 'Paiement fournisseur - ' || COALESCE(v_supplier_name, '') || ' - ' || COALESCE(v_order_number, '');

  -- Déterminer les comptes selon le type de paiement
  IF NEW.payment_type = 'refund' THEN
    -- Retour: Débit Trésorerie, Crédit Fournisseurs
    v_debit_account := v_account_number;
    v_debit_name := v_account_name;
    v_credit_account := '4011';
    v_credit_name := 'Fournisseurs';
  ELSIF NEW.payment_type = 'advance' THEN
    -- Avance: Débit Avances fournisseurs, Crédit Trésorerie
    v_debit_account := '4091';
    v_debit_name := 'Avances aux fournisseurs';
    v_credit_account := v_account_number;
    v_credit_name := v_account_name;
  ELSE
    -- Paiement normal: Débit Fournisseurs, Crédit Trésorerie
    v_debit_account := '4011';
    v_debit_name := 'Fournisseurs';
    v_credit_account := v_account_number;
    v_credit_name := v_account_name;
  END IF;

  -- Créer la transaction
  INSERT INTO transactions (
    tenant_id, transaction_date, transaction_type, amount,
    description, reference, notes
  ) VALUES (
    NEW.tenant_id, NEW.payment_date, 'achat', NEW.amount,
    v_description, 'PPAY-' || NEW.id, 'Paiement achat ' || v_order_number
  ) RETURNING id INTO v_transaction_id;

  -- Créer les écritures de journal (Débit)
  INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
  VALUES (v_transaction_id, v_debit_account, v_debit_name, NEW.amount, 0, v_description);

  -- Créer les écritures de journal (Crédit)
  INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
  VALUES (v_transaction_id, v_credit_account, v_credit_name, 0, NEW.amount, v_description);

  -- Mettre à jour transaction_id sur le paiement
  NEW.transaction_id := v_transaction_id;

  -- Mettre à jour le solde du compte de trésorerie
  IF NEW.account_id IS NOT NULL THEN
    IF NEW.payment_type = 'refund' THEN
      UPDATE accounts SET balance = COALESCE(balance, 0) + NEW.amount WHERE id = NEW.account_id;
    ELSE
      UPDATE accounts SET balance = COALESCE(balance, 0) - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;

  -- Mettre à jour total_paid et status de la commande
  IF NEW.payment_type = 'refund' THEN
    v_new_total_paid := COALESCE((SELECT total_paid FROM purchase_orders WHERE id = NEW.purchase_order_id), 0) - NEW.amount;
  ELSE
    v_new_total_paid := COALESCE((SELECT total_paid FROM purchase_orders WHERE id = NEW.purchase_order_id), 0) + NEW.amount;
  END IF;

  UPDATE purchase_orders
  SET total_paid = v_new_total_paid,
      status = CASE
        WHEN v_new_total_paid >= COALESCE(total_amount, 0) THEN 'paid'
        WHEN v_new_total_paid > 0 THEN 'partially_paid'
        ELSE status
      END
  WHERE id = NEW.purchase_order_id;

  RETURN NEW;
END;
$$;

-- Créer le trigger BEFORE INSERT pour pouvoir modifier NEW.transaction_id
CREATE TRIGGER trg_handle_purchase_payment
  BEFORE INSERT ON purchase_payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_payment();
