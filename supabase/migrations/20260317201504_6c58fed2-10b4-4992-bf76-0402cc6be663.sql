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
BEGIN
  -- Only allow if the user's profile has no tenant yet (self-signup scenario)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND tenant_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Profile already linked to a tenant';
  END IF;

  UPDATE public.profiles
  SET tenant_id = _tenant_id,
      full_name = _full_name,
      email = _email,
      updated_at = now()
  WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_profile_to_tenant FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_profile_to_tenant TO authenticated;