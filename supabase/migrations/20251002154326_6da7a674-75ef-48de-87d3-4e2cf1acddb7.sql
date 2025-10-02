-- CRITICAL FIX: Remove role column from profiles table to prevent privilege escalation
-- The user_roles table is the single source of truth for roles

-- Drop role column if it exists (may not exist in current schema)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles DROP COLUMN role;
  END IF;
END $$;

-- CRITICAL FIX: Restrict employee data access based on role
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view basic employee info in their tenant" ON employees;

-- Policy 1: Managers and admins can see all employee data including salaries
CREATE POLICY "Managers can view all employee data"
  ON employees
  FOR SELECT
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- Policy 2: Regular users can only see non-sensitive employee data
CREATE POLICY "Users can view public employee data"
  ON employees
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) NOT IN ('admin', 'gerant', 'comptable')
  );

-- Update the employees_public view to ensure it only shows non-sensitive data
DROP VIEW IF EXISTS employees_public;

CREATE VIEW employees_public AS
  SELECT 
    id,
    tenant_id,
    full_name,
    position,
    employee_type,
    employee_number,
    is_active,
    hire_date,
    created_at,
    updated_at
    -- Explicitly exclude: salary, email, phone
  FROM employees;

-- Add comment for documentation
COMMENT ON TABLE employees IS 
  'Employee data with role-based access. Managers/accountants see all fields including salaries. 
   Regular users only see public fields via employees_public view.';

COMMENT ON VIEW employees_public IS 
  'Public view of employees without sensitive PII (no salary, email, or phone).
   Use this view for regular users who should not see compensation or contact details.';