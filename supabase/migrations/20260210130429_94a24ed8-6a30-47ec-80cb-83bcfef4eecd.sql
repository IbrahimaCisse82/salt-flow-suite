
-- Ajouter les colonnes pour persister l'état des phases sur la campagne
ALTER TABLE public.campagnes 
ADD COLUMN IF NOT EXISTS active_phase_index integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS phase_end_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;
