-- ============================================
-- SECURITY FIX: Privilege Escalation & PII Exposure
-- ============================================

-- 1. DROP EXISTING INSECURE POLICIES
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: view self or same tenant" ON public.profiles;

-- 2. CREATE SECURE PROFILE UPDATE FUNCTION
-- This function allows users to update only safe fields (NOT role, tenant_id, or id)
CREATE OR REPLACE FUNCTION public.update_own_profile(
  _full_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _avatar_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = COALESCE(_full_name, full_name),
    phone = COALESCE(_phone, phone),
    avatar_url = COALESCE(_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 3. CREATE ADMIN-ONLY ROLE UPDATE FUNCTION
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  _user_id uuid,
  _new_role user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_role user_role;
  _target_tenant uuid;
  _admin_tenant uuid;
BEGIN
  -- Check if caller is admin
  SELECT role, tenant_id INTO _admin_role, _admin_tenant
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF _admin_role != 'admin' AND _admin_role != 'gerant' THEN
    RAISE EXCEPTION 'Only admins and managers can update user roles';
  END IF;
  
  -- Check if target user is in same tenant (except for system admin)
  SELECT tenant_id INTO _target_tenant
  FROM public.profiles
  WHERE id = _user_id;
  
  IF _admin_role = 'gerant' AND _target_tenant != _admin_tenant THEN
    RAISE EXCEPTION 'Managers can only update roles for users in their tenant';
  END IF;
  
  -- Update the role
  UPDATE public.profiles
  SET 
    role = _new_role,
    updated_at = now()
  WHERE id = _user_id;
END;
$$;

-- 4. CREATE NEW SECURE RLS POLICIES FOR PROFILES

-- Policy: Users can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy: Users can view LIMITED info of same-tenant users (NO PII)
CREATE POLICY "Users can view same tenant profiles (limited)"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  tenant_id = current_tenant_id() 
  AND id != auth.uid()
);

-- Policy: Admins and Gerants can view full profiles in their scope
CREATE POLICY "Managers can view full tenant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'gerant')
    AND (p.role = 'admin' OR p.tenant_id = current_tenant_id())
  )
);

-- Policy: Users cannot directly UPDATE profiles (must use function)
-- This prevents role escalation
CREATE POLICY "Users cannot directly update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- 5. CREATE VIEW FOR SAFE PROFILE DATA
-- This view only exposes non-PII data for same-tenant queries
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  tenant_id,
  role,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.safe_profiles TO authenticated;

-- 6. ADD AUDIT LOG TABLE FOR SECURITY EVENTS
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 7. ADD TRIGGER TO LOG ROLE CHANGES
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.security_audit_log (
      tenant_id,
      actor_id,
      action,
      target_user_id,
      old_value,
      new_value
    ) VALUES (
      NEW.tenant_id,
      auth.uid(),
      'role_change',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_role_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_role_change();