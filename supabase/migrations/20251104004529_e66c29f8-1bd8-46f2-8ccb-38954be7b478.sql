-- Fix update_updated_at_column function search_path
-- This function is used as a trigger function and needs explicit search_path

-- Drop and recreate with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;