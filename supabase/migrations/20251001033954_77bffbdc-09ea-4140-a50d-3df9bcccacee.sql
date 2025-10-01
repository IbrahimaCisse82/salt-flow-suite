-- Fix handle_new_user default role and safe casting to avoid enum errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.user_role;
  v_tenant uuid;
BEGIN
  -- Extract tenant id safely (may be null if not provided)
  BEGIN
    v_tenant := NULLIF(NEW.raw_user_meta_data->>'tenant_id','')::uuid;
  EXCEPTION WHEN others THEN
    v_tenant := NULL; -- fallback to null; insert will fail if schema requires it
  END;

  -- Safely determine role; default to 'production' which exists in the enum
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'production'::public.user_role;
  WHEN others THEN
    v_role := 'production'::public.user_role;
  END;

  IF v_role IS NULL THEN
    v_role := 'production'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, email, full_name, role)
  VALUES (
    NEW.id,
    v_tenant,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_role
  );

  RETURN NEW;
END;
$function$;