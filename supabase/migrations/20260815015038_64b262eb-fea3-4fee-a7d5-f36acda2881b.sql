
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS last_purchase_price numeric NOT NULL DEFAULT 0;

ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'partial';

ALTER TABLE public.scheduled_reports ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.scheduled_reports ADD COLUMN IF NOT EXISTS last_run_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quality_tests_tested_by_fkey')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='quality_tests' AND column_name='tested_by') THEN
    ALTER TABLE public.quality_tests
      ADD CONSTRAINT quality_tests_tested_by_fkey
      FOREIGN KEY (tested_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;
