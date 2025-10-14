-- Fix Auth RLS Initialization Plan warnings by optimizing auth function calls
-- Replace auth.uid() with (select auth.uid()) to evaluate once per query instead of per row

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their tenant info" ON public.tenants;
DROP POLICY IF EXISTS "Only managers can update tenant info" ON public.tenants;
DROP POLICY IF EXISTS "Users can create tenant during signup" ON public.tenants;
DROP POLICY IF EXISTS "Users can create tenant only during signup" ON public.tenants;

CREATE POLICY "Admins can manage tenants" ON public.tenants
FOR ALL
USING (get_user_role((select auth.uid())) = 'admin');

CREATE POLICY "Users can view their tenant info" ON public.tenants
FOR SELECT
USING (id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Only managers can update tenant info" ON public.tenants
FOR UPDATE
USING (id = get_user_tenant_id((select auth.uid())) AND is_manager_or_admin((select auth.uid())));

CREATE POLICY "Users can create tenant only during signup" ON public.tenants
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND tenant_id IS NOT NULL
  )
);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL
USING (has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
USING (id = (select auth.uid()));

CREATE POLICY "Managers can view tenant profiles" ON public.profiles
FOR SELECT
USING (is_manager_or_admin((select auth.uid())) AND tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (id = (select auth.uid()));

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can view roles in their tenant" ON public.user_roles;

CREATE POLICY "Only admins can manage roles" ON public.user_roles
FOR ALL
USING (has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT
USING (user_id = (select auth.uid()));

CREATE POLICY "Managers can view roles in their tenant" ON public.user_roles
FOR SELECT
USING (
  is_manager_or_admin((select auth.uid())) 
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.tenant_id = p2.tenant_id
    WHERE p1.id = (select auth.uid()) AND p2.id = user_roles.user_id
  )
);

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON public.accounts;
DROP POLICY IF EXISTS "Managers can manage accounts" ON public.accounts;

CREATE POLICY "Users can view accounts in their tenant" ON public.accounts
FOR SELECT
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers can manage accounts" ON public.accounts
FOR ALL
USING (get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]));

-- ============================================================================
-- CHART_OF_ACCOUNTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Admins and managers can manage accounts" ON public.chart_of_accounts;

CREATE POLICY "Users can view accounts in their tenant" ON public.chart_of_accounts
FOR SELECT
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Admins and managers can manage accounts" ON public.chart_of_accounts
FOR ALL
USING (get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]));

-- ============================================================================
-- EXPENSE_TYPES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view expense types in their tenant" ON public.expense_types;
DROP POLICY IF EXISTS "Managers can manage expense types" ON public.expense_types;

CREATE POLICY "Users can view expense types in their tenant" ON public.expense_types
FOR SELECT
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers can manage expense types" ON public.expense_types
FOR ALL
USING (get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]))
WITH CHECK (get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]));

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Authorized roles can view clients" ON public.clients;
DROP POLICY IF EXISTS "Commercial can create clients" ON public.clients;
DROP POLICY IF EXISTS "Managers can manage clients" ON public.clients;

CREATE POLICY "Authorized roles can view clients" ON public.clients
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'commercial'::text])
);

CREATE POLICY "Commercial can create clients" ON public.clients
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'commercial'::text])
);

CREATE POLICY "Managers can manage clients" ON public.clients
FOR ALL
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
)
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

-- ============================================================================
-- EMPLOYEES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Only managers can view and manage employees" ON public.employees;

CREATE POLICY "Only managers can view and manage employees" ON public.employees
FOR ALL
USING (
  get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]) 
  AND tenant_id = get_user_tenant_id((select auth.uid()))
)
WITH CHECK (
  get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]) 
  AND tenant_id = get_user_tenant_id((select auth.uid()))
);

-- ============================================================================
-- DAILY_WORKERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Only managers can view and manage daily workers" ON public.daily_workers;

CREATE POLICY "Only managers can view and manage daily workers" ON public.daily_workers
FOR ALL
USING (
  get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]) 
  AND tenant_id = get_user_tenant_id((select auth.uid()))
)
WITH CHECK (
  get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]) 
  AND tenant_id = get_user_tenant_id((select auth.uid()))
);

-- ============================================================================
-- BASSINS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Tenant users can view bassins" ON public.bassins;
DROP POLICY IF EXISTS "Managers and production can manage bassins" ON public.bassins;

CREATE POLICY "Tenant users can view bassins" ON public.bassins
FOR SELECT
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers and production can manage bassins" ON public.bassins
FOR ALL
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
)
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
);

-- ============================================================================
-- CAMPAGNES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Tenant users can view campagnes" ON public.campagnes;
DROP POLICY IF EXISTS "Managers can manage campagnes" ON public.campagnes;

CREATE POLICY "Tenant users can view campagnes" ON public.campagnes
FOR SELECT
USING (tenant_id = get_user_tenant_id((select auth.uid())));

CREATE POLICY "Managers can manage campagnes" ON public.campagnes
FOR ALL
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
)
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

-- ============================================================================
-- CAMPAGNE_PHASE_BUDGETS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view phase budgets for their tenant campagnes" ON public.campagne_phase_budgets;
DROP POLICY IF EXISTS "Managers can manage phase budgets" ON public.campagne_phase_budgets;

CREATE POLICY "Users can view phase budgets for their tenant campagnes" ON public.campagne_phase_budgets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campagnes 
    WHERE campagnes.id = campagne_phase_budgets.campagne_id 
    AND campagnes.tenant_id = get_user_tenant_id((select auth.uid()))
  )
);

