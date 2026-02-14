-- Fix: make bassin code unique per tenant, not globally
ALTER TABLE public.bassins DROP CONSTRAINT bassins_code_key;
ALTER TABLE public.bassins ADD CONSTRAINT bassins_tenant_code_unique UNIQUE (tenant_id, code);
