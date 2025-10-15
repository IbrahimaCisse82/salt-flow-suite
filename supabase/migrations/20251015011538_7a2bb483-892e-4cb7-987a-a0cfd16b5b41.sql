-- Fix multiple permissive policies by creating strictly separate policies per operation
-- Drop all existing policies and recreate with no overlap

-- ACCOUNTS
DROP POLICY IF EXISTS "Managers can manage accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON public.accounts;

CREATE POLICY "Users can view accounts" ON public.accounts FOR SELECT 
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers can insert accounts" ON public.accounts FOR INSERT 
WITH CHECK (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can update accounts" ON public.accounts FOR UPDATE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can delete accounts" ON public.accounts FOR DELETE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

-- BASSINS
DROP POLICY IF EXISTS "Managers and production can manage bassins" ON public.bassins;
DROP POLICY IF EXISTS "Tenant users can view bassins" ON public.bassins;

CREATE POLICY "Tenant users can view bassins" ON public.bassins FOR SELECT 
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers and production can insert bassins" ON public.bassins FOR INSERT 
WITH CHECK (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text]))
);

CREATE POLICY "Managers and production can update bassins" ON public.bassins FOR UPDATE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text]))
);

CREATE POLICY "Managers and production can delete bassins" ON public.bassins FOR DELETE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text]))
);

-- CAMPAGNE_PHASE_BUDGETS
DROP POLICY IF EXISTS "Managers can manage phase budgets" ON public.campagne_phase_budgets;
DROP POLICY IF EXISTS "Users can view phase budgets for their tenant campagnes" ON public.campagne_phase_budgets;

CREATE POLICY "Users can view phase budgets" ON public.campagne_phase_budgets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM campagnes
    WHERE campagnes.id = campagne_phase_budgets.campagne_id 
    AND campagnes.tenant_id = get_user_tenant_id((select auth.uid()))
  )
);

CREATE POLICY "Managers can insert phase budgets" ON public.campagne_phase_budgets FOR INSERT 
WITH CHECK (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can update phase budgets" ON public.campagne_phase_budgets FOR UPDATE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can delete phase budgets" ON public.campagne_phase_budgets FOR DELETE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

-- CAMPAGNES
DROP POLICY IF EXISTS "Managers can manage campagnes" ON public.campagnes;
DROP POLICY IF EXISTS "Tenant users can view campagnes" ON public.campagnes;

CREATE POLICY "Tenant users can view campagnes" ON public.campagnes FOR SELECT 
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers can insert campagnes" ON public.campagnes FOR INSERT 
WITH CHECK (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]))
);

CREATE POLICY "Managers can update campagnes" ON public.campagnes FOR UPDATE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]))
);

CREATE POLICY "Managers can delete campagnes" ON public.campagnes FOR DELETE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]))
);

-- CHART_OF_ACCOUNTS
DROP POLICY IF EXISTS "Admins and managers can manage accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON public.chart_of_accounts;

CREATE POLICY "Users can view chart accounts" ON public.chart_of_accounts FOR SELECT 
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers can insert chart accounts" ON public.chart_of_accounts FOR INSERT 
WITH CHECK (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can update chart accounts" ON public.chart_of_accounts FOR UPDATE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can delete chart accounts" ON public.chart_of_accounts FOR DELETE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

-- CLIENTS
DROP POLICY IF EXISTS "Authorized roles can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authorized roles can create clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can update and delete clients" ON public.clients;

CREATE POLICY "Authorized roles can view clients" ON public.clients FOR SELECT 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'commercial'::text]))
);

CREATE POLICY "Authorized roles can create clients" ON public.clients FOR INSERT 
WITH CHECK (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'commercial'::text]))
);

CREATE POLICY "Managers can update clients" ON public.clients FOR UPDATE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]))
);

CREATE POLICY "Managers can delete clients" ON public.clients FOR DELETE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]))
);

-- EXPENSE_TYPES
DROP POLICY IF EXISTS "Managers can manage expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Users can view expense types in their tenant" ON public.expense_types;

