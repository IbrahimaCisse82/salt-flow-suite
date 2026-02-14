
-- ============================================================
-- P0 FIX: RLS gaps on chart_of_accounts and payments
-- ============================================================

-- CHART_OF_ACCOUNTS: INSERT
DROP POLICY IF EXISTS "Admins can insert chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "Admins can insert chart of accounts" ON public.chart_of_accounts
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- CHART_OF_ACCOUNTS: UPDATE
DROP POLICY IF EXISTS "Admins can update chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "Admins can update chart of accounts" ON public.chart_of_accounts
FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- CHART_OF_ACCOUNTS: DELETE
DROP POLICY IF EXISTS "Admins can delete chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "Admins can delete chart of accounts" ON public.chart_of_accounts
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- PAYMENTS: UPDATE
DROP POLICY IF EXISTS "Managers can update payments" ON public.payments;
CREATE POLICY "Managers can update payments" ON public.payments
FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

-- PAYMENTS: DELETE
DROP POLICY IF EXISTS "Managers can delete payments" ON public.payments;
CREATE POLICY "Managers can delete payments" ON public.payments
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);
