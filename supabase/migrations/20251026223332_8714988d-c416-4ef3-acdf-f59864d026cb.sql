-- Add NOT NULL constraints to tenant_id columns for data integrity
-- This prevents orphaned records without proper tenant isolation

-- First, verify no NULL values exist (safety check)
-- If any NULL values exist, this migration will fail and require manual cleanup

-- Operational tables
ALTER TABLE public.accountant_notifications 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.accounts 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.bassins 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.campagnes 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.chart_of_accounts 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.clients 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.expense_types 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.notification_history 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.payments 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.payroll_payments 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.production_records 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.sales 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.team_attendance 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.teams 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.transactions 
  ALTER COLUMN tenant_id SET NOT NULL;