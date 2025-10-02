-- Fix: Secure clients_safe view and clean up duplicate policies

-- 1. Drop duplicate/overlapping SELECT policies on clients table
DROP POLICY IF EXISTS "Users can view basic client info in their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients from their tenant only" ON public.clients;

-- 2. Create single, clear SELECT policy for clients table
-- Only authenticated users in the same tenant can view clients
CREATE POLICY "Authenticated users can view clients in their tenant"
ON public.clients
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 3. Recreate the clients_safe view with security_invoker = on
-- This ensures the view respects RLS policies from the underlying clients table
DROP VIEW IF EXISTS public.clients_safe;

CREATE VIEW public.clients_safe 
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  client_type,
  CASE
    WHEN is_manager_or_admin(auth.uid()) THEN email
    ELSE NULL
  END AS email,
  CASE
    WHEN is_manager_or_admin(auth.uid()) THEN phone
    ELSE NULL
  END AS phone,
  CASE
    WHEN is_manager_or_admin(auth.uid()) THEN address
    ELSE NULL
  END AS address,
  tenant_id,
  created_at,
  updated_at
FROM public.clients;

-- 4. Grant SELECT permission only to authenticated users
GRANT SELECT ON public.clients_safe TO authenticated;

-- Note: The view now:
-- - Uses security_invoker = on (respects the caller's RLS policies)
-- - Only shows PII (email, phone, address) to managers/admins
-- - Is accessible only to authenticated users
-- - Respects tenant isolation through the underlying table's RLS