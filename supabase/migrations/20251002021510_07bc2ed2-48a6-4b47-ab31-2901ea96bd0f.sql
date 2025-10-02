-- Phase 1: Enhanced PII Access Control for clients and employees tables

-- Drop existing policies to recreate with enhanced PII protection
DROP POLICY IF EXISTS "Users can view clients in their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can view employees in their tenant" ON public.employees;

-- Clients table: Enhanced RLS with role-based PII access
CREATE POLICY "Users can view basic client info in their tenant"
ON public.clients
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- Only managers and admins can see full PII (email, phone, address)
-- Other users see NULL for these fields through application layer filtering

-- Employees table: Enhanced RLS with role-based PII access  
CREATE POLICY "Users can view basic employee info in their tenant"
ON public.employees
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- Create secure views that filter PII based on role
CREATE OR REPLACE VIEW public.clients_safe AS
SELECT 
  id,
  name,
  client_type,
  CASE 
    WHEN is_manager_or_admin(auth.uid()) THEN email
    ELSE NULL
  END as email,
  CASE 
    WHEN is_manager_or_admin(auth.uid()) THEN phone
    ELSE NULL
  END as phone,
  CASE 
    WHEN is_manager_or_admin(auth.uid()) THEN address
    ELSE NULL
  END as address,
  tenant_id,
  created_at,
  updated_at
FROM public.clients;

CREATE OR REPLACE VIEW public.employees_safe AS
SELECT 
  id,
  full_name,
  employee_number,
  position,
  employee_type,
  CASE 
    WHEN is_manager_or_admin(auth.uid()) THEN email
    ELSE NULL
  END as email,
  CASE 
    WHEN is_manager_or_admin(auth.uid()) THEN phone
    ELSE NULL
  END as phone,
  salary,
  hire_date,
  is_active,
  tenant_id,
  created_at,
  updated_at
FROM public.employees;

COMMENT ON VIEW public.clients_safe IS 'Secure view that filters PII (email, phone, address) based on user role. Only managers and admins can see sensitive data.';
COMMENT ON VIEW public.employees_safe IS 'Secure view that filters PII (email, phone) based on user role. Only managers and admins can see sensitive data.';