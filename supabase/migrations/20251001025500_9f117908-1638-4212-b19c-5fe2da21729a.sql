-- Add journal_code column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS journal_code text;

-- Add comment to explain journal codes
COMMENT ON COLUMN public.transactions.journal_code IS 'Journal code: ACH (Achats/Dépenses), VTE (Ventes), OD (Opérations Diverses - Divers et Virements)';