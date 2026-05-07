
CREATE OR REPLACE FUNCTION public.check_user_active(p_user_id UUID)
RETURNS TABLE (
  user_active BOOLEAN,
  tenant_active BOOLEAN,
  tenant_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p.is_active, false) AS user_active,
    COALESCE(t.is_active, true) AS tenant_active,
    t.name AS tenant_name
  FROM public.profiles p
  LEFT JOIN public.tenants t ON t.id = p.tenant_id
  WHERE p.user_id = p_user_id
  LIMIT 1;
END;
$$;
