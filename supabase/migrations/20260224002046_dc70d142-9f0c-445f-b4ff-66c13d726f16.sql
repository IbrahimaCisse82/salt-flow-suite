
-- Fix: Convert view to security_invoker to respect RLS of the querying user
ALTER VIEW public.budget_commitment_summary SET (security_invoker = on);
