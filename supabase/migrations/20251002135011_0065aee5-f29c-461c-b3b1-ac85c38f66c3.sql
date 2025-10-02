-- Remove the clients_safe view as it cannot have RLS policies
-- Instead, applications should use the get_clients_safe() function directly
-- which already has SECURITY DEFINER and proper tenant isolation

DROP VIEW IF EXISTS public.clients_safe;