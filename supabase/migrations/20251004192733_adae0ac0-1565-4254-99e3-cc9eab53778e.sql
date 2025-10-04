-- Allow tenant_id to be null during initial signup
-- It will be set later by the application after tenant creation
ALTER TABLE public.profiles 
ALTER COLUMN tenant_id DROP NOT NULL;