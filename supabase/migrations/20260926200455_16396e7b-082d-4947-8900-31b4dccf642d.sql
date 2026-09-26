CREATE OR REPLACE FUNCTION public.create_tenant_for_self(
  _name text,
  _subdomain text DEFAULT NULL,
  _contact_email text DEFAULT NULL,
  _full_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tenant_id uuid;
  _existing uuid;
  _slug text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentification requise' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(btrim(_name), '') = '' THEN
    RAISE EXCEPTION 'Nom de l''entreprise requis';
  END IF;

  SELECT tenant_id INTO _existing FROM public.profiles WHERE user_id = _uid;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'Cet utilisateur est déjà rattaché à une entreprise';
  END IF;

  _slug := COALESCE(NULLIF(btrim(_subdomain), ''),
                    regexp_replace(lower(btrim(_name)), '[^a-z0-9]+', '-', 'g'));
  _slug := left(regexp_replace(_slug, '(^-|-$)', '', 'g'), 48);
  IF _slug = '' THEN _slug := 'tenant'; END IF;
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE subdomain = _slug) LOOP
    _slug := left(_slug, 42) || '-' || substr(md5(random()::text), 1, 5);
  END LOOP;

  _tenant_id := gen_random_uuid();

  INSERT INTO public.tenants (id, name, subdomain, slug, contact_email, is_active)
  VALUES (_tenant_id, btrim(_name), _slug, _slug, _contact_email, true);

  INSERT INTO public.profiles (user_id, tenant_id, email, full_name, is_active)
  VALUES (_uid, _tenant_id, COALESCE(_contact_email, ''), COALESCE(_full_name, ''), true)
  ON CONFLICT (user_id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        updated_at = now();

  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (_uid, 'gerant'::app_role, _tenant_id)
  ON CONFLICT DO NOTHING;

  PERFORM public.seed_chart_of_accounts(_tenant_id);

  RETURN _tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_tenant_for_self(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_tenant_for_self(text, text, text, text) TO authenticated, service_role;