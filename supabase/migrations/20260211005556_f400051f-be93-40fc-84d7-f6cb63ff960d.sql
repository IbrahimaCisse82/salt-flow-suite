
-- 1. Add team_id and status to production_records
ALTER TABLE public.production_records
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 2. Add notification and security preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"weather": true, "stock": true, "reports": true, "production": false}'::jsonb,
ADD COLUMN IF NOT EXISTS security_preferences JSONB DEFAULT '{"twoFactor": false, "autoBackup": true}'::jsonb;
