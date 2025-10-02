-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  sector TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'repos', 'inactive')),
  production_target NUMERIC DEFAULT 0,
  efficiency_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team_members junction table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view teams in their tenant"
ON public.teams FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage teams"
ON public.teams FOR ALL
TO authenticated
USING (is_manager_or_admin(auth.uid()))
WITH CHECK (is_manager_or_admin(auth.uid()));

-- RLS Policies for team_members
CREATE POLICY "Users can view team members in their tenant"
ON public.team_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Managers can manage team members"
ON public.team_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE teams.id = team_members.team_id
    AND teams.tenant_id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_teams_tenant_id ON public.teams(tenant_id);
CREATE INDEX idx_teams_leader_id ON public.teams(leader_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_employee_id ON public.team_members(employee_id);