-- ============================================
-- SECURE SOFT DELETE FUNCTION
-- Fix security issues: add tenant isolation, table whitelist, role checks
-- ============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.soft_delete_record(TEXT, UUID);

-- Recreate the function with proper security
CREATE OR REPLACE FUNCTION public.soft_delete_record(
  table_name TEXT,
  record_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_user_role TEXT;
  v_allowed_tables TEXT[] := ARRAY[
    'production_records', 
    'sales', 
    'bassins', 
    'campagnes',
    'employees', 
    'daily_workers',
    'quality_tests',
    'quality_certificates',
    'purchase_orders',
    'clients'
  ];
  v_rows_affected INTEGER;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user's tenant and role
  v_tenant_id := get_user_tenant_id(v_user_id);
  v_user_role := get_user_role(v_user_id);
  
  -- Check tenant exists
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with a tenant';
  END IF;
  
  -- Whitelist validation - only allow specific tables
  IF table_name != ALL(v_allowed_tables) THEN
    RAISE EXCEPTION 'Table "%" is not allowed for soft delete', table_name;
  END IF;
  
  -- Role-based access control - only admin and gerant can soft delete
  IF v_user_role NOT IN ('admin', 'gerant') THEN
    RAISE EXCEPTION 'Insufficient privileges to perform soft delete';
  END IF;
  
  -- Execute soft delete with tenant isolation
  EXECUTE format(
    'UPDATE %I SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL AND tenant_id = $2',
    table_name
  ) USING record_id, v_tenant_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Record not found or already deleted or unauthorized';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Revoke execute from public, grant only to authenticated users
REVOKE ALL ON FUNCTION public.soft_delete_record(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_record(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.soft_delete_record IS 'Secure soft delete function with tenant isolation, table whitelist, and role-based access control. Only admin and gerant roles can use this function.';