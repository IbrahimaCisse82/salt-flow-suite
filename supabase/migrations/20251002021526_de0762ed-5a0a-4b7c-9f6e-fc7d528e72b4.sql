-- Fix security definer views to use SECURITY INVOKER
-- This ensures views respect RLS policies of the querying user

ALTER VIEW public.clients_safe SET (security_invoker = on);
ALTER VIEW public.employees_safe SET (security_invoker = on);

COMMENT ON VIEW public.clients_safe IS 'Secure view that filters PII (email, phone, address) based on user role. Only managers and admins can see sensitive data. Uses SECURITY INVOKER to respect RLS.';
COMMENT ON VIEW public.employees_safe IS 'Secure view that filters PII (email, phone) based on user role. Only managers and admins can see sensitive data. Uses SECURITY INVOKER to respect RLS.';