
-- Hardening SECURITY DEFINER: least-privilege EXECUTE grants
-- 1. Revoke from PUBLIC on all DEFINER RPCs
REVOKE EXECUTE ON FUNCTION public.apply_po_item_reception() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_ledger_change() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_user_active(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_profile_to_tenant(uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_profiles_with_roles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_transaction(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_transactions_bulk(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.post_depreciation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_valuation_snapshot(date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.seed_chart_of_accounts(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_account_balance(uuid, text, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_trial_balance(uuid, date, date) FROM PUBLIC, anon;

-- 2. Grant EXECUTE only to authenticated for legitimate RPCs (role checks are internal)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_active(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_profile_to_tenant(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_transaction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_transactions_bulk(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_depreciation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_valuation_snapshot(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_chart_of_accounts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_balance(uuid, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_trial_balance(uuid, date, date) TO authenticated;

-- 3. service_role always executes (edge functions)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_active(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.link_profile_to_tenant(uuid, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_profiles_with_roles() TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_chart_of_accounts(uuid) TO service_role;
