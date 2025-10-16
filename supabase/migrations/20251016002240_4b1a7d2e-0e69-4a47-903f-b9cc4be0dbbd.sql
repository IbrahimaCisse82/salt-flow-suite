-- Performance optimization: Add missing indexes on foreign keys and remove unused indexes

-- Remove unused indexes first
DROP INDEX IF EXISTS public.idx_teams_leader_id;
DROP INDEX IF EXISTS public.idx_team_members_team_id;
DROP INDEX IF EXISTS public.idx_team_members_employee_id;
DROP INDEX IF EXISTS public.idx_user_roles_role;
DROP INDEX IF EXISTS public.idx_security_audit_log_changed_at;
DROP INDEX IF EXISTS public.idx_profiles_tenant_id;
DROP INDEX IF EXISTS public.idx_accountant_notifications_unread;

-- Add indexes for foreign keys to improve query performance
-- accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON public.accounts(tenant_id);

-- bassins table
CREATE INDEX IF NOT EXISTS idx_bassins_tenant_id ON public.bassins(tenant_id);

-- campagne_phase_budgets table
CREATE INDEX IF NOT EXISTS idx_campagne_phase_budgets_campagne_id ON public.campagne_phase_budgets(campagne_id);

-- campagnes table
CREATE INDEX IF NOT EXISTS idx_campagnes_tenant_id ON public.campagnes(tenant_id);

-- chart_of_accounts table
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_tenant_id ON public.chart_of_accounts(tenant_id);

-- clients table
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);

-- expense_types table
CREATE INDEX IF NOT EXISTS idx_expense_types_account_id ON public.expense_types(account_id);
CREATE INDEX IF NOT EXISTS idx_expense_types_tenant_id ON public.expense_types(tenant_id);

-- journal_entries table
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_id ON public.journal_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_transaction_id ON public.journal_entries(transaction_id);

-- payments table
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);

-- payroll_payments table
CREATE INDEX IF NOT EXISTS idx_payroll_payments_attendance_id ON public.payroll_payments(attendance_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_paid_to ON public.payroll_payments(paid_to);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_payment_account_id ON public.payroll_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_processed_by ON public.payroll_payments(processed_by);

-- production_records table
CREATE INDEX IF NOT EXISTS idx_production_records_bassin_id ON public.production_records(bassin_id);
CREATE INDEX IF NOT EXISTS idx_production_records_campagne_id ON public.production_records(campagne_id);
CREATE INDEX IF NOT EXISTS idx_production_records_tenant_id ON public.production_records(tenant_id);

-- sales table
CREATE INDEX IF NOT EXISTS idx_sales_campagne_id ON public.sales(campagne_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON public.sales(tenant_id);

-- security_audit_log table
CREATE INDEX IF NOT EXISTS idx_security_audit_log_changed_by ON public.security_audit_log(changed_by);

-- team_attendance table
CREATE INDEX IF NOT EXISTS idx_team_attendance_team_id ON public.team_attendance(team_id);
CREATE INDEX IF NOT EXISTS idx_team_attendance_validated_by ON public.team_attendance(validated_by);

-- transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_campagne_id ON public.transactions(campagne_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON public.transactions(tenant_id);

-- user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);