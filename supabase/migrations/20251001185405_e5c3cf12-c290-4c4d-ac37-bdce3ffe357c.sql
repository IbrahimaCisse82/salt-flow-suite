-- Ajouter une politique pour permettre aux gérants de mettre à jour leur tenant
CREATE POLICY "Gerant can update their tenant"
ON tenants
FOR UPDATE
USING (
  id = current_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'gerant'::user_role
  )
)
WITH CHECK (
  id = current_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'gerant'::user_role
  )
);