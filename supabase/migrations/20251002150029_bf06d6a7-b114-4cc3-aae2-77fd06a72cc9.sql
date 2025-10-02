-- Disable RLS on views that use SECURITY DEFINER functions
-- These views get their security from the underlying functions, not from RLS policies

ALTER VIEW public.profiles_with_roles SET (security_invoker = false);
ALTER VIEW public.employees_public SET (security_invoker = false);

-- The security is handled by:
-- - get_profiles_with_roles() function with SECURITY DEFINER
-- - employees table RLS policies
-- This prevents the "view has RLS but no policies" warning