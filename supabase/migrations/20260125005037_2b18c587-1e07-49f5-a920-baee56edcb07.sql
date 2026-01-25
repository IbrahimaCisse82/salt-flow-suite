-- Ajouter les colonnes manquantes à la table transactions si elles n'existent pas
-- Ces colonnes sont nécessaires pour une bonne gestion comptable

DO $$ 
BEGIN
  -- Ajouter journal_code si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'journal_code'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN journal_code TEXT;
  END IF;
  
  -- Ajouter campagne_id si n'existe pas  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'campagne_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN campagne_id UUID REFERENCES public.campagnes(id);
  END IF;
  
  -- Ajouter campagne_phase si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'campagne_phase'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN campagne_phase TEXT;
  END IF;
  
  -- Ajouter account_id si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN account_id UUID REFERENCES public.accounts(id);
  END IF;
END $$;

-- Insérer les transactions de solde initial pour les comptes existants avec solde > 0
INSERT INTO public.transactions (
  tenant_id,
  account_id,
  transaction_type,
  transaction_date,
  amount,
  description,
  reference,
  notes
)
SELECT 
  a.tenant_id,
  a.id,
  'recette',
  CURRENT_DATE,
  a.balance,
  'Solde initial - ' || a.account_name,
  'OUV' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '001',
  'Solde d''ouverture du compte ' || a.account_type
FROM public.accounts a
WHERE a.balance > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.account_id = a.id 
      AND t.description LIKE 'Solde initial%'
  );