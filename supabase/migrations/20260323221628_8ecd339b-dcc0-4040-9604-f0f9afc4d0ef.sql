
-- 1. Drop the vulnerable public INSERT policy
DROP POLICY IF EXISTS "Users can create tenant during signup" ON tenants;

-- 2. Drop any other INSERT policies on tenants to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;

-- 3. Recreate with authenticated-only restriction
CREATE POLICY "Authenticated users can create tenants" ON tenants
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tenant_id IS NOT NULL
  )
);
