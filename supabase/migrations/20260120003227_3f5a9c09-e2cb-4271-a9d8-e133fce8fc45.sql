-- =============================================
-- Table pour les rapports financiers (Bilan, Compte de résultat)
-- =============================================
CREATE TABLE public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  campagne_id UUID REFERENCES public.campagnes(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('bilan', 'compte_resultat')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_actif NUMERIC DEFAULT 0,
  total_passif NUMERIC DEFAULT 0,
  total_produits NUMERIC DEFAULT 0,
  total_charges NUMERIC DEFAULT 0,
  resultat_net NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'closed')),
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Index pour les recherches
CREATE INDEX idx_financial_reports_tenant_type ON public.financial_reports(tenant_id, report_type);
CREATE INDEX idx_financial_reports_period ON public.financial_reports(period_start, period_end);

-- =============================================
-- Table pour le coût de revient par tonne
-- =============================================
CREATE TABLE public.cost_per_ton (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  campagne_id UUID REFERENCES public.campagnes(id),
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Données de production
  total_production_kg NUMERIC NOT NULL DEFAULT 0,
  total_production_tons NUMERIC GENERATED ALWAYS AS (total_production_kg / 1000) STORED,
  
  -- Coûts détaillés
  cout_main_oeuvre NUMERIC DEFAULT 0,
  cout_matieres_premieres NUMERIC DEFAULT 0,
  cout_energie NUMERIC DEFAULT 0,
  cout_transport NUMERIC DEFAULT 0,
  cout_maintenance NUMERIC DEFAULT 0,
  cout_amortissement NUMERIC DEFAULT 0,
  autres_couts NUMERIC DEFAULT 0,
  
  -- Totaux calculés
  cout_total NUMERIC GENERATED ALWAYS AS (
    COALESCE(cout_main_oeuvre, 0) + 
    COALESCE(cout_matieres_premieres, 0) + 
    COALESCE(cout_energie, 0) + 
    COALESCE(cout_transport, 0) + 
    COALESCE(cout_maintenance, 0) + 
    COALESCE(cout_amortissement, 0) + 
    COALESCE(autres_couts, 0)
  ) STORED,
  
  cout_par_tonne NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN total_production_kg > 0 THEN (
        COALESCE(cout_main_oeuvre, 0) + 
        COALESCE(cout_matieres_premieres, 0) + 
        COALESCE(cout_energie, 0) + 
        COALESCE(cout_transport, 0) + 
        COALESCE(cout_maintenance, 0) + 
        COALESCE(cout_amortissement, 0) + 
        COALESCE(autres_couts, 0)
      ) / (total_production_kg / 1000)
      ELSE 0
    END
  ) STORED,
  
  -- Détails par type de sel
  details_par_type JSONB DEFAULT '{}'::jsonb,
  
  status TEXT DEFAULT 'calculated' CHECK (status IN ('calculated', 'validated', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Index
CREATE INDEX idx_cost_per_ton_tenant ON public.cost_per_ton(tenant_id);
CREATE INDEX idx_cost_per_ton_campagne ON public.cost_per_ton(campagne_id);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_per_ton ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Politiques RLS pour financial_reports
-- =============================================
CREATE POLICY "Users can view financial reports"
ON public.financial_reports FOR SELECT
USING (tenant_id = get_user_tenant_id((SELECT auth.uid())));

CREATE POLICY "Managers can create financial reports"
ON public.financial_reports FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) IN ('admin', 'gerant', 'comptable')
);

CREATE POLICY "Managers can update financial reports"
ON public.financial_reports FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) IN ('admin', 'gerant', 'comptable')
);

CREATE POLICY "Managers can delete financial reports"
ON public.financial_reports FOR DELETE
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) IN ('admin', 'gerant')
);

-- =============================================
-- Politiques RLS pour cost_per_ton
-- =============================================
CREATE POLICY "Users can view cost per ton"
ON public.cost_per_ton FOR SELECT
USING (tenant_id = get_user_tenant_id((SELECT auth.uid())));

CREATE POLICY "Managers can create cost per ton"
ON public.cost_per_ton FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) IN ('admin', 'gerant', 'comptable')
);

CREATE POLICY "Managers can update cost per ton"
ON public.cost_per_ton FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) IN ('admin', 'gerant', 'comptable')
);

CREATE POLICY "Managers can delete cost per ton"
ON public.cost_per_ton FOR DELETE
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) IN ('admin', 'gerant')
);

