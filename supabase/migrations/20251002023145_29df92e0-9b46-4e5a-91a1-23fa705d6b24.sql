-- URGENT: Fix critical security issue - clients_safe view has overly permissive access
-- Currently ANYONE (even unauthenticated users) can access customer data

-- 1. Revoke ALL access from public and anon roles
REVOKE ALL ON public.clients_safe FROM PUBLIC;
REVOKE ALL ON public.clients_safe FROM anon;
REVOKE ALL ON public.clients_safe FROM authenticated;

-- 2. Recreate the view with proper security settings
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
FROM public.clients
WHERE tenant_id = get_user_tenant_id(auth.uid()); -- CRITICAL: Only show clients from user's tenant

-- 3. Grant ONLY SELECT to authenticated users (no other permissions)
GRANT SELECT ON public.clients_safe TO authenticated;

-- 4. Verify no public access remains
REVOKE ALL ON public.clients_safe FROM PUBLIC;

-- Security Notes:
-- - security_invoker = on: View executes with caller's permissions (respects RLS)
-- - WHERE clause: Extra safety layer - only show tenant's data
-- - Conditional PII: email/phone/address only visible to managers/admins
-- - NO access for anonymous users
-- - ONLY SELECT granted to authenticated users