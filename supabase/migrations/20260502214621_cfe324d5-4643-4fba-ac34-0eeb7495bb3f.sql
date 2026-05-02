-- Révocation des permissions par défaut
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Octroi explicite aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID, UUID) TO authenticated;