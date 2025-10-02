-- Remove insecure views that cannot have RLS policies
-- Applications should use the security definer functions instead:
-- - get_employees_safe() for employee data
-- - get_profiles_safe() for profile data
-- These functions have SECURITY DEFINER and proper tenant isolation

DROP VIEW IF EXISTS public.employees_safe;
DROP VIEW IF EXISTS public.profiles_safe;