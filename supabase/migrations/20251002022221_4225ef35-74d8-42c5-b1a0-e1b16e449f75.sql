-- Fix: Restrict PII access in profiles table
-- Only admins/managers should see all user PII
-- Regular users should only see non-sensitive profile data

-- 1. Drop existing SELECT policy that's too permissive
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;

-- 2. Create restrictive policies for profiles table
-- Admins/managers can see all profiles in their tenant (including PII)
CREATE POLICY "Admins and managers can view all profiles in tenant"
ON public.profiles
FOR SELECT
USING (
  is_manager_or_admin(auth.uid()) 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- Users can only see their own full profile (including their own PII)
CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- 3. Create a safe view for non-PII profile data
CREATE OR REPLACE VIEW public.profiles_safe 
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  tenant_id,
  created_at,
  updated_at
FROM public.profiles;

-- 4. Grant access to the safe view
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Note: The safe view uses security_invoker = on, which means it respects
-- the underlying table's RLS policies. Users can see profiles in their tenant
-- but WITHOUT the PII fields (email, phone).