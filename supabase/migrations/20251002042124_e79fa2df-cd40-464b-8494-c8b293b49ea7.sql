-- Sécuriser profiles_safe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'profiles_safe') THEN
    DROP VIEW IF EXISTS public.profiles_safe CASCADE;
    
    CREATE OR REPLACE FUNCTION public.get_profiles_safe()
    RETURNS TABLE (
      id uuid,
      tenant_id uuid,
      created_at timestamp with time zone,
      updated_at timestamp with time zone,
      full_name text,
      avatar_url text
    )
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT 
        id, tenant_id, created_at, updated_at, full_name, avatar_url
      FROM profiles
      WHERE 
        id = auth.uid()
        OR (
          is_manager_or_admin(auth.uid()) 
          AND tenant_id = get_user_tenant_id(auth.uid())
        );
    $func$;
    
    CREATE VIEW public.profiles_safe 
    WITH (security_invoker = true) 
    AS SELECT * FROM public.get_profiles_safe();
    
    GRANT SELECT ON public.profiles_safe TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_profiles_safe() TO authenticated;
    
  ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles_safe') THEN
    ALTER TABLE public.profiles_safe ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own profile"
    ON public.profiles_safe
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());
    
    CREATE POLICY "Managers can view profiles in their tenant"
    ON public.profiles_safe
    FOR SELECT
    TO authenticated
    USING (
      is_manager_or_admin(auth.uid()) 
      AND tenant_id = get_user_tenant_id(auth.uid())
    );
  END IF;
END $$;