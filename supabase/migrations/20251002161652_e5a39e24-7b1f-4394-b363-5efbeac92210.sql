-- ============================================================
-- RESTRICTION DES ACCÈS AU PERSONNEL (EMPLOYEES & DAILY_WORKERS)
-- Seuls les gérants et admins peuvent voir et manipuler ces données
-- ============================================================

-- 1. EMPLOYEES TABLE - Retirer l'accès comptable, limiter aux gérants uniquement
DROP POLICY IF EXISTS "Managers can view all employee data" ON public.employees;
DROP POLICY IF EXISTS "Managers can manage employees" ON public.employees;

-- Nouvelle politique: Seuls gérants et admins peuvent tout faire
CREATE POLICY "Only managers can manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text])
  AND tenant_id = get_user_tenant_id(auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text])
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- 2. EMPLOYEES_PUBLIC VIEW - Retirer complètement l'accès
-- Cette vue ne doit plus être utilisée puisque seuls les gérants accèdent aux données
DROP VIEW IF EXISTS public.employees_public CASCADE;

-- 3. DAILY_WORKERS TABLE - Restreindre aux gérants uniquement
DROP POLICY IF EXISTS "Users can view daily workers in their tenant" ON public.daily_workers;
DROP POLICY IF EXISTS "Managers can manage daily workers" ON public.daily_workers;

CREATE POLICY "Only managers can manage daily workers"
ON public.daily_workers
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text])
  AND tenant_id = get_user_tenant_id(auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text])
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- 4. S'assurer que les utilisateurs "production" ont bien accès aux équipes
-- (les policies existantes pour teams et team_members sont déjà correctes)