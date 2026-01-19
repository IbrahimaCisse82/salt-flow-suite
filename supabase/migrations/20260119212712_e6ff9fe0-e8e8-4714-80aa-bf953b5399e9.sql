-- 1) Fonction pour créer les équipes par défaut pour un tenant
CREATE OR REPLACE FUNCTION public.create_default_teams_for_tenant(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _tenant_id IS NULL THEN
    RETURN;
  END IF;

  -- Préparation
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE tenant_id = _tenant_id AND sector = 'preparation') THEN
    INSERT INTO public.teams (tenant_id, name, sector, status, production_target, efficiency_rate)
    VALUES (_tenant_id, 'Préparation des bassins', 'preparation', 'active', 0, 0);
  END IF;

  -- Mise en eau
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE tenant_id = _tenant_id AND sector = 'mise-en-eau') THEN
    INSERT INTO public.teams (tenant_id, name, sector, status, production_target, efficiency_rate)
    VALUES (_tenant_id, 'Mise en eau', 'mise-en-eau', 'active', 0, 0);
  END IF;

  -- Évaporation
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE tenant_id = _tenant_id AND sector = 'evaporation') THEN
    INSERT INTO public.teams (tenant_id, name, sector, status, production_target, efficiency_rate)
    VALUES (_tenant_id, 'Évaporation', 'evaporation', 'active', 0, 0);
  END IF;

  -- Récolte
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE tenant_id = _tenant_id AND sector = 'recolte') THEN
    INSERT INTO public.teams (tenant_id, name, sector, status, production_target, efficiency_rate)
    VALUES (_tenant_id, 'Récolte', 'recolte', 'active', 0, 0);
  END IF;

  -- Traitement & stockage
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE tenant_id = _tenant_id AND sector = 'stockage') THEN
    INSERT INTO public.teams (tenant_id, name, sector, status, production_target, efficiency_rate)
    VALUES (_tenant_id, 'Traitement et stockage', 'stockage', 'active', 0, 0);
  END IF;
END;
$$;

-- 2) Trigger function (wrapper) car un trigger ne peut pas passer NEW.id en argument direct
CREATE OR REPLACE FUNCTION public.trg_init_default_teams()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_default_teams_for_tenant(NEW.id);
  RETURN NEW;
END;
$$;

-- 3) Trigger pour initialiser automatiquement les équipes à la création d'un tenant
DROP TRIGGER IF EXISTS trg_create_default_teams ON public.tenants;
CREATE TRIGGER trg_create_default_teams
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.trg_init_default_teams();

-- 4) Backfill: initialiser les équipes pour les tenants existants qui n'en ont pas
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.id
    FROM public.tenants t
    WHERE NOT EXISTS (
      SELECT 1 FROM public.teams tt WHERE tt.tenant_id = t.id
    )
  LOOP
    PERFORM public.create_default_teams_for_tenant(r.id);
  END LOOP;
END;
$$;

-- 5) Ajuster RLS: autoriser tous les utilisateurs du tenant à VOIR les équipes et membres
-- Teams
DROP POLICY IF EXISTS "Production staff can view teams" ON public.teams;
DROP POLICY IF EXISTS "Tenant users can view teams" ON public.teams;
CREATE POLICY "Tenant users can view teams"
ON public.teams
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id((SELECT auth.uid())));

-- Team members
DROP POLICY IF EXISTS "Production staff can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Tenant users can view team members" ON public.team_members;
CREATE POLICY "Tenant users can view team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.teams
    WHERE teams.id = team_members.team_id
      AND teams.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
);
