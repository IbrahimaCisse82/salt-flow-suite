
-- Fonction trigger pour générer automatiquement les écritures de journal
CREATE OR REPLACE FUNCTION public.generate_journal_entries()
RETURNS TRIGGER AS $$
DECLARE
  v_debit_account TEXT;
  v_debit_name TEXT;
  v_credit_account TEXT;
  v_credit_name TEXT;
BEGIN
  -- Déterminer les comptes selon le type de transaction (SYSCOHADA)
  CASE NEW.transaction_type
    WHEN 'vente_locale', 'vente_export', 'recette' THEN
      v_debit_account := '521'; v_debit_name := 'Banque';
      v_credit_account := '701'; v_credit_name := 'Ventes de marchandises';
    WHEN 'achat' THEN
      v_debit_account := '601'; v_debit_name := 'Achats de matières premières';
      v_credit_account := '521'; v_credit_name := 'Banque';
    WHEN 'depense' THEN
      v_debit_account := '604'; v_debit_name := 'Achats de services';
      v_credit_account := '521'; v_credit_name := 'Banque';
    WHEN 'salaire' THEN
      v_debit_account := '661'; v_debit_name := 'Rémunérations du personnel';
      v_credit_account := '521'; v_credit_name := 'Banque';
    WHEN 'production' THEN
      v_debit_account := '35'; v_debit_name := 'Stocks de produits finis';
      v_credit_account := '72'; v_credit_name := 'Production stockée';
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger
CREATE TRIGGER trg_generate_journal_entries
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.generate_journal_entries();

-- Rétro-remplir les écritures pour les transactions existantes
INSERT INTO public.journal_entries (transaction_id, account_number, account_name, debit, credit, description)
SELECT 
  t.id,
  CASE t.transaction_type
    WHEN 'vente_locale' THEN '521' WHEN 'vente_export' THEN '521' WHEN 'recette' THEN '521'
    WHEN 'achat' THEN '601' WHEN 'depense' THEN '604' WHEN 'salaire' THEN '661'
    WHEN 'production' THEN '35' ELSE '471'
  END,
  CASE t.transaction_type
    WHEN 'vente_locale' THEN 'Banque' WHEN 'vente_export' THEN 'Banque' WHEN 'recette' THEN 'Banque'
    WHEN 'achat' THEN 'Achats de matières premières' WHEN 'depense' THEN 'Achats de services'
    WHEN 'salaire' THEN 'Rémunérations du personnel' WHEN 'production' THEN 'Stocks de produits finis'
    ELSE 'Comptes d''attente'
  END,
  t.amount, 0, t.description
FROM public.transactions t
WHERE NOT EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.transaction_id = t.id);

INSERT INTO public.journal_entries (transaction_id, account_number, account_name, debit, credit, description)
SELECT 
  t.id,
  CASE t.transaction_type
    WHEN 'vente_locale' THEN '701' WHEN 'vente_export' THEN '701' WHEN 'recette' THEN '701'
    WHEN 'achat' THEN '521' WHEN 'depense' THEN '521' WHEN 'salaire' THEN '521'
    WHEN 'production' THEN '72' ELSE '521'
  END,
  CASE t.transaction_type
    WHEN 'vente_locale' THEN 'Ventes de marchandises' WHEN 'vente_export' THEN 'Ventes de marchandises'
    WHEN 'recette' THEN 'Ventes de marchandises' WHEN 'achat' THEN 'Banque' WHEN 'depense' THEN 'Banque'
    WHEN 'salaire' THEN 'Banque' WHEN 'production' THEN 'Production stockée' ELSE 'Banque'
  END,
  0, t.amount, t.description
FROM public.transactions t
WHERE (SELECT count(*) FROM public.journal_entries je WHERE je.transaction_id = t.id) < 2;
