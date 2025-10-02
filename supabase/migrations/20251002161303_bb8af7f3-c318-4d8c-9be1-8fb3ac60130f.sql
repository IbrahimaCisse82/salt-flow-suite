-- Remove the policy that allows non-privileged users to SELECT from employees table
-- Non-privileged users should ONLY access the employees_public view, never the main table
DROP POLICY IF EXISTS "Users can view public employee data" ON public.employees;

-- Ensure the employees_public view enforces RLS of the querying user
ALTER VIEW public.employees_public SET (security_invoker = true);