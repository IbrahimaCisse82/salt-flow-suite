-- 1. FIX CRITICAL: Restrict profiles UPDATE to prevent tenant_id change
-- Drop the current permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;

-- Recreate with column-level restriction: users can update their own profile BUT NOT tenant_id
CREATE POLICY "Users can update own profile safely"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  CASE
    -- Admins can update anything
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
    -- Regular users can only update their own profile AND tenant_id must stay the same
    WHEN id = auth.uid() THEN tenant_id = (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid())
    ELSE false
  END
);

-- 2. FIX: global_announcements SELECT requires authentication
DROP POLICY IF EXISTS "Select announcements" ON public.global_announcements;

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
  )
);