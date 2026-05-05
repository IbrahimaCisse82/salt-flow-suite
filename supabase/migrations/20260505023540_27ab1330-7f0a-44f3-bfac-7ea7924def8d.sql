REVOKE ALL ON FUNCTION public.get_user_tenant_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;