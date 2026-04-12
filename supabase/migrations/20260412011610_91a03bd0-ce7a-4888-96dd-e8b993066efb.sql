
-- CRITIQUE: Empêcher la modification du tenant_id par l'utilisateur
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND tenant_id IS NOT DISTINCT FROM (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- Ajouter la politique SELECT manquante sur team_members
CREATE POLICY "Tenant users can view team members"
ON public.team_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
    AND t.tenant_id = get_user_tenant_id(auth.uid())
  )
);
