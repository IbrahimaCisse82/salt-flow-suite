-- Consolidate multiple permissive RLS policies for performance optimization
-- This resolves the "multiple_permissive_policies" linter warnings

-- ============================================
-- global_announcements: Consolidate SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.global_announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON public.global_announcements;

-- Single consolidated SELECT policy
CREATE POLICY "Users can view announcements"
ON public.global_announcements
FOR SELECT
USING (
  -- Admins can view all announcements
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR
  -- Regular users can only view active announcements within time window
  (
    is_active = true 
    AND starts_at <= now() 
    AND (ends_at IS NULL OR ends_at > now())
  )
);

-- Keep other policies for admins (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage announcements"
ON public.global_announcements
FOR ALL
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================
-- inventory_items: Consolidate SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Managers can manage inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can view inventory items" ON public.inventory_items;

-- Single consolidated policy for all operations
CREATE POLICY "Users can access inventory items"
ON public.inventory_items
FOR ALL
USING (tenant_id = get_user_tenant_id((SELECT auth.uid())))
WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text, 'production'::text])
);

-- ============================================
-- support_tickets: Consolidate policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their tenant tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;

-- Consolidated SELECT policy
CREATE POLICY "Users can view tickets"
ON public.support_tickets
FOR SELECT
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

-- Consolidated INSERT policy
CREATE POLICY "Users can create tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

-- Admins can UPDATE/DELETE
CREATE POLICY "Admins can manage tickets"
ON public.support_tickets
FOR UPDATE
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete tickets"
ON public.support_tickets
FOR DELETE
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================
-- tenant_quotas: Consolidate SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage quotas" ON public.tenant_quotas;
DROP POLICY IF EXISTS "Tenants can view their quotas" ON public.tenant_quotas;

-- Consolidated SELECT policy
CREATE POLICY "Users can view quotas"
ON public.tenant_quotas
FOR SELECT
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

-- Admins-only management policies
CREATE POLICY "Admins can manage quotas"
ON public.tenant_quotas
FOR ALL
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));