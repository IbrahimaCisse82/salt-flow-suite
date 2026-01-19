-- =====================================================
-- CORRECTION DES POLITIQUES RLS POUR LE MODULE ÉQUIPES
-- =====================================================

-- 1) TEAMS: Autoriser tous les rôles du tenant à voir les équipes
-- DROP les anciennes politiques
DROP POLICY IF EXISTS "Tenant users can view teams" ON public.teams;
DROP POLICY IF EXISTS "Production staff can view teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can update teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can delete teams" ON public.teams;

-- Politique SELECT: Tous les utilisateurs du tenant peuvent voir
CREATE POLICY "Tenant users can view teams"
ON public.teams
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Politique INSERT: Gérants et admins peuvent créer
CREATE POLICY "Managers can insert teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- Politique UPDATE: Gérants et admins peuvent modifier
CREATE POLICY "Managers can update teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- Politique DELETE: Gérants et admins peuvent supprimer
CREATE POLICY "Managers can delete teams"
ON public.teams
FOR DELETE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- 2) TEAM_MEMBERS: Autoriser tous les rôles du tenant à voir les membres
DROP POLICY IF EXISTS "Tenant users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Production staff can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can delete team members" ON public.team_members;

-- Politique SELECT: Tous les utilisateurs du tenant peuvent voir
CREATE POLICY "Tenant users can view team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- Politique INSERT: Gérants et admins peuvent ajouter des membres
CREATE POLICY "Managers can insert team members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  )
);

-- Politique UPDATE: Gérants et admins peuvent modifier
CREATE POLICY "Managers can update team members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  )
);

-- Politique DELETE: Gérants et admins peuvent retirer des membres
CREATE POLICY "Managers can delete team members"
ON public.team_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  )
);

-- 3) EMPLOYEES: Ajouter une politique SELECT pour que le rôle production puisse voir les employés
-- (nécessaire pour afficher les noms dans les équipes)
DROP POLICY IF EXISTS "Only managers can view and manage employees" ON public.employees;
DROP POLICY IF EXISTS "Tenant users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can manage employees" ON public.employees;

-- Politique SELECT: Tous les utilisateurs du tenant peuvent voir les employés actifs
CREATE POLICY "Tenant users can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND deleted_at IS NULL
);

-- Politique INSERT: Gérants et admins peuvent créer
CREATE POLICY "Managers can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- Politique UPDATE: Gérants et admins peuvent modifier
CREATE POLICY "Managers can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);

-- Politique DELETE: Gérants et admins peuvent supprimer
CREATE POLICY "Managers can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant')
);