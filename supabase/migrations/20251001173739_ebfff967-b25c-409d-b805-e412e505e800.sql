-- Step 1: Add admin role to user_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END $$;

-- Add is_active field to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;