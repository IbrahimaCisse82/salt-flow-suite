-- Vérifier et ajuster les RLS policies pour expense_types
-- Permettre aux utilisateurs de voir les types de dépenses de leur tenant

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view expense types" ON expense_types;
DROP POLICY IF EXISTS "Managers can insert expense types" ON expense_types;
DROP POLICY IF EXISTS "Managers can update expense types" ON expense_types;
DROP POLICY IF EXISTS "Managers can delete expense types" ON expense_types;

-- Créer les nouvelles policies
CREATE POLICY "Users can view expense types"
ON expense_types FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can insert expense types"
ON expense_types FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);

CREATE POLICY "Managers can update expense types"
ON expense_types FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant']));

CREATE POLICY "Managers can delete expense types"
ON expense_types FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant']));