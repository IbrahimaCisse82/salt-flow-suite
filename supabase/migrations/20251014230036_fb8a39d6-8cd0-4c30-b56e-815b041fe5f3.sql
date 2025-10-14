-- Remove the profiles_with_roles view as it's flagged by security linter
-- We'll use the get_profiles_with_roles() RPC function directly instead
DROP VIEW IF EXISTS public.profiles_with_roles;