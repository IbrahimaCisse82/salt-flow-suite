-- SECURITY FIX: Restrict sales data to authorized roles only
-- Production staff should NOT see pricing/financial data

DROP POLICY IF EXISTS "Users can view sales in their tenant" ON sales;

CREATE POLICY "Authorized roles can view sales in their tenant"
  ON sales
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'commercial', 'comptable')
  );

-- SECURITY FIX: Restrict payments data similarly
DROP POLICY IF EXISTS "Users can view payments in their tenant" ON payments;

CREATE POLICY "Authorized roles can view payments in their tenant"
  ON payments
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'commercial', 'comptable')
  );

-- Add comment for documentation
COMMENT ON POLICY "Authorized roles can view sales in their tenant" ON sales IS 
  'Only admin, gerant, commercial, and comptable roles can view sales data. Production staff cannot see pricing/revenue information.';