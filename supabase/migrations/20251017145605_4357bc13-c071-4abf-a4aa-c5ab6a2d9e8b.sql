-- Add missing indexes for remaining unindexed foreign keys

-- profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- team_members table
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON public.team_members(employee_id);

-- teams table
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);