
-- =============================================
-- CORRECTION 1: Supprimer le trigger dupliqué
-- =============================================
DROP TRIGGER IF EXISTS trigger_generate_journal_entries ON public.transactions;
-- On garde uniquement trg_generate_journal_entries

-- =============================================
-- CORRECTION 2: Élargir la contrainte charge pour accepter toute la classe 6
-- =============================================
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS chk_account_class_charge;
ALTER TABLE public.purchase_orders ADD CONSTRAINT chk_account_class_charge 
  CHECK (purchase_type <> 'charge' OR charge_account_number IS NULL OR charge_account_number LIKE '6%');

-- =============================================
-- CORRECTION 3: Fonction de liquidation TVA
-- =============================================
CREATE OR REPLACE FUNCTION public.liquidate_tva(
  p_tenant_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_description TEXT DEFAULT 'Déclaration TVA'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tva_collectee NUMERIC := 0;
  v_tva_deductible_abs NUMERIC := 0;
  v_tva_deductible_immo NUMERIC := 0;
  v_tva_deductible_total NUMERIC := 0;
  v_solde_tva NUMERIC;
  v_transaction_id UUID;
  v_description TEXT;
BEGIN
  -- Vérifier qu'il n'y a pas déjà une liquidation pour cette période
  IF EXISTS (
    SELECT 1 FROM transactions
    WHERE tenant_id = p_tenant_id
      AND transaction_type = 'liquidation_tva'
      AND transaction_date = p_period_end
  ) THEN
    RAISE EXCEPTION 'Une liquidation TVA existe déjà pour cette période (date: %)', p_period_end;
  END IF;

  -- TVA collectée (4431) = ce qu'on a encaissé
  SELECT COALESCE(SUM(je.credit - je.debit), 0) INTO v_tva_collectee
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = p_tenant_id
    AND je.account_number LIKE '4431%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end
    AND t.transaction_type != 'liquidation_tva';

  -- TVA déductible sur ABS (44566)
  SELECT COALESCE(SUM(je.debit - je.credit), 0) INTO v_tva_deductible_abs
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = p_tenant_id
    AND je.account_number LIKE '44566%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end
    AND t.transaction_type != 'liquidation_tva';

  -- TVA déductible sur immobilisations (44562)
  SELECT COALESCE(SUM(je.debit - je.credit), 0) INTO v_tva_deductible_immo
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = p_tenant_id
    AND je.account_number LIKE '44562%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end
    AND t.transaction_type != 'liquidation_tva';

  v_tva_deductible_total := v_tva_deductible_abs + v_tva_deductible_immo;
  v_solde_tva := v_tva_collectee - v_tva_deductible_total;

  v_description := p_description || ' - Période ' || p_period_start || ' au ' || p_period_end;

  -- Créer la transaction de liquidation
  INSERT INTO transactions (
    tenant_id, transaction_date, transaction_type, amount, description, reference, journal_code
  ) VALUES (
    p_tenant_id, p_period_end, 'liquidation_tva', ABS(v_solde_tva),
    v_description,
    'TVA-' || to_char(p_period_end, 'YYYY-MM'),
    'OD'
  ) RETURNING id INTO v_transaction_id;

  -- Solder la TVA collectée: Débit 4431
  IF v_tva_collectee > 0 THEN
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '4431', 'TVA collectée', v_tva_collectee, 0, v_description);
  END IF;

  -- Solder la TVA déductible ABS: Crédit 44566
  IF v_tva_deductible_abs > 0 THEN
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '44566', 'TVA déductible sur ABS', 0, v_tva_deductible_abs, v_description);
  END IF;

  -- Solder la TVA déductible Immo: Crédit 44562
  IF v_tva_deductible_immo > 0 THEN
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '44562', 'TVA déductible sur immobilisations', 0, v_tva_deductible_immo, v_description);
  END IF;

  -- Solde TVA
  IF v_solde_tva > 0 THEN
    -- TVA à payer: Crédit 4441
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '4441', 'État, TVA due', 0, v_solde_tva, 'TVA à décaisser');
  ELSIF v_solde_tva < 0 THEN
    -- Crédit de TVA: Débit 4449
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '4449', 'État, crédit de TVA à reporter', ABS(v_solde_tva), 0, 'Crédit de TVA à reporter');
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- =============================================
-- CORRECTION 4: Prorata temporis dans le plan d'amortissement
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_depreciation_schedule(p_asset_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_asset record;
  v_annual_depreciation numeric;
  v_first_year_amount numeric;
  v_last_year_amount numeric;
  v_period_start date;
  v_period_end date;
  v_cumulative numeric := 0;
  v_nbv numeric;
  v_year integer;
  v_start_date date;
  v_days_first_year integer;
  v_days_in_year integer := 360; -- Convention SYSCOHADA: 360 jours
  v_prorata_ratio numeric;
  v_total_years integer;
  v_depreciation_this_year numeric;
BEGIN
  SELECT * INTO v_asset FROM public.fixed_assets WHERE id = p_asset_id;
  
  IF v_asset IS NULL THEN
    RAISE EXCEPTION 'Immobilisation non trouvée';
  END IF;
  
  -- Supprimer le plan existant non posté
  DELETE FROM public.depreciation_schedule 
  WHERE fixed_asset_id = p_asset_id AND is_posted = false;
  
  v_start_date := COALESCE(v_asset.commissioning_date, v_asset.acquisition_date);
  
  -- Calcul amortissement annuel complet
  v_annual_depreciation := (v_asset.acquisition_cost - COALESCE(v_asset.residual_value, 0)) / v_asset.useful_life_years;
  v_nbv := v_asset.acquisition_cost;
  
  -- Prorata temporis pour la première année (convention 30j/mois, 360j/an)
  v_days_first_year := (12 - EXTRACT(MONTH FROM v_start_date) + 1) * 30 
                       - (EXTRACT(DAY FROM v_start_date) - 1);
  IF v_days_first_year > v_days_in_year THEN
    v_days_first_year := v_days_in_year;
  END IF;
  v_prorata_ratio := v_days_first_year::numeric / v_days_in_year::numeric;
  
  v_first_year_amount := ROUND(v_annual_depreciation * v_prorata_ratio, 2);
  
  -- Si prorata, on ajoute une année supplémentaire pour compléter
  IF v_prorata_ratio < 1 THEN
    v_total_years := v_asset.useful_life_years + 1;
    v_last_year_amount := ROUND(v_annual_depreciation * (1 - v_prorata_ratio), 2);
  ELSE
    v_total_years := v_asset.useful_life_years;
    v_last_year_amount := 0;
  END IF;
  
  FOR v_year IN 1..v_total_years LOOP
    -- Première période : de la mise en service au 31/12
    IF v_year = 1 THEN
      v_period_start := v_start_date;
      v_period_end := make_date(EXTRACT(YEAR FROM v_start_date)::integer, 12, 31);
      v_depreciation_this_year := v_first_year_amount;
    ELSIF v_year = v_total_years AND v_prorata_ratio < 1 THEN
      -- Dernière année complémentaire
      v_period_start := make_date(EXTRACT(YEAR FROM v_start_date)::integer + v_year - 1, 1, 1);
      v_period_end := make_date(EXTRACT(YEAR FROM v_start_date)::integer + v_year - 1, 12, 31);
      v_depreciation_this_year := v_last_year_amount;
    ELSE
      v_period_start := make_date(EXTRACT(YEAR FROM v_start_date)::integer + v_year - 1, 1, 1);
      v_period_end := make_date(EXTRACT(YEAR FROM v_start_date)::integer + v_year - 1, 12, 31);
      v_depreciation_this_year := v_annual_depreciation;
    END IF;
    
    v_cumulative := v_cumulative + v_depreciation_this_year;
    v_nbv := v_asset.acquisition_cost - v_cumulative;
    
    -- Ajuster la dernière année pour la valeur résiduelle
    IF v_nbv < COALESCE(v_asset.residual_value, 0) THEN
      v_depreciation_this_year := v_depreciation_this_year - (COALESCE(v_asset.residual_value, 0) - v_nbv);
      v_cumulative := v_asset.acquisition_cost - COALESCE(v_asset.residual_value, 0);
      v_nbv := COALESCE(v_asset.residual_value, 0);
    END IF;
    
    IF v_depreciation_this_year > 0 THEN
      INSERT INTO public.depreciation_schedule (
        tenant_id, fixed_asset_id, period_start, period_end,
        depreciation_amount, cumulative_depreciation, net_book_value
      ) VALUES (
        v_asset.tenant_id, p_asset_id, v_period_start, v_period_end,
        v_depreciation_this_year, v_cumulative, v_nbv
      );
    END IF;
  END LOOP;
  
  -- Mettre à jour la valeur nette de l'immobilisation
  UPDATE public.fixed_assets 
  SET net_book_value = v_asset.acquisition_cost,
      total_depreciated = 0
  WHERE id = p_asset_id;
END;
$$;

-- =============================================
-- CORRECTION 5: S'assurer que les comptes TVA existent dans chart_of_accounts
-- pour chaque tenant (idempotent)
-- =============================================
INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT t.id, '4441', 'État, TVA due', 'passif', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.chart_of_accounts c 
  WHERE c.tenant_id = t.id AND c.account_number = '4441'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT t.id, '4449', 'État, crédit de TVA à reporter', 'actif', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.chart_of_accounts c 
  WHERE c.tenant_id = t.id AND c.account_number = '4449'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT t.id, '44562', 'TVA déductible sur immobilisations', 'actif', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.chart_of_accounts c 
  WHERE c.tenant_id = t.id AND c.account_number = '44562'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT t.id, '44566', 'TVA déductible sur ABS', 'actif', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.chart_of_accounts c 
  WHERE c.tenant_id = t.id AND c.account_number = '44566'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT t.id, '4091', 'Avances et acomptes versés', 'actif', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.chart_of_accounts c 
  WHERE c.tenant_id = t.id AND c.account_number = '4091'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT t.id, '681', 'Dotations aux amortissements', 'charge', true
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.chart_of_accounts c 
  WHERE c.tenant_id = t.id AND c.account_number = '681'
)
ON CONFLICT DO NOTHING;
