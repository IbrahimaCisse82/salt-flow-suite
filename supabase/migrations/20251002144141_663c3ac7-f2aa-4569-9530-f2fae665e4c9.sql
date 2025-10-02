-- Drop the previous view
DROP VIEW IF EXISTS public.employees_public;

-- Recreate the view with SECURITY INVOKER to respect caller's permissions
CREATE OR REPLACE VIEW public.employees_public
WITH (security_invoker = true) AS
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

-- Enable RLS on the view
ALTER VIEW public.employees_public SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON public.employees_public TO authenticated;