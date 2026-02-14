
-- Fix: Le trigger generate_journal_entries exclut 'salaire' car l'ancien trigger dédié
-- s'en chargeait. Maintenant que le frontend crée directement la transaction,
-- il faut que generate_journal_entries génère les écritures 661/521 pour les salaires.

CREATE OR REPLACE FUNCTION public.generate_journal_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_debit_account TEXT;
  v_debit_name TEXT;
  v_credit_account TEXT;
  v_credit_name TEXT;
BEGIN
  -- Ne pas générer d'écritures pour les types gérés par des triggers dédiés
  -- qui appellent create_journal_entry() (production, ventes)
  -- NB: 'achat' et 'salaire' sont désormais gérés par le frontend qui crée
  -- directement des transactions → on les traite ici pour les écritures journal
  IF NEW.transaction_type IN ('recette', 'production', 'cout_vente', 'cloture', 'affectation') THEN
    RETURN NEW;
  END IF;

  CASE NEW.transaction_type
    WHEN 'salaire' THEN
      v_debit_account := '661'; v_debit_name := 'Rémunérations du personnel';
      v_credit_account := '521'; v_credit_name := 'Banque';
    WHEN 'achat' THEN
      v_debit_account := '601'; v_debit_name := 'Achats de marchandises';
      v_credit_account := '521'; v_credit_name := 'Banque';
    WHEN 'vente_locale', 'vente_export' THEN
      v_debit_account := '521'; v_debit_name := 'Banque';
      v_credit_account := '701'; v_credit_name := 'Ventes de marchandises';
    WHEN 'depense' THEN
      v_debit_account := '604'; v_debit_name := 'Achats de services';
      v_credit_account := '521'; v_credit_name := 'Banque';
    WHEN 'divers' THEN
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
$function$;
