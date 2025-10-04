-- Remove the check constraint that prevents tenant_id from being empty
-- This is necessary for the initial signup flow where tenant_id is NULL
-- and will be set after tenant creation

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_tenant_id_not_empty;