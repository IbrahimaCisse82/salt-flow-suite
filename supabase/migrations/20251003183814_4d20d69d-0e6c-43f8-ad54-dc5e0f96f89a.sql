-- ============================================
-- SECURITY FIX: Handle orphaned admin and enforce tenant isolation
-- ============================================

-- Step 1: Create a System Administration tenant for system admins
INSERT INTO tenants (id, name, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System Administration',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Assign orphaned admin profile to system tenant
UPDATE profiles 
SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

-- Step 3: Now enforce NOT NULL constraints
ALTER TABLE profiles 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE employees 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE daily_workers 
ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add check constraints (redundant but explicit)
ALTER TABLE profiles
ADD CONSTRAINT profiles_tenant_id_not_empty 
CHECK (tenant_id IS NOT NULL);

ALTER TABLE employees
ADD CONSTRAINT employees_tenant_id_not_empty 
CHECK (tenant_id IS NOT NULL);

ALTER TABLE daily_workers
ADD CONSTRAINT daily_workers_tenant_id_not_empty 
CHECK (tenant_id IS NOT NULL);

-- Step 5: Create indexes for better performance and security checks
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_daily_workers_tenant_id ON daily_workers(tenant_id);

-- Step 6: Add security comments
COMMENT ON COLUMN profiles.tenant_id IS 'Tenant isolation enforced at database level. Must never be NULL. Prevents cross-tenant data leakage.';
COMMENT ON COLUMN employees.tenant_id IS 'Tenant isolation enforced at database level. Protects salary and PII data from unauthorized access.';
COMMENT ON COLUMN daily_workers.tenant_id IS 'Tenant isolation enforced at database level. Must never be NULL.';
COMMENT ON TABLE tenants IS 'Multi-tenant isolation table. The System Administration tenant (id: 00000000-0000-0000-0000-000000000001) is reserved for system admins.';