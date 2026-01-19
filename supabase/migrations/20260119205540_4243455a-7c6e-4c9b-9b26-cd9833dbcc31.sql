-- Optimisation RLS expense_types: utiliser (SELECT auth.uid()) au lieu de auth.uid()
-- Cela évite la réévaluation pour chaque ligne

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Managers can insert expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Managers can update expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Managers can delete expense types" ON public.expense_types;

-- Recréer avec (SELECT ...) wrapper pour optimisation
CREATE POLICY "Users can view expense types" ON public.expense_types
  FOR SELECT
  USING (tenant_id = (SELECT get_user_tenant_id((SELECT auth.uid()))));

CREATE POLICY "Managers can insert expense types" ON public.expense_types
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT get_user_tenant_id((SELECT auth.uid())))
    AND (SELECT is_manager_or_admin((SELECT auth.uid())))
  );

CREATE POLICY "Managers can update expense types" ON public.expense_types
  FOR UPDATE
  USING (
    tenant_id = (SELECT get_user_tenant_id((SELECT auth.uid())))
    AND (SELECT is_manager_or_admin((SELECT auth.uid())))
  );

CREATE POLICY "Managers can delete expense types" ON public.expense_types
  FOR DELETE
  USING (
    tenant_id = (SELECT get_user_tenant_id((SELECT auth.uid())))
    AND (SELECT is_manager_or_admin((SELECT auth.uid())))
  );