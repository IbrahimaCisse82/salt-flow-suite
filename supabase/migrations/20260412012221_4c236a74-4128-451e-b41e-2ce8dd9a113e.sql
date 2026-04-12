
-- Table des centres de coûts analytiques
CREATE TABLE public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bassin_id uuid REFERENCES public.bassins(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view cost centers"
ON public.cost_centers FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can insert cost centers"
ON public.cost_centers FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

CREATE POLICY "Managers can update cost centers"
ON public.cost_centers FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

CREATE POLICY "Managers can delete cost centers"
ON public.cost_centers FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);

-- Table des imputations analytiques
CREATE TABLE public.cost_center_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cost_center_id uuid NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cost_center_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view cost center entries"
ON public.cost_center_entries FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Accounting roles can insert entries"
ON public.cost_center_entries FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

CREATE POLICY "Accounting roles can update entries"
ON public.cost_center_entries FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

CREATE POLICY "Managers can delete entries"
ON public.cost_center_entries FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);

-- Index pour les performances
CREATE INDEX idx_cost_centers_tenant ON public.cost_centers(tenant_id);
CREATE INDEX idx_cost_centers_bassin ON public.cost_centers(bassin_id);
CREATE INDEX idx_cost_center_entries_center ON public.cost_center_entries(cost_center_id);
CREATE INDEX idx_cost_center_entries_date ON public.cost_center_entries(entry_date);
CREATE INDEX idx_cost_center_entries_tenant ON public.cost_center_entries(tenant_id);

-- Trigger updated_at
CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_center_entries_updated_at
BEFORE UPDATE ON public.cost_center_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
