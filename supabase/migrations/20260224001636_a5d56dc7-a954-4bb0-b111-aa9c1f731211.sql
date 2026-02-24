
-- =============================================
-- CRR Dynamique V2: Coût de Revient Réel amélioré
-- Intègre: MO (payroll), Achats par catégorie (purchase_orders),
-- Amortissements (depreciation_schedule), Stock CMP
-- =============================================

-- 1) Add column cout_amortissement if missing on cost_per_ton (already exists per schema)
-- Add expense_category to purchase_orders for cost classification if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'expense_category'
  ) THEN
    ALTER TABLE public.purchase_orders ADD COLUMN expense_category text;
  END IF;
END $$;

-- 2) Enhanced calculate_cost_per_ton function
CREATE OR REPLACE FUNCTION public.calculate_cost_per_ton(
  p_tenant_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_campagne_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_production NUMERIC := 0;
  v_cout_main_oeuvre NUMERIC := 0;
  v_cout_matieres NUMERIC := 0;
  v_cout_energie NUMERIC := 0;
  v_cout_transport NUMERIC := 0;
  v_cout_maintenance NUMERIC := 0;
  v_cout_amortissement NUMERIC := 0;
  v_autres_couts NUMERIC := 0;
  v_cout_total NUMERIC := 0;
  v_cout_par_tonne NUMERIC := 0;
  v_details_type JSONB;
  v_stock_value NUMERIC := 0;
  v_stock_cmp NUMERIC := 0;
BEGIN
  -- ========== PRODUCTION TOTALE ==========
  SELECT COALESCE(SUM(quantity), 0) INTO v_total_production
  FROM production_records
  WHERE tenant_id = p_tenant_id
    AND production_date BETWEEN p_period_start AND p_period_end
    AND deleted_at IS NULL
    AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);

  -- ========== COÛT MAIN D'ŒUVRE ==========
  -- Salaires via transactions
  SELECT COALESCE(SUM(amount), 0) INTO v_cout_main_oeuvre
  FROM transactions
  WHERE tenant_id = p_tenant_id
    AND transaction_type = 'salaire'
    AND transaction_date BETWEEN p_period_start AND p_period_end;
  
  -- Pointages payés (payroll_payments)
  SELECT v_cout_main_oeuvre + COALESCE(SUM(paid_amount), 0) INTO v_cout_main_oeuvre
  FROM payroll_payments
  WHERE tenant_id = p_tenant_id
    AND payment_date BETWEEN p_period_start AND p_period_end;

  -- ========== ACHATS PAR CATÉGORIE (purchase_orders reçus) ==========
  -- Matières premières: achats avec expense_category commençant par 60
  SELECT COALESCE(SUM(total_amount), 0) INTO v_cout_matieres
  FROM purchase_orders
  WHERE tenant_id = p_tenant_id
    AND status IN ('received', 'approved')
    AND order_date BETWEEN p_period_start AND p_period_end
    AND expense_category LIKE '60%'
    AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);

  -- Énergie: catégorie 61x
  SELECT COALESCE(SUM(total_amount), 0) INTO v_cout_energie
  FROM purchase_orders
  WHERE tenant_id = p_tenant_id
    AND status IN ('received', 'approved')
    AND order_date BETWEEN p_period_start AND p_period_end
    AND expense_category LIKE '61%'
    AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);

  -- Transport: catégorie 62x
  SELECT COALESCE(SUM(total_amount), 0) INTO v_cout_transport
  FROM purchase_orders
  WHERE tenant_id = p_tenant_id
    AND status IN ('received', 'approved')
    AND order_date BETWEEN p_period_start AND p_period_end
    AND expense_category LIKE '62%'
    AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);

  -- Maintenance: catégorie 63x
  SELECT COALESCE(SUM(total_amount), 0) INTO v_cout_maintenance
  FROM purchase_orders
  WHERE tenant_id = p_tenant_id
    AND status IN ('received', 'approved')
    AND order_date BETWEEN p_period_start AND p_period_end
    AND expense_category LIKE '63%'
    AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);

  -- Autres dépenses opérationnelles (64x-68x sauf 681 amortissement)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_autres_couts
  FROM purchase_orders
  WHERE tenant_id = p_tenant_id
    AND status IN ('received', 'approved')
    AND order_date BETWEEN p_period_start AND p_period_end
    AND expense_category IS NOT NULL
    AND expense_category NOT LIKE '60%'
    AND expense_category NOT LIKE '61%'
    AND expense_category NOT LIKE '62%'
    AND expense_category NOT LIKE '63%'
    AND expense_category NOT LIKE '2%' -- Exclure immobilisations
    AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);

  -- Ajouter les dépenses directes (transactions type depense sans lien PO)
  SELECT v_autres_couts + COALESCE(SUM(amount), 0) INTO v_autres_couts
  FROM transactions
  WHERE tenant_id = p_tenant_id
    AND transaction_type = 'depense'
    AND transaction_date BETWEEN p_period_start AND p_period_end;

  -- ========== AMORTISSEMENTS ==========
  SELECT COALESCE(SUM(depreciation_amount), 0) INTO v_cout_amortissement
  FROM depreciation_schedule
  WHERE tenant_id = p_tenant_id
    AND period_start >= p_period_start
    AND period_end <= p_period_end;

  -- ========== VALORISATION STOCK CMP ==========
  SELECT COALESCE(SUM(total_stock_value), 0), COALESCE(AVG(cmp), 0)
  INTO v_stock_value, v_stock_cmp
  FROM inventory_items
  WHERE tenant_id = p_tenant_id
    AND is_active = true
    AND item_category = 'production';

  -- ========== CALCUL TOTAL ==========
  v_cout_total := v_cout_main_oeuvre + v_cout_matieres + v_cout_energie + 
                  v_cout_transport + v_cout_maintenance + v_cout_amortissement + v_autres_couts;
  
  IF v_total_production > 0 THEN
    v_cout_par_tonne := v_cout_total / (v_total_production / 1000);
  END IF;

  -- ========== DÉTAILS PAR TYPE DE SEL ==========
  SELECT COALESCE(jsonb_object_agg(
    salt_type,
    jsonb_build_object(
      'production_kg', quantity,
      'production_tons', ROUND(quantity / 1000, 2),
      'cout_estime', CASE WHEN v_total_production > 0 
        THEN ROUND(v_cout_total * (quantity / v_total_production), 2) 
        ELSE 0 END,
      'cmp_unitaire', CASE WHEN quantity > 0
        THEN ROUND(v_cout_total * (quantity / v_total_production) / quantity, 2)
        ELSE 0 END
    )
  ), '{}'::jsonb) INTO v_details_type
  FROM (
    SELECT salt_type, SUM(quantity) as quantity
    FROM production_records
    WHERE tenant_id = p_tenant_id
      AND production_date BETWEEN p_period_start AND p_period_end
      AND deleted_at IS NULL
      AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id)
    GROUP BY salt_type
  ) sq;

  RETURN jsonb_build_object(
    'total_production_kg', v_total_production,
    'total_production_tons', ROUND(v_total_production / 1000, 2),
    'cout_main_oeuvre', v_cout_main_oeuvre,
    'cout_matieres_premieres', v_cout_matieres,
    'cout_energie', v_cout_energie,
    'cout_transport', v_cout_transport,
    'cout_maintenance', v_cout_maintenance,
    'cout_amortissement', v_cout_amortissement,
    'autres_couts', v_autres_couts,
    'cout_total', v_cout_total,
    'cout_par_tonne', ROUND(v_cout_par_tonne, 2),
    'details_par_type', v_details_type,
    'stock_value', v_stock_value,
    'stock_cmp_moyen', ROUND(v_stock_cmp, 2),
    'period_start', p_period_start,
    'period_end', p_period_end,
    'generated_at', NOW()
  );
END;
$$;

-- 3) Index optimisés pour le CRR
CREATE INDEX IF NOT EXISTS idx_production_records_tenant_date 
  ON production_records(tenant_id, production_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_date_cat 
  ON purchase_orders(tenant_id, order_date, expense_category) WHERE status IN ('received', 'approved');

CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_tenant_period 
  ON depreciation_schedule(tenant_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payroll_payments_tenant_date 
  ON payroll_payments(tenant_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant_type_date 
  ON transactions(tenant_id, transaction_type, transaction_date);
