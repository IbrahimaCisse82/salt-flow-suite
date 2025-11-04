-- Fix Function Search Path Mutable warning
-- Ensure all SECURITY DEFINER functions have explicit search_path set

-- Update all SECURITY DEFINER functions to have explicit search_path
-- This prevents search_path manipulation attacks

-- Helper functions for role checking
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.get_primary_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.is_manager_or_admin(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;

-- Tenant and profile helper functions
ALTER FUNCTION public.get_user_tenant_id(uuid) SET search_path = public;
ALTER FUNCTION public.get_public_profiles() SET search_path = public;
ALTER FUNCTION public.get_profiles_with_roles() SET search_path = public;
ALTER FUNCTION public.get_profiles_safe() SET search_path = public;
ALTER FUNCTION public.update_own_profile(uuid, text, text, text) SET search_path = public;

-- Employee and client helper functions
ALTER FUNCTION public.get_employees_safe() SET search_path = public;
ALTER FUNCTION public.get_clients_safe() SET search_path = public;

-- Tenant info function
ALTER FUNCTION public.get_tenant_public_info(uuid) SET search_path = public;

-- Utility functions
ALTER FUNCTION public.soft_delete_record(text, uuid) SET search_path = public;

-- Notification functions
ALTER FUNCTION public.send_push_notification(uuid, uuid, text, text, text, uuid) SET search_path = public;

-- Trigger functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.audit_role_changes() SET search_path = public;
ALTER FUNCTION public.notify_accountant_on_validation() SET search_path = public;
ALTER FUNCTION public.update_attendance_status_on_payment() SET search_path = public;
ALTER FUNCTION public.notify_on_leave_status_change() SET search_path = public;
ALTER FUNCTION public.notify_on_attendance_validation() SET search_path = public;
ALTER FUNCTION public.notify_on_payroll_payment() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.prevent_admin_role_escalation() SET search_path = public;
ALTER FUNCTION public.initialize_new_tenant() SET search_path = public;

-- Scheduled reports functions
ALTER FUNCTION public.calculate_next_run(text, time, timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.set_next_run_at() SET search_path = public;
ALTER FUNCTION public.send_attendance_validation_reminders() SET search_path = public;