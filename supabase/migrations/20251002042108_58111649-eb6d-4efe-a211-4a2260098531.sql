-- Sécuriser clients_safe - vérifier d'abord si c'est une vue ou une table
DO $$
BEGIN
  -- Si c'est une vue, la supprimer et créer une version sécurisée
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'clients_safe') THEN
    DROP VIEW IF EXISTS public.clients_safe CASCADE;
    
    -- Créer une fonction sécurisée pour remplacer la vue
    CREATE OR REPLACE FUNCTION public.get_clients_safe()
    RETURNS TABLE (
      id uuid,
      tenant_id uuid,
      created_at timestamp with time zone,
      updated_at timestamp with time zone,
      name text,
      client_type text,
      email text,
      phone text,
      address text
    )
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT 
        id,
        tenant_id,
        created_at,
        updated_at,
        name,
        client_type,
        email,
        phone,
        address
      FROM clients
      WHERE tenant_id = get_user_tenant_id(auth.uid());
    $func$;
    
    -- Recréer la vue sécurisée
    CREATE VIEW public.clients_safe 
    WITH (security_invoker = true) 
    AS SELECT * FROM public.get_clients_safe();
    
    -- Permissions
    GRANT SELECT ON public.clients_safe TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_clients_safe() TO authenticated;
    
  -- Si c'est une table, activer RLS
  ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients_safe') THEN
    ALTER TABLE public.clients_safe ENABLE ROW LEVEL SECURITY;
    
    -- Politique: Les utilisateurs authentifiés peuvent voir les clients de leur tenant
    CREATE POLICY "Users can view clients in their tenant"
    ON public.clients_safe
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_user_tenant_id(auth.uid()));
    
  END IF;
END $$;