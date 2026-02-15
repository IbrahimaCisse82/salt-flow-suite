-- Add is_active column to profiles for user-level deactivation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Create a security definer function to check if user and tenant are active
-- This avoids RLS recursion and can be used in auth hooks
CREATE OR REPLACE FUNCTION public.check_user_active(p_user_id uuid)
RETURNS TABLE(user_active boolean, tenant_active boolean, tenant_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(p.is_active, true) as user_active,
    COALESCE(t.is_active, true) as tenant_active,
    t.name as tenant_name
  FROM public.profiles p
  LEFT JOIN public.tenants t ON t.id = p.tenant_id
  WHERE p.id = p_user_id;
$$;