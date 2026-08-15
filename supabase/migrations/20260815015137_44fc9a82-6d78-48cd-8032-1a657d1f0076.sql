
ALTER TABLE public.payroll_payments ADD COLUMN IF NOT EXISTS receiver_signature text;
ALTER TABLE public.payroll_payments ADD COLUMN IF NOT EXISTS processed_by uuid;
