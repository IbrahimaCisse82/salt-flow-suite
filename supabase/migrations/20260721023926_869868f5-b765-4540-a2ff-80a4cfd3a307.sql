
-- Vague 2 : tables auxiliaires, colonnes et FK PostgREST

-- 1. Teams : ajouter colonnes attendues + alias leader_id
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS leader_id uuid,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS production_target numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS efficiency_rate numeric(5,2) NOT NULL DEFAULT 0;

-- Migrer team_lead_id -> leader_id
UPDATE public.teams SET leader_id = team_lead_id WHERE leader_id IS NULL AND team_lead_id IS NOT NULL;

-- FK leader_id -> employees
DO $$ BEGIN
  ALTER TABLE public.teams
    ADD CONSTRAINT teams_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.employees(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, employee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_employee ON public.team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON public.team_members(tenant_id);

DROP POLICY IF EXISTS tm_select ON public.team_members;
CREATE POLICY tm_select ON public.team_members FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS tm_insert ON public.team_members;
CREATE POLICY tm_insert ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(),'gerant'::app_role) OR public.has_role(auth.uid(),'rh'::app_role)
      OR public.has_role(auth.uid(),'chef_production'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
DROP POLICY IF EXISTS tm_update ON public.team_members;
CREATE POLICY tm_update ON public.team_members FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(),'gerant'::app_role) OR public.has_role(auth.uid(),'rh'::app_role)
      OR public.has_role(auth.uid(),'chef_production'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));
DROP POLICY IF EXISTS tm_delete ON public.team_members;
CREATE POLICY tm_delete ON public.team_members FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(),'gerant'::app_role) OR public.has_role(auth.uid(),'rh'::app_role)
      OR public.has_role(auth.uid(),'chef_production'::app_role) OR public.has_role(auth.uid(),'admin'::app_role)));

-- Auto-remplir tenant_id depuis teams
CREATE OR REPLACE FUNCTION public.set_team_member_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM public.teams WHERE id = NEW.team_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_team_member_tenant ON public.team_members;
CREATE TRIGGER trg_set_team_member_tenant BEFORE INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_team_member_tenant();

-- 3. Purchase_notifications : colonnes attendues + FK
ALTER TABLE public.purchase_notifications
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS target_user_id uuid,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS amount numeric(15,2),
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.purchase_notifications
    ADD CONSTRAINT purchase_notifications_purchase_order_id_fkey
    FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Purchase_orders : FK supplier_id explicite pour embedding PostgREST
DO $$ BEGIN
  ALTER TABLE public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
