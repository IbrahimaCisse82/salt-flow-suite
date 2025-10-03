-- Fix payments table RLS policy to match business logic
-- Only managers and admins should be able to create payments

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;

-- Create restrictive policy: only managers can create payments
CREATE POLICY "Managers can create payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  (tenant_id = get_user_tenant_id(auth.uid())) 
  AND (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text]))
);

-- Verify all payments policies are now correct:
-- 1. SELECT: Authorized roles (admin, gerant, commercial, comptable) ✓ Already exists
-- 2. INSERT: Only managers (admin, gerant) ✓ Just created
-- 3. UPDATE/DELETE: Already covered by "Managers can manage payments" ✓