-- ============================================
-- SOFT DELETE: Éviter la perte de données
-- ============================================
-- Ajouter deleted_at sur les tables critiques

-- 1. Tables métier critiques
ALTER TABLE public.production_records 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.bassins 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.campagnes 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.daily_workers 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.quality_tests 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.quality_certificates 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.purchase_orders 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Mettre à jour les politiques RLS pour exclure les soft deleted
-- Exemple pour production_records
DROP POLICY IF EXISTS "Production staff can view records" ON public.production_records;
CREATE POLICY "Production staff can view records"
  ON public.production_records
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text])
    AND deleted_at IS NULL
  );

-- Sales
DROP POLICY IF EXISTS "Authorized roles can view sales" ON public.sales;
CREATE POLICY "Authorized roles can view sales"
  ON public.sales
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text, 'commercial'::text, 'comptable'::text])
    AND deleted_at IS NULL
  );

-- Bassins
DROP POLICY IF EXISTS "Tenant users can view bassins" ON public.bassins;
CREATE POLICY "Tenant users can view bassins"
  ON public.bassins
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND deleted_at IS NULL
  );

-- Employees (déjà géré par is_active mais on ajoute deleted_at aussi)
DROP POLICY IF EXISTS "Only managers can view and manage employees" ON public.employees;
CREATE POLICY "Only managers can view and manage employees"
  ON public.employees
  FOR ALL
  USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text]) 
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND deleted_at IS NULL
  )
  WITH CHECK (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'gerant'::text]) 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- 3. Fonction helper pour soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_record(
  table_name TEXT,
  record_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL',
    table_name
  ) USING record_id;
  
  RETURN FOUND;
END;
$$;

-- 4. Index pour performances sur soft delete
CREATE INDEX IF NOT EXISTS idx_production_records_not_deleted 
  ON public.production_records(tenant_id, deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_not_deleted 
  ON public.sales(tenant_id, deleted_at) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bassins_not_deleted 
  ON public.bassins(tenant_id, deleted_at) 
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN production_records.deleted_at IS 'Soft delete timestamp - records are never physically deleted';
COMMENT ON FUNCTION soft_delete_record IS 'Helper function for soft deleting records safely';