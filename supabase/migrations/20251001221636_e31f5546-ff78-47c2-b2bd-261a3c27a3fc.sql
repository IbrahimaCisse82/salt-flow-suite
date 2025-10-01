-- Add missing columns to transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS journal_code TEXT,
  ADD COLUMN IF NOT EXISTS campagne_id UUID REFERENCES public.campagnes(id);