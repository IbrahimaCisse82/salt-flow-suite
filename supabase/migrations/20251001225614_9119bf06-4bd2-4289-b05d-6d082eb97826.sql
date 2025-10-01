-- Politique pour permettre aux utilisateurs authentifiés de créer un tenant lors de l'inscription
CREATE POLICY "Users can create their own tenant during signup"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique pour permettre aux utilisateurs de mettre à jour leur propre tenant
CREATE POLICY "Users can update their own tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (id = get_user_tenant_id(auth.uid()));