-- Add code column to bassins
ALTER TABLE public.bassins 
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Create update_own_profile function
CREATE OR REPLACE FUNCTION public.update_own_profile(
  user_id UUID,
  new_full_name TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = COALESCE(new_full_name, full_name),
    phone = COALESCE(new_phone, phone),
    avatar_url = COALESCE(new_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;