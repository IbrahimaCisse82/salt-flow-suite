
-- Fix FK constraints blocking user deletion from auth.users
-- Change to SET NULL so deleting a user doesn't fail

-- admin_activity_logs.admin_id
ALTER TABLE public.admin_activity_logs DROP CONSTRAINT admin_activity_logs_admin_id_fkey;
ALTER TABLE public.admin_activity_logs ADD CONSTRAINT admin_activity_logs_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.admin_activity_logs ALTER COLUMN admin_id DROP NOT NULL;

-- admin_settings.updated_by
ALTER TABLE public.admin_settings DROP CONSTRAINT admin_settings_updated_by_fkey;
ALTER TABLE public.admin_settings ADD CONSTRAINT admin_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- global_announcements.created_by
ALTER TABLE public.global_announcements DROP CONSTRAINT global_announcements_created_by_fkey;
ALTER TABLE public.global_announcements ADD CONSTRAINT global_announcements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- payroll_payments.processed_by
ALTER TABLE public.payroll_payments DROP CONSTRAINT payroll_payments_processed_by_fkey;
ALTER TABLE public.payroll_payments ADD CONSTRAINT payroll_payments_processed_by_fkey
  FOREIGN KEY (processed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- security_audit_log.changed_by
ALTER TABLE public.security_audit_log DROP CONSTRAINT security_audit_log_changed_by_fkey;
ALTER TABLE public.security_audit_log ADD CONSTRAINT security_audit_log_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- support_ticket_replies.user_id
ALTER TABLE public.support_ticket_replies DROP CONSTRAINT support_ticket_replies_user_id_fkey;
ALTER TABLE public.support_ticket_replies ADD CONSTRAINT support_ticket_replies_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.support_ticket_replies ALTER COLUMN user_id DROP NOT NULL;

-- support_tickets.created_by
ALTER TABLE public.support_tickets DROP CONSTRAINT support_tickets_created_by_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- support_tickets.assigned_to
ALTER TABLE public.support_tickets DROP CONSTRAINT support_tickets_assigned_to_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- team_attendance.validated_by
ALTER TABLE public.team_attendance DROP CONSTRAINT team_attendance_validated_by_fkey;
ALTER TABLE public.team_attendance ADD CONSTRAINT team_attendance_validated_by_fkey
  FOREIGN KEY (validated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- transactions.created_by
ALTER TABLE public.transactions DROP CONSTRAINT transactions_created_by_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_roles.assigned_by
ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_assigned_by_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_assigned_by_fkey
  FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;
