
-- Restreindre l'ajout de membres d'équipe aux managers
CREATE POLICY "Only managers can add team members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
    AND t.tenant_id = get_user_tenant_id(auth.uid())
  )
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);
