-- Harden and make profile-to-tenant linking idempotent + self-only
CREATE OR REPLACE FUNCTION public.link_profile_to_tenant(
  _user_id uuid,
  _tenant_id uuid,
  _full_name text,
  _email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_tenant uuid;
  _affected integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _user_id IS NULL OR _tenant_id IS NULL THEN
    RAISE EXCEPTION 'Missing required identifiers';
  END IF;

  IF auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = _tenant_id
  ) THEN
    RAISE EXCEPTION 'Tenant not found';
  END IF;

  SELECT p.tenant_id
  INTO _existing_tenant
  FROM public.profiles p
  WHERE p.id = _user_id;

  IF _existing_tenant IS NOT NULL AND _existing_tenant <> _tenant_id THEN
    RAISE EXCEPTION 'Profile already linked to a different tenant';
  END IF;

  INSERT INTO public.profiles (id, tenant_id, full_name, email, is_active, created_at, updated_at)
  VALUES (
    _user_id,
    _tenant_id,
    NULLIF(trim(_full_name), ''),
    NULLIF(lower(trim(_email)), ''),
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      updated_at = now()
  WHERE public.profiles.tenant_id IS NULL
     OR public.profiles.tenant_id = EXCLUDED.tenant_id;

  GET DIAGNOSTICS _affected = ROW_COUNT;
  IF _affected = 0 THEN
    RAISE EXCEPTION 'Profile already linked to a tenant';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.link_profile_to_tenant(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_profile_to_tenant(uuid, uuid, text, text) TO authenticated;

-- Backfill missing tenant_id links for manager accounts created before the fix.
-- Strategy: match profile.email with tenants.contact_email and keep the most recent tenant per profile.
WITH ranked_matches AS (
  SELECT
    p.id AS profile_id,
    t.id AS tenant_id,
    ROW_NUMBER() OVER (
      PARTITION BY p.id
      ORDER BY t.created_at DESC NULLS LAST, t.id DESC
    ) AS rn
  FROM public.profiles p
  JOIN public.user_roles ur
    ON ur.user_id = p.id
   AND ur.role = 'gerant'
  JOIN public.tenants t
    ON p.email IS NOT NULL
   AND t.contact_email IS NOT NULL
   AND lower(p.email) = lower(t.contact_email)
  WHERE p.tenant_id IS NULL
),
chosen_matches AS (
  SELECT profile_id, tenant_id
  FROM ranked_matches
  WHERE rn = 1
)
UPDATE public.profiles p
SET tenant_id = cm.tenant_id,
    updated_at = now()
FROM chosen_matches cm
WHERE p.id = cm.profile_id
  AND p.tenant_id IS NULL;