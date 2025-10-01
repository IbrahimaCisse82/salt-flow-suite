-- ============================================
-- FIX: RLS Infinite Recursion on profiles table
-- ============================================

-- The issue: current_tenant_id() queries profiles table, which has RLS,
-- causing infinite recursion when used in profiles policies.

-- Solution: Create security definer helper functions, then update policies

-- 1. CREATE new security definer function to get tenant_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
BEGIN
  -- This bypasses RLS because it's SECURITY DEFINER
  SELECT tenant_id INTO _tenant_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  RETURN _tenant_id;
END;
$$;

-- 2. CREATE security definer function to check if user has specific role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role;
BEGIN
  -- This bypasses RLS because it's SECURITY DEFINER
  SELECT role INTO _role
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  RETURN _role;
END;
$$;

-- 3. CREATE helper function to check if user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role;
BEGIN
  SELECT role INTO _role
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  RETURN _role IN ('admin', 'gerant');
END;
$$;

-- 4. UPDATE current_tenant_id to use the new helper (maintains compatibility)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_tenant_id(auth.uid())
$$;

-- 5. DROP and recreate problematic policies on profiles table
DROP POLICY IF EXISTS "Users can view same tenant profiles (limited)" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view full tenant profiles" ON public.profiles;

-- 6. CREATE new non-recursive policies

-- Policy: Users can view LIMITED info of same-tenant users (NO PII)
CREATE POLICY "Users can view same tenant profiles (limited)"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_tenant_id(auth.uid()) = tenant_id
  AND id != auth.uid()
);

-- Policy: Admins and Gerants can view full profiles in their scope
CREATE POLICY "Managers can view full tenant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_manager_or_admin(auth.uid())
  AND (
    get_user_role(auth.uid()) = 'admin'
    OR get_user_tenant_id(auth.uid()) = tenant_id
  )
);

-- 7. GRANT EXECUTE permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_or_admin(uuid) TO authenticated;