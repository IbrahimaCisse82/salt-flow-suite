
-- ============================================
-- 1. PROCÉDURE DE CLÔTURE D'EXERCICE (SYSCOHADA)
-- ============================================
-- Solde les comptes de charges (6) et produits (7) vers le résultat (13)
-- Solde le compte 104 (exploitant) vers 103 (capital personnel)
CREATE OR REPLACE FUNCTION public.close_fiscal_year(
  p_tenant_id UUID,
  p_fiscal_year_end DATE,
  p_description TEXT DEFAULT 'Clôture exercice'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_total_charges NUMERIC := 0;
  v_total_produits NUMERIC := 0;
  v_resultat NUMERIC;
  v_compte104_solde NUMERIC := 0;
  v_result_account TEXT;
  rec RECORD;
BEGIN
  -- Vérifier qu'il n'y a pas déjà une clôture pour cet exercice
  IF EXISTS (
    SELECT 1 FROM transactions
    WHERE tenant_id = p_tenant_id
      AND transaction_type = 'cloture'
      AND transaction_date = p_fiscal_year_end
  ) THEN
    RAISE EXCEPTION 'Une clôture existe déjà pour cet exercice à la date %', p_fiscal_year_end;
  END IF;

  -- Calculer le total des charges (classe 6) et produits (classe 7)
  SELECT COALESCE(SUM(je.debit - je.credit), 0) INTO v_total_charges
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = p_tenant_id
    AND je.account_number LIKE '6%'
    AND t.transaction_date <= p_fiscal_year_end;

  SELECT COALESCE(SUM(je.credit - je.debit), 0) INTO v_total_produits
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = p_tenant_id
    AND je.account_number LIKE '7%'
    AND t.transaction_date <= p_fiscal_year_end;

  -- Inclure classe 8 (HAO)
  -- Charges HAO (81, 83, 85, 87, 89)
  v_total_charges := v_total_charges + COALESCE((
    SELECT SUM(je.debit - je.credit)
    FROM journal_entries je
    JOIN transactions t ON je.transaction_id = t.id
    WHERE t.tenant_id = p_tenant_id
      AND (je.account_number LIKE '81%' OR je.account_number LIKE '83%' OR je.account_number LIKE '85%' OR je.account_number LIKE '87%' OR je.account_number LIKE '89%')
      AND t.transaction_date <= p_fiscal_year_end
  ), 0);

  -- Produits HAO (82, 84, 86, 88)
  v_total_produits := v_total_produits + COALESCE((
    SELECT SUM(je.credit - je.debit)
    FROM journal_entries je
    JOIN transactions t ON je.transaction_id = t.id
    WHERE t.tenant_id = p_tenant_id
      AND (je.account_number LIKE '82%' OR je.account_number LIKE '84%' OR je.account_number LIKE '86%' OR je.account_number LIKE '88%')
      AND t.transaction_date <= p_fiscal_year_end
  ), 0);

  v_resultat := v_total_produits - v_total_charges;

  -- Déterminer le compte résultat (131 bénéfice ou 139 perte)
  IF v_resultat >= 0 THEN
    v_result_account := '131';
  ELSE
    v_result_account := '139';
  END IF;

  -- Créer la transaction de clôture
  INSERT INTO transactions (
    tenant_id, transaction_date, transaction_type, amount, description, reference, journal_code
  ) VALUES (
    p_tenant_id, p_fiscal_year_end, 'cloture', ABS(v_resultat),
    p_description || ' - Résultat: ' || v_resultat || ' FCFA',
    'CLO-' || EXTRACT(YEAR FROM p_fiscal_year_end)::TEXT,
    'CLO'
  ) RETURNING id INTO v_transaction_id;

  -- Solder chaque compte de classe 6 (Débit → Crédit pour solder)
  FOR rec IN
    SELECT je.account_number, SUM(je.debit - je.credit) as solde
    FROM journal_entries je
    JOIN transactions t ON je.transaction_id = t.id
    WHERE t.tenant_id = p_tenant_id
      AND (je.account_number LIKE '6%' OR je.account_number LIKE '81%' OR je.account_number LIKE '83%' OR je.account_number LIKE '85%' OR je.account_number LIKE '87%' OR je.account_number LIKE '89%')
      AND t.transaction_date <= p_fiscal_year_end
    GROUP BY je.account_number
    HAVING SUM(je.debit - je.credit) != 0
  LOOP
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, rec.account_number, 'Solde clôture', 0, rec.solde, 'Clôture exercice - Solde compte ' || rec.account_number);
  END LOOP;

  -- Solder chaque compte de classe 7 (Crédit → Débit pour solder)
  FOR rec IN
    SELECT je.account_number, SUM(je.credit - je.debit) as solde
    FROM journal_entries je
    JOIN transactions t ON je.transaction_id = t.id
    WHERE t.tenant_id = p_tenant_id
      AND (je.account_number LIKE '7%' OR je.account_number LIKE '82%' OR je.account_number LIKE '84%' OR je.account_number LIKE '86%' OR je.account_number LIKE '88%')
      AND t.transaction_date <= p_fiscal_year_end
    GROUP BY je.account_number
    HAVING SUM(je.credit - je.debit) != 0
  LOOP
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, rec.account_number, 'Solde clôture', rec.solde, 0, 'Clôture exercice - Solde compte ' || rec.account_number);
  END LOOP;

  -- Enregistrer le résultat dans le compte 13x
  IF v_resultat >= 0 THEN
    -- Bénéfice : Crédit 131
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '131', 'Résultat net: Bénéfice', 0, v_resultat, 'Résultat de l''exercice');
  ELSE
    -- Perte : Débit 139
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '139', 'Résultat net: Perte', ABS(v_resultat), 0, 'Résultat de l''exercice');
  END IF;

  -- Solder le compte 104 (Exploitant) vers 103 (Capital personnel)
  SELECT COALESCE(SUM(je.debit - je.credit), 0) INTO v_compte104_solde
  FROM journal_entries je
  JOIN transactions t ON je.transaction_id = t.id
  WHERE t.tenant_id = p_tenant_id
    AND je.account_number LIKE '104%'
    AND t.transaction_date <= p_fiscal_year_end;

  IF v_compte104_solde != 0 THEN
    IF v_compte104_solde > 0 THEN
      -- 104 est débiteur → Crédit 104, Débit 103
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '104', 'Compte de l''exploitant', 0, v_compte104_solde, 'Virement 104→103 clôture');
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '103', 'Capital personnel', v_compte104_solde, 0, 'Virement 104→103 clôture');
    ELSE
      -- 104 est créditeur → Débit 104, Crédit 103
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '104', 'Compte de l''exploitant', ABS(v_compte104_solde), 0, 'Virement 104→103 clôture');
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '103', 'Capital personnel', 0, ABS(v_compte104_solde), 'Virement 104→103 clôture');
    END IF;
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- ============================================
-- 2. PROCÉDURE D'AFFECTATION DU RÉSULTAT
-- ============================================
CREATE OR REPLACE FUNCTION public.allocate_result(
  p_tenant_id UUID,
  p_fiscal_year_end DATE,
  p_reserve_legale NUMERIC DEFAULT 0,
  p_autres_reserves NUMERIC DEFAULT 0,
  p_report_nouveau NUMERIC DEFAULT 0,
  p_dividendes NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_resultat NUMERIC;
  v_total_affectation NUMERIC;
BEGIN
  -- Récupérer le résultat de l'exercice
  v_resultat := COALESCE(get_account_balance(p_tenant_id, '131', p_fiscal_year_end), 0)
              - COALESCE(ABS(get_account_balance(p_tenant_id, '139', p_fiscal_year_end)), 0);

  IF v_resultat = 0 THEN
    RAISE EXCEPTION 'Aucun résultat à affecter. Vérifiez que la clôture a été effectuée.';
  END IF;

  -- Vérifier que l'affectation est cohérente
  v_total_affectation := p_reserve_legale + p_autres_reserves + p_report_nouveau + p_dividendes;

  IF ABS(v_total_affectation - ABS(v_resultat)) > 0.01 THEN
    RAISE EXCEPTION 'Le total de l''affectation (%) ne correspond pas au résultat (%)', v_total_affectation, ABS(v_resultat);
  END IF;

  -- Créer la transaction d'affectation
  INSERT INTO transactions (
    tenant_id, transaction_date, transaction_type, amount, description, reference, journal_code
  ) VALUES (
    p_tenant_id, p_fiscal_year_end + INTERVAL '1 day', 'affectation', ABS(v_resultat),
    'Affectation du résultat exercice ' || EXTRACT(YEAR FROM p_fiscal_year_end)::TEXT,
    'AFF-' || EXTRACT(YEAR FROM p_fiscal_year_end)::TEXT,
    'OD'
  ) RETURNING id INTO v_transaction_id;

  -- Solder le compte 13
  IF v_resultat > 0 THEN
    -- Bénéfice : Débit 131
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '131', 'Résultat net: Bénéfice', v_resultat, 0, 'Solde résultat pour affectation');

    -- Affecter aux différents comptes
    IF p_reserve_legale > 0 THEN
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '111', 'Réserve légale', 0, p_reserve_legale, 'Affectation réserve légale');
    END IF;
    IF p_autres_reserves > 0 THEN
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '118', 'Autres réserves', 0, p_autres_reserves, 'Affectation autres réserves');
    END IF;
    IF p_report_nouveau > 0 THEN
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '121', 'Report à nouveau créditeur', 0, p_report_nouveau, 'Affectation report à nouveau');
    END IF;
    IF p_dividendes > 0 THEN
      INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
      VALUES (v_transaction_id, '465', 'Associés, dividendes à payer', 0, p_dividendes, 'Dividendes à distribuer');
    END IF;
  ELSE
    -- Perte : Crédit 139, Débit 129 (report à nouveau débiteur)
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '139', 'Résultat net: Perte', 0, ABS(v_resultat), 'Solde résultat pour affectation');
    INSERT INTO journal_entries (transaction_id, account_number, account_name, debit, credit, description)
    VALUES (v_transaction_id, '129', 'Report à nouveau débiteur', ABS(v_resultat), 0, 'Report de la perte');
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- ============================================
-- 3. CORRIGER LE DOUBLON VENTES
-- ============================================
-- Le trigger generate_journal_entries sur transactions ne doit PAS
-- générer d'écritures pour les types déjà gérés par les triggers spécifiques
-- (recette via create_accounting_entry_on_sale, achat via purchase, salaire via payroll, production)
CREATE OR REPLACE FUNCTION public.generate_journal_entries()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_debit_account TEXT;
  v_debit_name TEXT;
  v_credit_account TEXT;
  v_credit_name TEXT;
