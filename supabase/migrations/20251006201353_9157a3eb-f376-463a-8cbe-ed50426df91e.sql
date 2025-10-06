-- Mise à jour du trigger pour autoriser le rôle "gerant" lors du signup initial
-- tout en gardant la protection contre l'escalade de privilèges

-- Supprimer tous les triggers qui dépendent de la fonction
DROP TRIGGER IF EXISTS prevent_admin_role_escalation_trigger ON public.user_roles;
DROP TRIGGER IF EXISTS check_role_escalation ON public.user_roles;

-- Maintenant on peut supprimer la fonction
DROP FUNCTION IF EXISTS public.prevent_admin_role_escalation();

-- Recréer la fonction avec la nouvelle logique
CREATE OR REPLACE FUNCTION public.prevent_admin_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  -- Vérifier si quelqu'un essaie d'assigner le rôle admin
  IF NEW.role = 'admin' THEN
    -- Seuls les admins peuvent assigner le rôle admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Seuls les administrateurs peuvent assigner le rôle admin';
    END IF;
  END IF;

  -- Vérifier si quelqu'un essaie d'assigner le rôle gerant
  IF NEW.role = 'gerant' THEN
    -- Récupérer le tenant_id du nouvel utilisateur
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Autoriser gerant UNIQUEMENT si:
    -- 1. C'est un signup initial (pas encore de tenant_id) OU
    -- 2. L'assignateur est admin
    IF user_tenant_id IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Seuls les administrateurs peuvent assigner le rôle gérant après la création du compte';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER check_role_escalation
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_role_escalation();