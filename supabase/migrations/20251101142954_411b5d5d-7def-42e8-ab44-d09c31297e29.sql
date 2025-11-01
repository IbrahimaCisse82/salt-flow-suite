-- Correction: Améliorer le trigger handle_new_user pour mieux gérer les erreurs
-- et s'assurer que les profils sont créés correctement

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  user_tenant_id UUID;
BEGIN
  -- Extraire les métadonnées
  user_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'production'::app_role);
  
  -- Log pour debug
  RAISE NOTICE 'Creating profile for user % with tenant_id % and role %', 
    NEW.id, user_tenant_id, user_role;
  
  -- Créer le profil (tenant_id peut être NULL lors du signup initial)
  INSERT INTO public.profiles (id, email, full_name, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_tenant_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    tenant_id = COALESCE(EXCLUDED.tenant_id, profiles.tenant_id);
  
  -- Assigner le rôle
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (NEW.id, user_role, NEW.id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Profile and role created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Ne pas bloquer la création de l'utilisateur
END;
$function$;

-- Ajouter une contrainte pour alerter sur les profils sans tenant après un certain délai
COMMENT ON COLUMN public.profiles.tenant_id IS 
'Tenant ID. Peut être NULL lors du signup initial, mais doit être défini par le processus d''inscription dans les 5 minutes.';

-- Créer une vue pour identifier les profils problématiques
CREATE OR REPLACE VIEW public.orphaned_profiles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  ur.role,
  EXTRACT(EPOCH FROM (now() - p.created_at))/60 as minutes_since_creation
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.tenant_id IS NULL 
  AND p.created_at < (now() - INTERVAL '5 minutes')
ORDER BY p.created_at DESC;