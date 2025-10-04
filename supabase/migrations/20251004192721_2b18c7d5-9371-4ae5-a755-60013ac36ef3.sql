-- Fix handle_new_user trigger to handle optional tenant_id
-- During initial signup, tenant_id is null and will be set later by the application
-- During user invitation, tenant_id is provided in user_metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  user_tenant_id UUID;
BEGIN
  -- Get tenant_id from user_metadata if available
  user_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  
  -- Créer le profil (tenant_id peut être NULL lors du signup initial)
  INSERT INTO public.profiles (id, email, full_name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_tenant_id
  );
  
  -- Assigner le rôle
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'production')::app_role;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;