-- =============================================
-- Triggers pour updated_at
-- =============================================
CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON public.financial_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_per_ton_updated_at
  BEFORE UPDATE ON public.cost_per_ton
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Fonction pour générer automatiquement le Bilan
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_balance_sheet(
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
  result JSONB;
  actif_immobilise JSONB;
  actif_circulant JSONB;
  capitaux_propres JSONB;
  dettes JSONB;
  total_actif NUMERIC := 0;
  total_passif NUMERIC := 0;
BEGIN
  -- Classe 2: Actifs immobilisés
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.debit - je.credit), 0)
  )), '[]'::jsonb)
  INTO actif_immobilise
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND coa.account_number LIKE '2%'
    AND (t.transaction_date IS NULL OR t.transaction_date BETWEEN p_period_start AND p_period_end);

  -- Classe 3-4: Actifs circulants (stocks + créances)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.debit - je.credit), 0)
  )), '[]'::jsonb)
  INTO actif_circulant
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND (coa.account_number LIKE '3%' OR coa.account_number LIKE '4%')
    AND (t.transaction_date IS NULL OR t.transaction_date BETWEEN p_period_start AND p_period_end);

  -- Classe 1: Capitaux propres
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.credit - je.debit), 0)
  )), '[]'::jsonb)
  INTO capitaux_propres
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND coa.account_number LIKE '1%'
    AND (t.transaction_date IS NULL OR t.transaction_date BETWEEN p_period_start AND p_period_end);

  -- Classe 4 (passif): Dettes
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.credit - je.debit), 0)
  )), '[]'::jsonb)
  INTO dettes
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND coa.account_number LIKE '4%'
    AND coa.account_type = 'passif'
    AND (t.transaction_date IS NULL OR t.transaction_date BETWEEN p_period_start AND p_period_end);

  -- Calculer les totaux
  SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0) INTO total_actif
  FROM jsonb_array_elements(actif_immobilise || actif_circulant) AS item
  WHERE (item->>'balance')::NUMERIC > 0;

  SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0) INTO total_passif
  FROM jsonb_array_elements(capitaux_propres || dettes) AS item
  WHERE (item->>'balance')::NUMERIC > 0;

  -- Construire le résultat
  result := jsonb_build_object(
    'actif', jsonb_build_object(
      'actif_immobilise', actif_immobilise,
      'actif_circulant', actif_circulant,
      'total', total_actif
    ),
    'passif', jsonb_build_object(
      'capitaux_propres', capitaux_propres,
      'dettes', dettes,
      'total', total_passif
    ),
    'equilibre', total_actif = total_passif,
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- =============================================
-- Fonction pour générer le Compte de Résultat
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_income_statement(
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
  result JSONB;
  produits_exploitation JSONB;
  charges_exploitation JSONB;
  produits_financiers JSONB;
  charges_financieres JSONB;
  total_produits NUMERIC := 0;
  total_charges NUMERIC := 0;
  resultat_exploitation NUMERIC := 0;
  resultat_financier NUMERIC := 0;
  resultat_net NUMERIC := 0;
BEGIN
  -- Classe 7: Produits d'exploitation
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.credit - je.debit), 0)
  )), '[]'::jsonb)
  INTO produits_exploitation
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND coa.account_number LIKE '7%'
    AND coa.account_number NOT LIKE '77%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Classe 6: Charges d'exploitation
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.debit - je.credit), 0)
  )), '[]'::jsonb)
  INTO charges_exploitation
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND coa.account_number LIKE '6%'
    AND coa.account_number NOT LIKE '67%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Produits financiers (77x)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.credit - je.debit), 0)
  )), '[]'::jsonb)
  INTO produits_financiers
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND coa.account_number LIKE '77%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Charges financières (67x)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'account_number', coa.account_number,
    'account_name', coa.account_name,
    'balance', COALESCE(SUM(je.debit - je.credit), 0)
  )), '[]'::jsonb)
  INTO charges_financieres
  FROM chart_of_accounts coa
  LEFT JOIN journal_entries je ON je.account_id = coa.id
  LEFT JOIN transactions t ON je.transaction_id = t.id
  WHERE coa.tenant_id = p_tenant_id
    AND coa.account_number LIKE '67%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Calculer les totaux
  SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0) INTO total_produits
  FROM jsonb_array_elements(produits_exploitation || produits_financiers) AS item;

  SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0) INTO total_charges
  FROM jsonb_array_elements(charges_exploitation || charges_financieres) AS item;

  -- Résultats
  SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0) INTO resultat_exploitation
  FROM jsonb_array_elements(produits_exploitation) AS item;
  resultat_exploitation := resultat_exploitation - (
    SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0)
    FROM jsonb_array_elements(charges_exploitation) AS item
  );

  SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0) INTO resultat_financier
  FROM jsonb_array_elements(produits_financiers) AS item;
  resultat_financier := resultat_financier - (
    SELECT COALESCE(SUM((item->>'balance')::NUMERIC), 0)
    FROM jsonb_array_elements(charges_financieres) AS item
  );

  resultat_net := total_produits - total_charges;

  -- Construire le résultat
  result := jsonb_build_object(
    'produits', jsonb_build_object(
      'exploitation', produits_exploitation,
      'financiers', produits_financiers,
      'total', total_produits
    ),
    'charges', jsonb_build_object(
      'exploitation', charges_exploitation,
      'financieres', charges_financieres,
      'total', total_charges
    ),
    'resultats', jsonb_build_object(
      'exploitation', resultat_exploitation,
      'financier', resultat_financier,
      'net', resultat_net
    ),
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- =============================================
-- Fonction pour calculer le coût de revient
-- =============================================
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
  v_autres_couts NUMERIC := 0;
  v_cout_total NUMERIC := 0;
  v_cout_par_tonne NUMERIC := 0;
  v_details_type JSONB;
BEGIN
  -- Production totale en kg
  SELECT COALESCE(SUM(quantity), 0) INTO v_total_production
  FROM production_records
  WHERE tenant_id = p_tenant_id
    AND production_date BETWEEN p_period_start AND p_period_end
    AND deleted_at IS NULL
    AND (p_campagne_id IS NULL OR campagne_id = p_campagne_id);

  -- Coût main d'œuvre (salaires + pointages)
  SELECT COALESCE(SUM(amount), 0) INTO v_cout_main_oeuvre
  FROM transactions
  WHERE tenant_id = p_tenant_id
    AND transaction_type IN ('salaire')
    AND transaction_date BETWEEN p_period_start AND p_period_end;
  
  -- Ajouter les paiements de pointages
  SELECT v_cout_main_oeuvre + COALESCE(SUM(paid_amount), 0) INTO v_cout_main_oeuvre
  FROM payroll_payments
  WHERE tenant_id = p_tenant_id
    AND payment_date BETWEEN p_period_start AND p_period_end;

  -- Coût matières premières (achats catégorie matière)
  SELECT COALESCE(SUM(t.amount), 0) INTO v_cout_matieres
  FROM transactions t
  JOIN expense_types et ON t.expense_type_id = et.id
  WHERE t.tenant_id = p_tenant_id
    AND t.transaction_type = 'depense'
    AND et.syscohada_category LIKE '60%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Coût énergie (61x)
  SELECT COALESCE(SUM(t.amount), 0) INTO v_cout_energie
  FROM transactions t
  JOIN expense_types et ON t.expense_type_id = et.id
  WHERE t.tenant_id = p_tenant_id
    AND t.transaction_type = 'depense'
    AND et.syscohada_category LIKE '61%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Coût transport (62x)
  SELECT COALESCE(SUM(t.amount), 0) INTO v_cout_transport
  FROM transactions t
  JOIN expense_types et ON t.expense_type_id = et.id
  WHERE t.tenant_id = p_tenant_id
    AND t.transaction_type = 'depense'
    AND et.syscohada_category LIKE '62%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Coût maintenance (63x)
  SELECT COALESCE(SUM(t.amount), 0) INTO v_cout_maintenance
  FROM transactions t
  JOIN expense_types et ON t.expense_type_id = et.id
  WHERE t.tenant_id = p_tenant_id
    AND t.transaction_type = 'depense'
    AND et.syscohada_category LIKE '63%'
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Autres coûts (autres 6x)
  SELECT COALESCE(SUM(t.amount), 0) INTO v_autres_couts
  FROM transactions t
  LEFT JOIN expense_types et ON t.expense_type_id = et.id
  WHERE t.tenant_id = p_tenant_id
    AND t.transaction_type = 'depense'
    AND (et.id IS NULL OR (
      et.syscohada_category NOT LIKE '60%'
      AND et.syscohada_category NOT LIKE '61%'
      AND et.syscohada_category NOT LIKE '62%'
      AND et.syscohada_category NOT LIKE '63%'
    ))
    AND t.transaction_date BETWEEN p_period_start AND p_period_end;

  -- Calcul total et par tonne
  v_cout_total := v_cout_main_oeuvre + v_cout_matieres + v_cout_energie + 
                  v_cout_transport + v_cout_maintenance + v_autres_couts;
  
  IF v_total_production > 0 THEN
    v_cout_par_tonne := v_cout_total / (v_total_production / 1000);
  END IF;

  -- Détails par type de sel
  SELECT COALESCE(jsonb_object_agg(
    salt_type,
    jsonb_build_object(
      'production_kg', quantity,
      'production_tons', quantity / 1000,
      'cout_estime', CASE WHEN v_total_production > 0 
        THEN v_cout_total * (quantity / v_total_production) 
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
    'total_production_tons', v_total_production / 1000,
    'cout_main_oeuvre', v_cout_main_oeuvre,
    'cout_matieres_premieres', v_cout_matieres,
    'cout_energie', v_cout_energie,
    'cout_transport', v_cout_transport,
    'cout_maintenance', v_cout_maintenance,
    'autres_couts', v_autres_couts,
    'cout_total', v_cout_total,
    'cout_par_tonne', ROUND(v_cout_par_tonne, 2),
    'details_par_type', v_details_type,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'generated_at', now()
  );
END;
$$;