BEGIN
  -- IMPORTANT: Ne pas générer d'écritures pour les types déjà gérés
  -- par les triggers spécifiques des modules (ventes, achats, salaires, production)
  -- Ces triggers appellent create_journal_entry() qui crée déjà la transaction ET ses écritures
  IF NEW.transaction_type IN ('recette', 'achat', 'salaire', 'production', 'cout_vente', 'cloture', 'affectation') THEN
    RETURN NEW;
  END IF;

  -- Pour les types restants (depense, vente_locale, vente_export, divers, autre)
  CASE NEW.transaction_type
    WHEN 'vente_locale', 'vente_export' THEN
      v_debit_account := '521'; v_debit_name := 'Banque';
      v_credit_account := '701'; v_credit_name := 'Ventes de marchandises';
    WHEN 'depense' THEN
      v_debit_account := '604'; v_debit_name := 'Achats de services';
      v_credit_account := '521'; v_credit_name := 'Banque';
    WHEN 'divers' THEN
      -- Les écritures diverses sont gérées manuellement via JournalEntryForm
      -- Ne pas générer d'écritures automatiques
      RETURN NEW;
    ELSE
      v_debit_account := '471'; v_debit_name := 'Comptes d''attente';
      v_credit_account := '521'; v_credit_name := 'Banque';
  END CASE;

  -- Écriture au débit
  INSERT INTO public.journal_entries (transaction_id, account_number, account_name, debit, credit, description)
  VALUES (NEW.id, v_debit_account, v_debit_name, NEW.amount, 0, NEW.description);

  -- Écriture au crédit
  INSERT INTO public.journal_entries (transaction_id, account_number, account_name, debit, credit, description)
  VALUES (NEW.id, v_credit_account, v_credit_name, 0, NEW.amount, NEW.description);

  RETURN NEW;
END;
$$;
