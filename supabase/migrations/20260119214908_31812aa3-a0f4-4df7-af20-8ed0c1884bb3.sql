-- Optimize RLS policies for teams table
DROP POLICY IF EXISTS "Tenant users can view teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can update teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can delete teams" ON public.teams;

CREATE POLICY "Tenant users can view teams" ON public.teams
FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

CREATE POLICY "Managers can insert teams" ON public.teams
FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

CREATE POLICY "Managers can update teams" ON public.teams
FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

CREATE POLICY "Managers can delete teams" ON public.teams
FOR DELETE USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

-- Optimize RLS policies for team_members table
DROP POLICY IF EXISTS "Tenant users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can delete team members" ON public.team_members;

CREATE POLICY "Tenant users can view team members" ON public.team_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
    AND t.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Managers can insert team members" ON public.team_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
    AND t.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

CREATE POLICY "Managers can update team members" ON public.team_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
    AND t.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

CREATE POLICY "Managers can delete team members" ON public.team_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
    AND t.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  )
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

-- Optimize RLS policies for employees table
DROP POLICY IF EXISTS "Tenant users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can update employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can delete employees" ON public.employees;

CREATE POLICY "Tenant users can view employees" ON public.employees
FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
);

CREATE POLICY "Managers can insert employees" ON public.employees
FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

CREATE POLICY "Managers can update employees" ON public.employees
FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  AND public.has_role((SELECT auth.uid()), 'gerant')
);

CREATE POLICY "Managers can delete employees" ON public.employees
FOR DELETE USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  AND public.has_role((SELECT auth.uid()), 'gerant')
);