CREATE POLICY "Users can view expense types" ON public.expense_types FOR SELECT 
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers can insert expense types" ON public.expense_types FOR INSERT 
WITH CHECK (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can update expense types" ON public.expense_types FOR UPDATE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can delete expense types" ON public.expense_types FOR DELETE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

-- PAYMENTS
DROP POLICY IF EXISTS "Authorized roles can view payments in their tenant" ON public.payments;
DROP POLICY IF EXISTS "Managers can manage payments" ON public.payments;

CREATE POLICY "Authorized roles can view payments" ON public.payments FOR SELECT 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'commercial'::text, 'comptable'::text]))
);

CREATE POLICY "Managers can insert payments" ON public.payments FOR INSERT 
WITH CHECK (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]))
);

CREATE POLICY "Managers can update payments" ON public.payments FOR UPDATE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

CREATE POLICY "Managers can delete payments" ON public.payments FOR DELETE 
USING (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]));

-- PROFILES
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete and insert profiles" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT 
USING (
  id = (select auth.uid())
  OR (
    is_manager_or_admin((select auth.uid())) 
    AND tenant_id = get_user_tenant_id((select auth.uid()))
  )
  OR has_role((select auth.uid()), 'admin'::app_role)
);

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE 
USING (has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT 
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE 
USING (has_role((select auth.uid()), 'admin'::app_role));

-- TEAM_MEMBERS
DROP POLICY IF EXISTS "Production staff can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can manage team members" ON public.team_members;

CREATE POLICY "Production staff can view team members" ON public.team_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id 
    AND teams.tenant_id = get_user_tenant_id((select auth.uid())) 
    AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text]))
  )
);

CREATE POLICY "Managers can insert team members" ON public.team_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id 
    AND teams.tenant_id = get_user_tenant_id((select auth.uid())) 
    AND is_manager_or_admin((select auth.uid()))
  )
);

CREATE POLICY "Managers can update team members" ON public.team_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id 
    AND teams.tenant_id = get_user_tenant_id((select auth.uid())) 
    AND is_manager_or_admin((select auth.uid()))
  )
);

CREATE POLICY "Managers can delete team members" ON public.team_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id 
    AND teams.tenant_id = get_user_tenant_id((select auth.uid())) 
    AND is_manager_or_admin((select auth.uid()))
  )
);

-- TEAMS
DROP POLICY IF EXISTS "Production staff can view teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can manage teams" ON public.teams;

CREATE POLICY "Production staff can view teams" ON public.teams FOR SELECT 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND (get_user_role((select auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text]))
);

CREATE POLICY "Managers can insert teams" ON public.teams FOR INSERT 
WITH CHECK (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND is_manager_or_admin((select auth.uid()))
);

CREATE POLICY "Managers can update teams" ON public.teams FOR UPDATE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND is_manager_or_admin((select auth.uid()))
);

CREATE POLICY "Managers can delete teams" ON public.teams FOR DELETE 
USING (
  (tenant_id = get_user_tenant_id((select auth.uid()))) 
  AND is_manager_or_admin((select auth.uid()))
);

-- TENANTS
DROP POLICY IF EXISTS "Users can view their tenant info" ON public.tenants;
DROP POLICY IF EXISTS "Users can create tenant during signup" ON public.tenants;
DROP POLICY IF EXISTS "Managers can update tenant info" ON public.tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON public.tenants;

CREATE POLICY "Users can view their tenant" ON public.tenants FOR SELECT 
USING (id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Users can create tenant during signup" ON public.tenants FOR INSERT 
WITH CHECK (
  NOT (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) 
    AND profiles.tenant_id IS NOT NULL
  ))
  OR get_user_role((select auth.uid())) = 'admin'::text
);

CREATE POLICY "Managers can update their tenant" ON public.tenants FOR UPDATE 
USING (
  (id = get_user_tenant_id((select auth.uid())) AND is_manager_or_admin((select auth.uid())))
  OR get_user_role((select auth.uid())) = 'admin'::text
);

CREATE POLICY "Admins can delete tenants" ON public.tenants FOR DELETE 
USING (get_user_role((select auth.uid())) = 'admin'::text);