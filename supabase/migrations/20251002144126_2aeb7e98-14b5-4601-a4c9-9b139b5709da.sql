-- Create a view for public employee information (without salary)
CREATE OR REPLACE VIEW public.employees_public AS
SELECT 
  id,
  tenant_id,
  created_at,
  updated_at,
  full_name,
  "position",
  employee_type,
  employee_number,
  phone,
  email,
  is_active,
  hire_date
FROM public.employees;

-- Grant access to the view
GRANT SELECT ON public.employees_public TO authenticated;

-- Allow tenant creation during signup (one-time, for new users)
CREATE POLICY "Users can create tenant during signup" ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND tenant_id IS NOT NULL
  )
);