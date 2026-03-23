
-- Final cleanup: remaining public-role write policies

-- support_tickets
DROP POLICY IF EXISTS "Admins can manage tickets" ON support_tickets;
CREATE POLICY "Admins can manage tickets" ON support_tickets FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can delete tickets" ON support_tickets;
CREATE POLICY "Admins can delete tickets" ON support_tickets FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- team_attendance
DROP POLICY IF EXISTS "Managers can update attendance" ON team_attendance;
CREATE POLICY "Managers can update attendance" ON team_attendance FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

DROP POLICY IF EXISTS "Managers and production can create attendance" ON team_attendance;
CREATE POLICY "Managers and production can create attendance" ON team_attendance FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

-- team_members
DROP POLICY IF EXISTS "Managers can delete team members" ON team_members;
CREATE POLICY "Managers can delete team members" ON team_members FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.tenant_id = get_user_tenant_id(auth.uid())) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can update team members" ON team_members;
CREATE POLICY "Managers can update team members" ON team_members FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.tenant_id = get_user_tenant_id(auth.uid())) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

-- teams
DROP POLICY IF EXISTS "Managers can update teams" ON teams;
CREATE POLICY "Managers can update teams" ON teams FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can insert teams" ON teams;
CREATE POLICY "Managers can insert teams" ON teams FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can delete teams" ON teams;
CREATE POLICY "Managers can delete teams" ON teams FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

-- tenant_quotas
DROP POLICY IF EXISTS "Admins update quotas" ON tenant_quotas;
CREATE POLICY "Admins update quotas" ON tenant_quotas FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert quotas" ON tenant_quotas;
CREATE POLICY "Admins insert quotas" ON tenant_quotas FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete quotas" ON tenant_quotas;
CREATE POLICY "Admins delete quotas" ON tenant_quotas FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
