
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS last_purchase_date date;

ALTER TABLE public.quality_tests ADD COLUMN IF NOT EXISTS quality_status public.quality_status NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quality_tests_production_record_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='quality_tests' AND column_name='production_record_id'
  ) THEN
    ALTER TABLE public.quality_tests
      ADD CONSTRAINT quality_tests_production_record_id_fkey
      FOREIGN KEY (production_record_id) REFERENCES public.production_records(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.scheduled_reports ADD COLUMN IF NOT EXISTS schedule_time time NOT NULL DEFAULT '08:00';
ALTER TABLE public.scheduled_reports ADD COLUMN IF NOT EXISTS start_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.scheduled_reports ADD COLUMN IF NOT EXISTS recipient_emails text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.sale_items ALTER COLUMN description DROP NOT NULL;
