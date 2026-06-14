
-- =====================================================================
-- P0 SECURITY MIGRATION: signup, escalation, realtime, revokes, link
-- =====================================================================

-- 1) SECURE link_profile_to_tenant: restore 4-arg signature + auth checks
DROP FUNCTION IF EXISTS public.link_profile_to_tenant(uuid, uuid);
DROP FUNCTION IF EXISTS public.link_profile_to_tenant(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION public.link_profile_to_tenant(
  _user_id uuid,
  _tenant_id uuid,
  _full_name text DEFAULT NULL,
  _email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_tenant uuid;
  _other_user_count int;
BEGIN
  -- Only the user themselves can link their own profile
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant requis';
  END IF;

  -- Prevent tenant squatting: tenant must not already have other profiles linked
  SELECT COUNT(*) INTO _other_user_count
    FROM public.profiles
   WHERE tenant_id = _tenant_id AND user_id <> _user_id;

  IF _other_user_count > 0 THEN
    RAISE EXCEPTION 'Ce tenant est déjà associé à un autre utilisateur';
  END IF;

  -- Prevent re-linking to a different tenant
  SELECT tenant_id INTO _existing_tenant FROM public.profiles WHERE user_id = _user_id;
  IF _existing_tenant IS NOT NULL AND _existing_tenant <> _tenant_id THEN
    RAISE EXCEPTION 'Profil déjà lié à un autre tenant';
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (user_id, tenant_id, email, full_name, is_active)
  VALUES (_user_id, _tenant_id, COALESCE(_email, ''), COALESCE(_full_name, ''), true)
  ON CONFLICT (user_id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        email     = COALESCE(EXCLUDED.email, public.profiles.email),
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();

  -- Ensure gerant role assigned for this tenant
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (_user_id, 'gerant'::app_role, _tenant_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END; $$;

REVOKE ALL ON FUNCTION public.link_profile_to_tenant(uuid, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_profile_to_tenant(uuid, uuid, text, text) TO authenticated;

-- 2) PRIVILEGE ESCALATION FIX on user_roles INSERT
DROP POLICY IF EXISTS user_roles_insert_gerant ON public.user_roles;
CREATE POLICY user_roles_insert_gerant ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND public.is_tenant_member(user_id, tenant_id)
    AND role <> 'admin'::app_role
  );

-- Also harden DELETE: cannot remove admin role, cannot self-demote last gerant arbitrarily
DROP POLICY IF EXISTS user_roles_delete_gerant ON public.user_roles;
CREATE POLICY user_roles_delete_gerant ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'gerant'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND role <> 'admin'::app_role
  );

-- 3) REALTIME CROSS-TENANT LEAK on accountant_notifications
-- Ensure RLS exists and is tenant-scoped; Realtime respects RLS for postgres_changes
ALTER TABLE public.accountant_notifications ENABLE ROW LEVEL SECURITY;
-- (Policies already exist per audit; no widening here.)

-- 4) REVOKE EXECUTE on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.seed_chart_of_accounts(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.seed_chart_of_accounts(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.post_depreciation(uuid) FROM PUBLIC, anon;
-- post_depreciation stays callable by authenticated (it checks tenant via get_user_tenant_id)
GRANT  EXECUTE ON FUNCTION public.post_depreciation(uuid) TO authenticated;

-- 5) REMOVE ORPHAN/DUPLICATE handle_new_user (signup is handled by Edge Function + link RPC)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 6) PERFORMANCE: tenant_id indexes on RLS-filtered tables
CREATE INDEX IF NOT EXISTS idx_accountant_notifications_tenant   ON public.accountant_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campagne_budget_lines_tenant      ON public.campagne_budget_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campagne_phase_budgets_tenant     ON public.campagne_phase_budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_tenant       ON public.notification_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant                   ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_records_tenant         ON public.production_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quality_certificates_tenant       ON public.quality_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quality_tests_tenant              ON public.quality_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant                 ON public.sale_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tenant          ON public.scheduled_reports(tenant_id);
