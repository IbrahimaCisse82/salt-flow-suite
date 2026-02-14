
-- =============================================
-- CORRECTION 1: SEED PLAN COMPTABLE SYSCOHADA POUR TOUS LES TENANTS
-- =============================================

-- Fonction pour initialiser le plan comptable d'un tenant
CREATE OR REPLACE FUNCTION public.seed_chart_of_accounts_for_tenant(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Classe 1: Capitaux propres
  INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
    (p_tenant_id, '101', 'Capital social', 'capitaux', true),
    (p_tenant_id, '103', 'Capital personnel', 'capitaux', true),
    (p_tenant_id, '104', 'Compte de l''exploitant', 'capitaux', true),
    (p_tenant_id, '111', 'Réserve légale', 'capitaux', true),
    (p_tenant_id, '118', 'Autres réserves', 'capitaux', true),
    (p_tenant_id, '121', 'Report à nouveau créditeur', 'capitaux', true),
    (p_tenant_id, '129', 'Report à nouveau débiteur', 'capitaux', true),
    (p_tenant_id, '131', 'Résultat net: Bénéfice', 'capitaux', true),
    (p_tenant_id, '139', 'Résultat net: Perte', 'capitaux', true)
  ON CONFLICT DO NOTHING;

  -- Classe 2: Immobilisations
  INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
    (p_tenant_id, '231', 'Bâtiments', 'actif', true),
    (p_tenant_id, '241', 'Matériel et outillage', 'actif', true),
    (p_tenant_id, '244', 'Matériel de transport', 'actif', true),
    (p_tenant_id, '245', 'Matériel de bureau', 'actif', true),
    (p_tenant_id, '281', 'Amortissements bâtiments', 'actif', true),
    (p_tenant_id, '284', 'Amortissements matériel', 'actif', true)
  ON CONFLICT DO NOTHING;

  -- Classe 3: Stocks
  INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
    (p_tenant_id, '36', 'Produits finis', 'actif', true),
    (p_tenant_id, '31', 'Matières premières', 'actif', true)
  ON CONFLICT DO NOTHING;

  -- Classe 4: Tiers
  INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
    (p_tenant_id, '4011', 'Fournisseurs locaux', 'passif', true),
    (p_tenant_id, '4091', 'Avances et acomptes versés', 'actif', true),
    (p_tenant_id, '4111', 'Clients locaux', 'actif', true),
    (p_tenant_id, '4112', 'Clients export', 'actif', true),
    (p_tenant_id, '4191', 'Avances et acomptes reçus', 'passif', true),
    (p_tenant_id, '4431', 'TVA collectée', 'passif', true),
    (p_tenant_id, '4441', 'État, TVA due', 'passif', true),
    (p_tenant_id, '4449', 'État, crédit de TVA à reporter', 'actif', true),
    (p_tenant_id, '44562', 'TVA déductible sur immobilisations', 'actif', true),
    (p_tenant_id, '44566', 'TVA déductible sur ABS', 'actif', true),
    (p_tenant_id, '465', 'Associés, dividendes à payer', 'passif', true)
  ON CONFLICT DO NOTHING;

  -- Classe 5: Trésorerie
  INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
    (p_tenant_id, '5211', 'Banque principale', 'actif', true),
    (p_tenant_id, '5711', 'Caisse principale', 'actif', true)
  ON CONFLICT DO NOTHING;

  -- Classe 6: Charges
  INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
    (p_tenant_id, '6011', 'Achats de marchandises', 'charge', true),
    (p_tenant_id, '6021', 'Achats de matières premières', 'charge', true),
    (p_tenant_id, '604', 'Achats de services', 'charge', true),
    (p_tenant_id, '605', 'Autres achats', 'charge', true),
    (p_tenant_id, '61', 'Transports', 'charge', true),
    (p_tenant_id, '62', 'Services extérieurs', 'charge', true),
    (p_tenant_id, '63', 'Impôts et taxes', 'charge', true),
    (p_tenant_id, '64', 'Charges de personnel', 'charge', true),
    (p_tenant_id, '65', 'Autres charges', 'charge', true),
    (p_tenant_id, '661', 'Rémunérations du personnel', 'charge', true),
    (p_tenant_id, '681', 'Dotations aux amortissements', 'charge', true)
  ON CONFLICT DO NOTHING;

  -- Classe 7: Produits
  INSERT INTO chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active) VALUES
    (p_tenant_id, '7011', 'Ventes locales', 'produit', true),
    (p_tenant_id, '7012', 'Ventes export', 'produit', true),
    (p_tenant_id, '73', 'Variations des stocks de biens produits', 'produit', true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Appliquer le seed à TOUS les tenants existants
DO $$
DECLARE
  t_id UUID;
BEGIN
  FOR t_id IN SELECT id FROM tenants LOOP
    PERFORM seed_chart_of_accounts_for_tenant(t_id);
  END LOOP;
END;
$$;

-- Ajouter le seed automatique à la création d'un nouveau tenant
CREATE OR REPLACE FUNCTION public.initialize_new_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Initialiser le plan comptable SYSCOHADA
  PERFORM seed_chart_of_accounts_for_tenant(NEW.id);
  
  RAISE NOTICE 'Tenant % initialized with SYSCOHADA chart of accounts', NEW.id;
  RETURN NEW;
END;
$$;

-- =============================================
-- CORRECTION 2: NETTOYAGE DES DONNÉES CORROMPUES
-- =============================================

-- Supprimer les doublons d'écritures (garder la plus ancienne)
DELETE FROM journal_entries
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY transaction_id, account_number, debit, credit 
      ORDER BY created_at ASC
    ) as rn
    FROM journal_entries
  ) sub
  WHERE rn > 1
);