CREATE POLICY "Managers can manage phase budgets" ON public.campagne_phase_budgets
FOR ALL
USING (get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]));

-- ============================================================================
-- PRODUCTION_RECORDS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Production staff can view records" ON public.production_records;
DROP POLICY IF EXISTS "Production staff can create records" ON public.production_records;
DROP POLICY IF EXISTS "Managers can manage production records" ON public.production_records;
DROP POLICY IF EXISTS "Managers can delete production records" ON public.production_records;

CREATE POLICY "Production staff can view records" ON public.production_records
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
);

CREATE POLICY "Production staff can create records" ON public.production_records
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
);

CREATE POLICY "Managers can manage production records" ON public.production_records
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can delete production records" ON public.production_records
FOR DELETE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

-- ============================================================================
-- SALES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Authorized roles can view sales" ON public.sales;
DROP POLICY IF EXISTS "Commercial can create sales" ON public.sales;
DROP POLICY IF EXISTS "Managers can manage sales" ON public.sales;
DROP POLICY IF EXISTS "Managers can delete sales" ON public.sales;

CREATE POLICY "Authorized roles can view sales" ON public.sales
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'commercial'::text, 'comptable'::text])
);

CREATE POLICY "Commercial can create sales" ON public.sales
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'commercial'::text])
);

CREATE POLICY "Managers can manage sales" ON public.sales
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can delete sales" ON public.sales
FOR DELETE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Authorized roles can view payments in their tenant" ON public.payments;
DROP POLICY IF EXISTS "Managers can create payments" ON public.payments;
DROP POLICY IF EXISTS "Managers can manage payments" ON public.payments;

CREATE POLICY "Authorized roles can view payments in their tenant" ON public.payments
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'commercial'::text, 'comptable'::text])
);

CREATE POLICY "Managers can create payments" ON public.payments
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can manage payments" ON public.payments
FOR ALL
USING (get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text]));

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Accounting staff can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Accounting staff can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Managers can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Managers can delete transactions" ON public.transactions;

CREATE POLICY "Accounting staff can view transactions" ON public.transactions
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Accounting staff can create transactions" ON public.transactions
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Managers can manage transactions" ON public.transactions
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can delete transactions" ON public.transactions
FOR DELETE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

-- ============================================================================
-- JOURNAL_ENTRIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view journal entries for their tenant transactions" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can create journal entries" ON public.journal_entries;

CREATE POLICY "Users can view journal entries for their tenant transactions" ON public.journal_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = journal_entries.transaction_id 
    AND transactions.tenant_id = get_user_tenant_id((select auth.uid()))
  )
);

CREATE POLICY "Users can create journal entries" ON public.journal_entries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = journal_entries.transaction_id 
    AND transactions.tenant_id = get_user_tenant_id((select auth.uid()))
  )
);

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Production staff can view teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can manage teams" ON public.teams;

CREATE POLICY "Production staff can view teams" ON public.teams
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
);

CREATE POLICY "Managers can manage teams" ON public.teams
FOR ALL
USING (tenant_id = get_user_tenant_id((select auth.uid())) AND is_manager_or_admin((select auth.uid())))
WITH CHECK (tenant_id = get_user_tenant_id((select auth.uid())) AND is_manager_or_admin((select auth.uid())));

-- ============================================================================
-- TEAM_MEMBERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Production staff can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Managers can manage team members" ON public.team_members;

CREATE POLICY "Production staff can view team members" ON public.team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.tenant_id = get_user_tenant_id((select auth.uid())) 
    AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
  )
);

CREATE POLICY "Managers can manage team members" ON public.team_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.tenant_id = get_user_tenant_id((select auth.uid())) 
    AND is_manager_or_admin((select auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.tenant_id = get_user_tenant_id((select auth.uid())) 
    AND is_manager_or_admin((select auth.uid()))
  )
);

-- ============================================================================
-- TEAM_ATTENDANCE TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Managers and production can view attendance" ON public.team_attendance;
DROP POLICY IF EXISTS "Managers and production can create attendance" ON public.team_attendance;
DROP POLICY IF EXISTS "Managers can update attendance" ON public.team_attendance;

CREATE POLICY "Managers and production can view attendance" ON public.team_attendance
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
);

CREATE POLICY "Managers and production can create attendance" ON public.team_attendance
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'production'::text])
);

CREATE POLICY "Managers can update attendance" ON public.team_attendance
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text])
);

-- ============================================================================
-- PAYROLL_PAYMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Managers and accountants can view payments" ON public.payroll_payments;
DROP POLICY IF EXISTS "Accountants can create payments" ON public.payroll_payments;

CREATE POLICY "Managers and accountants can view payments" ON public.payroll_payments
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Accountants can create payments" ON public.payroll_payments
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

-- ============================================================================
-- ACCOUNTANT_NOTIFICATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Accountants can view their notifications" ON public.accountant_notifications;
DROP POLICY IF EXISTS "Accountants can update notifications" ON public.accountant_notifications;

CREATE POLICY "Accountants can view their notifications" ON public.accountant_notifications
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Accountants can update notifications" ON public.accountant_notifications
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((select auth.uid())) 
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

-- ============================================================================
-- SECURITY_AUDIT_LOG TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_log;

CREATE POLICY "Only admins can view audit logs" ON public.security_audit_log
FOR SELECT
USING (has_role((select auth.uid()), 'admin'::app_role));