-- Ajouter une colonne status pour gérer les états: active, repos, maintenance
ALTER TABLE public.bassins 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'repos' CHECK (status IN ('active', 'repos', 'maintenance'));

-- Migrer les données existantes: is_active = true -> 'active', sinon 'repos'
UPDATE public.bassins 
SET status = CASE WHEN is_active = true THEN 'active' ELSE 'repos' END
WHERE status IS NULL OR status = 'repos';

-- Index pour améliorer les performances de filtrage par status
CREATE INDEX IF NOT EXISTS idx_bassins_status ON public.bassins(status);