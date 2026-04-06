
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
ADD COLUMN IF NOT EXISTS security_preferences jsonb DEFAULT '{"two_factor": false, "session_timeout": 30}'::jsonb;
