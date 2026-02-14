
-- 1. Add TVA columns to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tva_rate NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tva_amount NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_ht NUMERIC DEFAULT 0;

-- 2. Backfill existing sales: amount_ht = total_amount (no TVA was applied before)
UPDATE public.sales SET amount_ht = COALESCE(total_amount, 0), tva_rate = 0, tva_amount = 0 WHERE amount_ht = 0 OR amount_ht IS NULL;

-- 3. Replace the accounting trigger function for sales
CREATE OR REPLACE FUNCTION public.create_accounting_entry_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_transaction_id UUID;
  v_client_name TEXT;
  v_client_type TEXT;
  v_cost_per_ton NUMERIC;
  v_cost_of_goods NUMERIC;
  v_debit_client_account TEXT;
  v_credit_revenue_account TEXT;
  v_description TEXT;
  v_reference TEXT;
BEGIN
  -- Only fire on status change to invoiced/completed
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.sale_status IS DISTINCT FROM NEW.sale_status))
     AND NEW.sale_status IN ('invoiced', 'completed')
     AND NEW.transaction_id IS NULL THEN
    
    -- Get client info
    SELECT name, client_type INTO v_client_name, v_client_type FROM clients WHERE id = NEW.client_id;
    
    -- Determine accounts based on client type
    IF LOWER(COALESCE(v_client_type, 'local')) = 'export' THEN
      v_debit_client_account := '4112';   -- Clients export
      v_credit_revenue_account := '7012'; -- Ventes export
    ELSE
      v_debit_client_account := '4111';   -- Clients locaux
      v_credit_revenue_account := '7011'; -- Ventes locales
    END IF;

    v_description := 'Vente - ' || COALESCE(v_client_name, NEW.customer_name, 'Client') || ' - ' || COALESCE(NEW.invoice_number, 'N° ' || NEW.id::TEXT);
    v_reference := COALESCE(NEW.invoice_number, NEW.order_number, 'VENTE-' || NEW.id::TEXT);

    -- Create revenue transaction: Debit Client / Credit Revenue (amount HT)
    INSERT INTO transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference, notes
    ) VALUES (
      NEW.tenant_id, COALESCE(NEW.sale_date, CURRENT_DATE), 
      CASE WHEN LOWER(COALESCE(v_client_type, 'local')) = 'export' THEN 'vente_export' ELSE 'vente_locale' END,
      NEW.total_amount, v_description, v_reference, NEW.notes
    ) RETURNING id INTO v_transaction_id;

    -- Debit: Client account (total_amount = HT + TVA)
    INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
    SELECT v_transaction_id, id, account_number, account_name, NEW.total_amount, 0, v_description
    FROM chart_of_accounts
    WHERE tenant_id = NEW.tenant_id AND account_number = v_debit_client_account AND is_active = true
    LIMIT 1;

    -- Credit: Revenue account (amount HT)
    INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
    SELECT v_transaction_id, id, account_number, account_name, 0, COALESCE(NEW.amount_ht, NEW.total_amount), v_description
    FROM chart_of_accounts
    WHERE tenant_id = NEW.tenant_id AND account_number = v_credit_revenue_account AND is_active = true
    LIMIT 1;

    -- Credit: TVA account (only for local clients with TVA > 0)
    IF LOWER(COALESCE(v_client_type, 'local')) != 'export' AND COALESCE(NEW.tva_amount, 0) > 0 THEN
      INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
      SELECT v_transaction_id, id, account_number, account_name, 0, NEW.tva_amount, 'TVA collectée - ' || v_description
      FROM chart_of_accounts
      WHERE tenant_id = NEW.tenant_id AND account_number = '4431' AND is_active = true
      LIMIT 1;
    END IF;

    NEW.transaction_id := v_transaction_id;

    -- COGS entries on completion
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
            'Sortie stock au coût de revient: ' || v_cost_per_ton || ' FCFA/tonne',
            '73', '36'
          );
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Create payment accounting trigger
CREATE OR REPLACE FUNCTION public.create_accounting_entry_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_type TEXT;
  v_client_name TEXT;
  v_invoice_number TEXT;
  v_credit_client_account TEXT;
  v_transaction_id UUID;
  v_description TEXT;
BEGIN
  -- Only on INSERT
  IF TG_OP = 'INSERT' AND NEW.amount IS NOT NULL AND NEW.amount > 0 THEN
    -- Get client type from the sale
    SELECT c.client_type, c.name, s.invoice_number 
    INTO v_client_type, v_client_name, v_invoice_number
    FROM sales s
    LEFT JOIN clients c ON c.id = s.client_id
    WHERE s.id = NEW.facture_id;

    IF LOWER(COALESCE(v_client_type, 'local')) = 'export' THEN
      v_credit_client_account := '4112';
    ELSE
      v_credit_client_account := '4111';
    END IF;

    v_description := 'Paiement - ' || COALESCE(v_client_name, 'Client') || ' - ' || COALESCE(v_invoice_number, 'Facture ' || COALESCE(NEW.facture_id::TEXT, ''));

    -- Create transaction
    INSERT INTO transactions (
      tenant_id, transaction_date, transaction_type, amount, description, reference, notes
    ) VALUES (
      NEW.tenant_id, COALESCE(NEW.payment_date::date, CURRENT_DATE), 'recette', NEW.amount,
      v_description, COALESCE(v_invoice_number, 'PAY-' || NEW.id::TEXT), NEW.notes
    ) RETURNING id INTO v_transaction_id;

    -- Debit: Bank account (5211)
    INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
    SELECT v_transaction_id, id, account_number, account_name, NEW.amount, 0, v_description
    FROM chart_of_accounts
    WHERE tenant_id = NEW.tenant_id AND account_number = '5211' AND is_active = true
    LIMIT 1;

    -- Credit: Client account (4111 or 4112)
    INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
    SELECT v_transaction_id, id, account_number, account_name, 0, NEW.amount, v_description
    FROM chart_of_accounts
    WHERE tenant_id = NEW.tenant_id AND account_number = v_credit_client_account AND is_active = true
    LIMIT 1;

    -- Update bank balance
    UPDATE accounts SET balance = COALESCE(balance, 0) + NEW.amount
    WHERE tenant_id = NEW.tenant_id AND account_number ILIKE '5211%';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on payments
DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_payment ON public.payments;
CREATE TRIGGER trigger_create_accounting_entry_on_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION create_accounting_entry_on_payment();
