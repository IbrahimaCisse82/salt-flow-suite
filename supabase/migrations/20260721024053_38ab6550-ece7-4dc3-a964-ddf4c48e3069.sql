
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS ninea text,
  ADD COLUMN IF NOT EXISTS rccm text,
  ADD COLUMN IF NOT EXISTS onboarding_step text;
