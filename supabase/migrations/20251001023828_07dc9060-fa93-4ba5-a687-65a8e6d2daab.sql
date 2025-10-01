-- Standardiser les politiques RLS pour éviter la récursion et filtrer par tenant
-- Pré-requis: fonction current_tenant_id() déjà créée

-- 1) Nettoyage: supprimer les anciennes policies qui référencent public.profiles
-- Bassins
DROP POLICY IF EXISTS "Users can manage bassins in their tenant" ON public.bassins;
DROP POLICY IF EXISTS "Users can view bassins in their tenant" ON public.bassins;
-- Accounts
DROP POLICY IF EXISTS "Users can manage accounts in their tenant" ON public.accounts;
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON public.accounts;
-- Transactions
DROP POLICY IF EXISTS "Users can manage transactions in their tenant" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions in their tenant" ON public.transactions;
-- Employees
DROP POLICY IF EXISTS "Users can manage employees in their tenant" ON public.employees;
DROP POLICY IF EXISTS "Users can view employees in their tenant" ON public.employees;
-- Payments
DROP POLICY IF EXISTS "Users can manage payments in their tenant" ON public.payments;
DROP POLICY IF EXISTS "Users can view payments in their tenant" ON public.payments;
-- Chart of accounts
DROP POLICY IF EXISTS "Users can manage accounts in their tenant" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can view accounts in their tenant" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Public can read active chart of accounts" ON public.chart_of_accounts;
-- Campagnes
DROP POLICY IF EXISTS "Users can manage campagnes in their tenant" ON public.campagnes;
DROP POLICY IF EXISTS "Users can view campagnes in their tenant" ON public.campagnes;
-- Clients
DROP POLICY IF EXISTS "Users can manage clients in their tenant" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients in their tenant" ON public.clients;
-- Warehouses
DROP POLICY IF EXISTS "Users can manage warehouses in their tenant" ON public.warehouses;
DROP POLICY IF EXISTS "Users can view warehouses in their tenant" ON public.warehouses;
-- Work logs
DROP POLICY IF EXISTS "Users can manage work logs in their tenant" ON public.work_logs;
DROP POLICY IF EXISTS "Users can view work logs in their tenant" ON public.work_logs;
-- Journal entries
DROP POLICY IF EXISTS "Users can manage journal entries in their tenant" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can view journal entries in their tenant" ON public.journal_entries;
-- Sales
DROP POLICY IF EXISTS "Users can manage sales in their tenant" ON public.sales;
DROP POLICY IF EXISTS "Users can view sales in their tenant" ON public.sales;
-- Daily workers
DROP POLICY IF EXISTS "Users can manage daily workers in their tenant" ON public.daily_workers;
DROP POLICY IF EXISTS "Users can view daily workers in their tenant" ON public.daily_workers;
-- Stocks
DROP POLICY IF EXISTS "Users can manage stocks in their tenant" ON public.stocks;
DROP POLICY IF EXISTS "Users can view stocks in their tenant" ON public.stocks;
-- Production records
DROP POLICY IF EXISTS "Users can manage production records in their tenant" ON public.production_records;
DROP POLICY IF EXISTS "Users can view production records in their tenant" ON public.production_records;
-- Campagne phase budgets
DROP POLICY IF EXISTS "Users can manage budgets in their tenant" ON public.campagne_phase_budgets;
DROP POLICY IF EXISTS "Users can view budgets in their tenant" ON public.campagne_phase_budgets;
-- Harvests
DROP POLICY IF EXISTS "Users can manage harvests in their tenant" ON public.harvests;
DROP POLICY IF EXISTS "Users can view harvests in their tenant" ON public.harvests;
-- Quality controls
DROP POLICY IF EXISTS "Users can manage quality controls in their tenant" ON public.quality_controls;
DROP POLICY IF EXISTS "Users can view quality controls in their tenant" ON public.quality_controls;
-- Tenants
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;

-- 2) Re-créer des policies non récursives basées sur current_tenant_id()
-- Helper macro: pour chaque table multi-tenant, créer SELECT et ALL
-- Bassins
CREATE POLICY "tenant can select bassins" ON public.bassins FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage bassins" ON public.bassins FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Accounts
CREATE POLICY "tenant can select accounts" ON public.accounts FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage accounts" ON public.accounts FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Transactions
CREATE POLICY "tenant can select transactions" ON public.transactions FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage transactions" ON public.transactions FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Employees
CREATE POLICY "tenant can select employees" ON public.employees FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage employees" ON public.employees FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Payments
CREATE POLICY "tenant can select payments" ON public.payments FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage payments" ON public.payments FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Chart of accounts (plan comptable)
CREATE POLICY "tenant can select chart of accounts" ON public.chart_of_accounts FOR SELECT USING (tenant_id = public.current_tenant_id() AND is_active = true);
CREATE POLICY "tenant can manage chart of accounts" ON public.chart_of_accounts FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Campagnes
CREATE POLICY "tenant can select campagnes" ON public.campagnes FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage campagnes" ON public.campagnes FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Clients
CREATE POLICY "tenant can select clients" ON public.clients FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage clients" ON public.clients FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Warehouses
CREATE POLICY "tenant can select warehouses" ON public.warehouses FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage warehouses" ON public.warehouses FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Work logs
CREATE POLICY "tenant can select work logs" ON public.work_logs FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage work logs" ON public.work_logs FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Journal entries
CREATE POLICY "tenant can select journal entries" ON public.journal_entries FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage journal entries" ON public.journal_entries FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Sales
CREATE POLICY "tenant can select sales" ON public.sales FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage sales" ON public.sales FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Daily workers
CREATE POLICY "tenant can select daily workers" ON public.daily_workers FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage daily workers" ON public.daily_workers FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Stocks
CREATE POLICY "tenant can select stocks" ON public.stocks FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage stocks" ON public.stocks FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Production records
CREATE POLICY "tenant can select production records" ON public.production_records FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage production records" ON public.production_records FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Campagne phase budgets
CREATE POLICY "tenant can select campagne phase budgets" ON public.campagne_phase_budgets FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage campagne phase budgets" ON public.campagne_phase_budgets FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Harvests
CREATE POLICY "tenant can select harvests" ON public.harvests FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage harvests" ON public.harvests FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Quality controls
CREATE POLICY "tenant can select quality controls" ON public.quality_controls FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant can manage quality controls" ON public.quality_controls FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
-- Tenants
CREATE POLICY "Users can view their own tenant (safe)" ON public.tenants FOR SELECT USING (id = public.current_tenant_id());