-- Corriger la transaction déséquilibrée 6fc5a471 (vente sans débit client)
-- C'est une vente du tenant b5302442 - il manque le débit 4111
DO $$
DECLARE
  v_tx_id UUID := '6fc5a471-3c2c-469a-9df5-98eeb5a368f0';
  v_account_id UUID;
BEGIN
  -- Vérifier que la transaction existe et est déséquilibrée
  IF EXISTS (
    SELECT 1 FROM journal_entries 
    WHERE transaction_id = v_tx_id
    GROUP BY transaction_id
    HAVING ABS(SUM(debit) - SUM(credit)) > 0.01
  ) THEN
    -- Chercher le compte 4111 du tenant
    SELECT id INTO v_account_id
    FROM chart_of_accounts 
    WHERE tenant_id = 'b5302442-f6c6-493a-a19b-161cf3955acc' 
    AND account_number = '4111' 
    LIMIT 1;
    
    -- Ajouter le débit manquant
    INSERT INTO journal_entries (transaction_id, account_id, account_number, account_name, debit, credit, description)
    VALUES (v_tx_id, v_account_id, '4111', 'Clients locaux', 10000, 0, 'Correction - débit client manquant');
  END IF;
END;
$$;

-- =============================================
-- CORRECTION 3: VERROUILLAGE POST-CLÔTURE
-- =============================================

-- Trigger qui bloque toute écriture sur un exercice clôturé
CREATE OR REPLACE FUNCTION public.prevent_post_closure_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_closure_date DATE;
BEGIN
  -- Vérifier si une clôture existe pour cet exercice
  SELECT MAX(transaction_date) INTO v_closure_date
  FROM transactions
  WHERE tenant_id = NEW.tenant_id
    AND transaction_type = 'cloture';
  
  -- Si une clôture existe et la nouvelle transaction est avant ou à la date de clôture
  IF v_closure_date IS NOT NULL AND NEW.transaction_date <= v_closure_date THEN
    -- Autoriser uniquement les écritures de type clôture et affectation
    IF NEW.transaction_type NOT IN ('cloture', 'affectation', 'liquidation_tva') THEN
      RAISE EXCEPTION 'Impossible de créer une écriture sur un exercice clôturé (clôture au %). Veuillez utiliser une date postérieure.', v_closure_date;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_post_closure
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_post_closure_modification();

-- Bloquer la modification de transactions existantes liées à un exercice clôturé
CREATE OR REPLACE FUNCTION public.prevent_transaction_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_closure_date DATE;
BEGIN
  -- Vérifier si une clôture existe
  SELECT MAX(transaction_date) INTO v_closure_date
  FROM transactions
  WHERE tenant_id = OLD.tenant_id
    AND transaction_type = 'cloture';
  
  IF v_closure_date IS NOT NULL AND OLD.transaction_date <= v_closure_date THEN
    RAISE EXCEPTION 'Impossible de modifier/supprimer une écriture sur un exercice clôturé (clôture au %).', v_closure_date;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_prevent_tx_modification
  BEFORE UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  WHEN (OLD.transaction_type NOT IN ('cloture', 'affectation'))
  EXECUTE FUNCTION prevent_transaction_modification();

-- =============================================
-- CORRECTION 4: PROTECTION SUPPRESSION FACTURE PAYÉE
-- =============================================

CREATE OR REPLACE FUNCTION public.prevent_paid_sale_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Empêcher la suppression/annulation d'une vente ayant des paiements
  IF EXISTS (
    SELECT 1 FROM payments WHERE facture_id = OLD.id AND amount > 0
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer une vente ayant des paiements enregistrés. Veuillez d''abord annuler les paiements.';
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_paid_sale_deletion
  BEFORE DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION prevent_paid_sale_deletion();

-- Protection suppression immobilisation amortie
CREATE OR REPLACE FUNCTION public.prevent_depreciated_asset_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(OLD.total_depreciated, 0) > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer une immobilisation ayant des amortissements comptabilisés (% FCFA amortis).', OLD.total_depreciated;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_depreciated_asset_deletion
  BEFORE DELETE ON public.fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION prevent_depreciated_asset_deletion();
