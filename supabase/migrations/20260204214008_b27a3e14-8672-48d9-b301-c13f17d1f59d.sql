-- Add bassin_type column to bassins table
ALTER TABLE public.bassins 
ADD COLUMN IF NOT EXISTS bassin_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bassins.bassin_type IS 'Type de bassin: Bassin 1, Bassin 2, Bassin 3, Bassin 4, Table Salante';

-- Update status to be consistent with is_active for existing records
-- If is_active is false and status is 'active', set to 'repos'
UPDATE public.bassins
SET status = 'repos', updated_at = now()
WHERE is_active = false AND status = 'active';

-- If is_active is true and status is 'repos', set to 'active'  
UPDATE public.bassins
SET status = 'active', updated_at = now()
WHERE is_active = true AND status = 'repos';