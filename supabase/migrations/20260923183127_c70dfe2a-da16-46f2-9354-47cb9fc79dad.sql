ALTER TABLE public.quality_tests ADD COLUMN IF NOT EXISTS quality_score numeric CHECK (quality_score BETWEEN 0 AND 100);
NOTIFY pgrst, 'reload schema';