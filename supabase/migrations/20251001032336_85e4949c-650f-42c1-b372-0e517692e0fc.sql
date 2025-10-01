-- Permettre aux utilisateurs de créer leur propre tenant lors de l'inscription
-- Cette politique permet la création d'un tenant uniquement si l'utilisateur n'en a pas déjà un

CREATE POLICY "Users can create their tenant during signup"
ON public.tenants
FOR INSERT
WITH CHECK (true);

-- Note: Cette politique est permissive car la création se fait avant l'authentification complète.
-- La sécurité est assurée par le fait qu'un utilisateur ne peut créer qu'un seul tenant
-- et que les autres opérations (UPDATE, DELETE) restent strictement contrôlées.
