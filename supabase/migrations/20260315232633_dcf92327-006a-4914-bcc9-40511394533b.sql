-- 1. Recreate orphaned_profiles view with security_invoker
DROP VIEW IF EXISTS public.orphaned_profiles;
CREATE VIEW public.orphaned_profiles
WITH (security_invoker = on)
AS
SELECT p.id,
    p.email,
    p.full_name,
    p.tenant_id,
    ur.role
   FROM profiles p
     LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.tenant_id IS NULL AND has_role(auth.uid(), 'admin'::app_role);

-- 2. Restrict financial_reports SELECT to admin/gerant/comptable
DROP POLICY IF EXISTS "Users can view financial reports" ON public.financial_reports;
CREATE POLICY "Users can view financial reports"
ON public.financial_reports
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

-- 3. Restrict scheduled_reports SELECT to admin/gerant
DROP POLICY IF EXISTS "Users can view scheduled reports" ON public.scheduled_reports;
CREATE POLICY "Users can view scheduled reports"
ON public.scheduled_reports
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text])
);