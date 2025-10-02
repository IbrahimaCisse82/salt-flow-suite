-- Fix clients_safe view security by dropping and recreating with proper RLS
-- This prevents unauthorized access to customer contact information

-- Drop the existing insecure view
DROP VIEW IF EXISTS public.clients_safe;

-- The view will now use the existing secure function get_clients_safe()
-- which already enforces tenant isolation and authentication
-- Recreate view with security invoker to enforce RLS
CREATE VIEW public.clients_safe 
WITH (security_invoker = true)
AS
SELECT * FROM public.get_clients_safe();

-- Grant access to authenticated users only
GRANT SELECT ON public.clients_safe TO authenticated;