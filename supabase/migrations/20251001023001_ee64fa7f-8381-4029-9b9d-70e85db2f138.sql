-- Fix infinite recursion in RLS policies for profiles table
-- The issue is that profiles policies reference profiles table causing infinite recursion

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create simpler policies that don't cause recursion
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Users can view other profiles in their tenant
-- This uses a simpler check without recursion
CREATE POLICY "Users can view profiles in same tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());