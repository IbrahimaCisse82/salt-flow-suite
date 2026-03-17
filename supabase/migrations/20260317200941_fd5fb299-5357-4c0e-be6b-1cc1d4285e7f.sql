-- 1. Fix: Internal support ticket replies visible to all tenant users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_ticket_replies') THEN
    DROP POLICY IF EXISTS "Users can view ticket replies" ON public.support_ticket_replies;
    DROP POLICY IF EXISTS "Tenant users can view ticket replies" ON public.support_ticket_replies;
    
    CREATE POLICY "Users can view ticket replies"
      ON public.support_ticket_replies
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.support_tickets st
          WHERE st.id = support_ticket_replies.ticket_id
            AND st.tenant_id = get_user_tenant_id(auth.uid())
        )
        AND (
          is_internal = false
          OR get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
        )
      );
  END IF;
END $$;

-- 2. Fix: Unauthenticated users can create tenant records
DROP POLICY IF EXISTS "Users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON public.tenants;

CREATE POLICY "Authenticated users can create tenants"
  ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tenant_id IS NOT NULL
    )
  );

-- 3. Fix: Role-targeted announcements visible to all
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.global_announcements;

CREATE POLICY "Authenticated users can view active announcements"
  ON public.global_announcements
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      is_active = true
      AND starts_at <= now()
      AND (ends_at IS NULL OR ends_at > now())
      AND (
        target_audience = 'all'
        OR get_user_role(auth.uid()) = ANY(target_roles)
      )
    )
  );