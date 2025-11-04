-- Fix remaining multiple permissive policies by removing overlap
-- The issue: "FOR ALL" policies overlap with specific SELECT policies

-- ============================================
-- global_announcements: Remove overlapping policies
-- ============================================
DROP POLICY IF EXISTS "Users can view announcements" ON public.global_announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.global_announcements;

-- Single policy for SELECT (admins see all, users see active only)
CREATE POLICY "Select announcements"
ON public.global_announcements
FOR SELECT
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()))
);

-- Admin-only policies for modification (INSERT/UPDATE/DELETE only, not ALL)
CREATE POLICY "Admins insert announcements"
ON public.global_announcements
FOR INSERT
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins update announcements"
ON public.global_announcements
FOR UPDATE
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins delete announcements"
ON public.global_announcements
FOR DELETE
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================
-- tenant_quotas: Remove overlapping policies
-- ============================================
DROP POLICY IF EXISTS "Users can view quotas" ON public.tenant_quotas;
DROP POLICY IF EXISTS "Admins can manage quotas" ON public.tenant_quotas;

-- Single SELECT policy (admins see all, tenants see their own)
CREATE POLICY "Select quotas"
ON public.tenant_quotas
FOR SELECT
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

-- Admin-only modification policies (separate, not ALL)
CREATE POLICY "Admins insert quotas"
ON public.tenant_quotas
FOR INSERT
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins update quotas"
ON public.tenant_quotas
FOR UPDATE
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins delete quotas"
ON public.tenant_quotas
FOR DELETE
USING (has_role((SELECT auth.uid()), 'admin'::app_role));