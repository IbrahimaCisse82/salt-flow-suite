-- SECURITY FIX: Secure profiles_public view with security_invoker
-- Views cannot have RLS policies directly, but security_invoker makes them use the caller's permissions

-- Drop and recreate the view with security_invoker = true
-- This ensures the view respects the RLS policies of the underlying 'profiles' table
DROP VIEW IF EXISTS profiles_public;

CREATE VIEW profiles_public 
WITH (security_invoker = true)
AS
  SELECT 
    id,
    tenant_id,
    full_name,
    avatar_url,
    created_at
  FROM profiles;

-- Add documentation
COMMENT ON VIEW profiles_public IS 
  'Public (non-PII) profile view showing only name and avatar.
   This view uses security_invoker=true, which means it inherits RLS policies from the profiles table.
   Users can only see profiles they are authorized to view per the profiles table RLS policies.
   Use this view when you need basic profile information without email/phone.';

-- Verify the view is properly secured
-- The view will enforce these policies from the profiles table:
-- 1. Users can view their own full profile
-- 2. Managers can view all profiles in tenant