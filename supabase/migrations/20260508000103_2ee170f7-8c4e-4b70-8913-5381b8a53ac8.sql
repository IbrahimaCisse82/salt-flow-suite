-- Add missing columns
ALTER TABLE public.bassins ADD COLUMN IF NOT EXISTS bassin_type TEXT;
ALTER TABLE public.bassins ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Extend enum bassin_status with frontend values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'bassin_status'::regtype AND enumlabel = 'active') THEN
    ALTER TYPE bassin_status ADD VALUE 'active';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'bassin_status'::regtype AND enumlabel = 'repos') THEN
    ALTER TYPE bassin_status ADD VALUE 'repos';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_bassins_deleted_at ON public.bassins(deleted_at);