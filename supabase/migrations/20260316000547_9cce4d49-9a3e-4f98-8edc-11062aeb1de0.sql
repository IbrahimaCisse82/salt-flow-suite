-- 1. employees: restrict SELECT to admin, gerant (+ production for team management)
DROP POLICY IF EXISTS "Tenant users can view employees" ON public.employees;
CREATE POLICY "Authorized roles can view employees" ON public.employees
FOR SELECT TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production')
);

-- 2. fixed_assets: replace ALL policy with granular per-command policies
DROP POLICY IF EXISTS "Tenant isolation for fixed_assets" ON public.fixed_assets;
CREATE POLICY "Authorized roles can view fixed assets" ON public.fixed_assets
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'));
CREATE POLICY "Authorized roles can insert fixed assets" ON public.fixed_assets
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'));
CREATE POLICY "Authorized roles can update fixed assets" ON public.fixed_assets
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'));
CREATE POLICY "Managers can delete fixed assets" ON public.fixed_assets
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- 3. depreciation_schedule: same treatment
DROP POLICY IF EXISTS "Tenant isolation for depreciation_schedule" ON public.depreciation_schedule;
CREATE POLICY "Authorized roles can view depreciation" ON public.depreciation_schedule
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'));
CREATE POLICY "Authorized roles can insert depreciation" ON public.depreciation_schedule
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'));
CREATE POLICY "Authorized roles can update depreciation" ON public.depreciation_schedule
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'));
CREATE POLICY "Managers can delete depreciation" ON public.depreciation_schedule
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- 4. ledger_audit_log: restrict SELECT to accounting roles
DROP POLICY IF EXISTS "Tenant users can view audit log" ON public.ledger_audit_log;
CREATE POLICY "Authorized roles can view audit log" ON public.ledger_audit_log
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'));