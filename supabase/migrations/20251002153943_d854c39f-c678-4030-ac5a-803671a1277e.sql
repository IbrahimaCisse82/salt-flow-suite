-- FIX: Remove overly permissive profile viewing policy
-- This policy name is misleading and should be replaced with more specific policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles with restrictions" ON profiles;

-- Ensure the restrictive policies exist
-- (These may already exist, so we use IF NOT EXISTS pattern)

-- Policy 1: Users can view their own full profile (including email/phone)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own full profile'
  ) THEN
    CREATE POLICY "Users can view their own full profile"
      ON profiles
      FOR SELECT
      USING (id = auth.uid());
  END IF;
END $$;

-- Policy 2: Managers and admins can view all profiles in their tenant
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Managers can view all profiles in tenant'
  ) THEN
    CREATE POLICY "Managers can view all profiles in tenant"
      ON profiles
      FOR SELECT
      USING (
        is_manager_or_admin(auth.uid()) 
        AND tenant_id = get_user_tenant_id(auth.uid())
      );
  END IF;
END $$;

-- Add documentation comment
COMMENT ON TABLE profiles IS 
  'User profiles with PII protection. Regular users can only view their own email/phone. 
   Managers and admins can view all profiles in their tenant. 
   For non-PII profile data, use the safe_profiles view instead.';

-- Verify the final policy state
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
  AND cmd = 'SELECT'
ORDER BY policyname;