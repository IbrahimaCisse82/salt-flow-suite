-- Sécuriser employees_safe (correction: échapper le mot-clé réservé "position")
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'employees_safe') THEN
    DROP VIEW IF EXISTS public.employees_safe CASCADE;
    
    CREATE OR REPLACE FUNCTION public.get_employees_safe()
    RETURNS TABLE (
      id uuid,
      tenant_id uuid,
      created_at timestamp with time zone,
      updated_at timestamp with time zone,
      full_name text,
      "position" text,
      employee_type text,
      employee_number text,
      phone text,
      email text,
      is_active boolean,
      salary numeric,
      hire_date date
    )
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT 
        id, tenant_id, created_at, updated_at, full_name, 
        "position", employee_type, employee_number, phone, email,
        is_active, salary, hire_date
      FROM employees
      WHERE tenant_id = get_user_tenant_id(auth.uid());
    $func$;
    
    CREATE VIEW public.employees_safe 
    WITH (security_invoker = true) 
    AS SELECT * FROM public.get_employees_safe();
    
    GRANT SELECT ON public.employees_safe TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_employees_safe() TO authenticated;
    
  ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employees_safe') THEN
    ALTER TABLE public.employees_safe ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view employees in their tenant"
    ON public.employees_safe
    FOR SELECT
    TO authenticated
    USING (tenant_id = get_user_tenant_id(auth.uid()));
  END IF;
END $$;