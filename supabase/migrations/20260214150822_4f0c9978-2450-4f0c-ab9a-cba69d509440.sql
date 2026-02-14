
-- ============================================================
-- Correction des mappings comptables SYSCOHADA révisé
-- Compte 35 (Services en cours) → 36 (Produits finis)
-- Compte 72 (Production immobilisée) → 73 (Variations stocks produits)
-- Compte 603 (Variation stocks achetés) → 73 (Variations stocks produits)
-- ============================================================

-- 1. Corriger le trigger de production : Débit 36 / Crédit 73
CREATE OR REPLACE FUNCTION public.create_accounting_entry_on_production()
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
        'Valorisation au coût de revient: ' || v_cost_per_ton || ' FCFA/tonne',
        '36',  -- Produits finis (au lieu de 35 Services en cours)
        '73'   -- Variations des stocks de biens produits (au lieu de 72 Production immobilisée)
      ) INTO v_transaction_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Corriger le trigger de vente (COGS) : Débit 73 / Crédit 36
CREATE OR REPLACE FUNCTION public.create_accounting_entry_on_sale()
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
            'Sortie stock au coût de revient: ' || v_cost_per_ton || ' FCFA/tonne',
            '73',  -- Variations des stocks de biens produits (au lieu de 603 Variation stocks achetés)
            '36'   -- Produits finis (au lieu de 35 Services en cours)
          );
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
