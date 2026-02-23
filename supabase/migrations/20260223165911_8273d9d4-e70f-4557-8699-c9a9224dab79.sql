
-- =====================================================
-- STOCK VALORISATION CMP + ANTI-NÉGATIF
-- =====================================================

-- 1. Table des couches de valorisation (chaque entrée/sortie traçée avec son coût)
CREATE TABLE public.inventory_valuation_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit')),
  source_type TEXT NOT NULL CHECK (source_type IN ('production', 'purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return')),
  reference_id UUID,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  total_value NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  remaining_quantity NUMERIC NOT NULL CHECK (remaining_quantity >= 0),
  layer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour performance
CREATE INDEX idx_valuation_layers_tenant ON public.inventory_valuation_layers(tenant_id);
CREATE INDEX idx_valuation_layers_item ON public.inventory_valuation_layers(inventory_item_id);
CREATE INDEX idx_valuation_layers_date ON public.inventory_valuation_layers(layer_date);
CREATE INDEX idx_valuation_layers_remaining ON public.inventory_valuation_layers(inventory_item_id, remaining_quantity) WHERE remaining_quantity > 0;

-- RLS
ALTER TABLE public.inventory_valuation_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view valuation layers"
  ON public.inventory_valuation_layers FOR SELECT
  USING (tenant_id = get_user_tenant_id((SELECT auth.uid())));

CREATE POLICY "Authorized roles can insert valuation layers"
  ON public.inventory_valuation_layers FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id((SELECT auth.uid()))
    AND get_user_role((SELECT auth.uid())) = ANY(ARRAY['admin', 'gerant', 'comptable', 'production'])
  );

-- 2. Ajouter colonne CMP sur inventory_items (coût moyen pondéré calculé)
ALTER TABLE public.inventory_items 
  ADD COLUMN IF NOT EXISTS cmp NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_stock_value NUMERIC DEFAULT 0;

-- 3. Table snapshot mensuel de valorisation  
CREATE TABLE public.inventory_valuation_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  snapshot_date DATE NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity_on_hand NUMERIC NOT NULL DEFAULT 0,
  cmp NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, inventory_item_id, snapshot_date)
);

CREATE INDEX idx_valuation_snapshots_tenant_date ON public.inventory_valuation_snapshots(tenant_id, snapshot_date);

ALTER TABLE public.inventory_valuation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view valuation snapshots"
  ON public.inventory_valuation_snapshots FOR SELECT
  USING (tenant_id = get_user_tenant_id((SELECT auth.uid())));

CREATE POLICY "System can insert valuation snapshots"
  ON public.inventory_valuation_snapshots FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id((SELECT auth.uid()))
    AND get_user_role((SELECT auth.uid())) = ANY(ARRAY['admin', 'gerant', 'comptable'])
  );

-- 4. Fonction de calcul CMP et mise à jour inventory_items
CREATE OR REPLACE FUNCTION public.update_cmp_on_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty NUMERIC;
  v_current_cmp NUMERIC;
  v_new_cmp NUMERIC;
  v_new_total_value NUMERIC;
  v_new_total_qty NUMERIC;
BEGIN
  -- Seulement pour les entrées
  IF NEW.movement_type != 'entry' THEN
    RETURN NEW;
  END IF;

  -- Récupérer stock actuel et CMP
  SELECT COALESCE(quantity_on_hand, 0), COALESCE(cmp, 0)
  INTO v_current_qty, v_current_cmp
  FROM inventory_items
  WHERE id = NEW.inventory_item_id;

  -- Calcul CMP = (stock_actuel × CMP_actuel + quantité_entrée × coût_entrée) / (stock_actuel + quantité_entrée)
  v_new_total_qty := v_current_qty + NEW.quantity;
  
  IF v_new_total_qty > 0 THEN
    v_new_total_value := (v_current_qty * v_current_cmp) + (NEW.quantity * NEW.unit_cost);
    v_new_cmp := v_new_total_value / v_new_total_qty;
  ELSE
    v_new_cmp := NEW.unit_cost;
    v_new_total_value := 0;
  END IF;

  -- Mettre à jour le CMP et la valeur totale
  UPDATE inventory_items
  SET 
    cmp = ROUND(v_new_cmp, 2),
    total_stock_value = ROUND(v_new_total_value, 2),
    unit_cost = ROUND(v_new_cmp, 2),
    updated_at = now()
  WHERE id = NEW.inventory_item_id;

  -- Initialiser remaining_quantity pour les entrées
  NEW.remaining_quantity := NEW.quantity;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_cmp_on_entry
  BEFORE INSERT ON public.inventory_valuation_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cmp_on_entry();

-- 5. Fonction pour recalculer la valeur totale sur sortie
CREATE OR REPLACE FUNCTION public.update_value_on_exit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty NUMERIC;
  v_current_cmp NUMERIC;
BEGIN
  IF NEW.movement_type != 'exit' THEN
    RETURN NEW;
  END IF;

  -- Le coût de sortie est le CMP actuel
  SELECT COALESCE(quantity_on_hand, 0), COALESCE(cmp, 0)
  INTO v_current_qty, v_current_cmp
  FROM inventory_items
  WHERE id = NEW.inventory_item_id;

  -- Forcer le coût de sortie au CMP
  NEW.unit_cost := v_current_cmp;
  NEW.remaining_quantity := 0; -- Les sorties n'ont pas de quantité restante

  -- Vérifier stock suffisant (ANTI-NÉGATIF)
  IF v_current_qty < NEW.quantity THEN
    RAISE EXCEPTION 'Stock insuffisant: % tonnes disponibles, % tonnes demandées pour %',
      v_current_qty, NEW.quantity, 
      (SELECT item_name FROM inventory_items WHERE id = NEW.inventory_item_id);
  END IF;

  -- Mettre à jour la valeur totale
  UPDATE inventory_items
  SET 
    total_stock_value = ROUND((v_current_qty - NEW.quantity) * v_current_cmp, 2),
    updated_at = now()
  WHERE id = NEW.inventory_item_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_value_on_exit
  BEFORE INSERT ON public.inventory_valuation_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_value_on_exit();

-- 6. Trigger anti-stock négatif directement sur inventory_items (couche de sécurité supplémentaire)
CREATE OR REPLACE FUNCTION public.prevent_negative_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.quantity_on_hand < 0 THEN
    RAISE EXCEPTION 'Stock négatif interdit pour l''article "%": tentative de mettre le stock à % tonnes',
      NEW.item_name, NEW.quantity_on_hand;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_negative_stock
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  WHEN (NEW.quantity_on_hand IS NOT NULL AND NEW.quantity_on_hand < 0)
  EXECUTE FUNCTION public.prevent_negative_stock();

-- 7. Fonction pour créer un snapshot mensuel de valorisation
CREATE OR REPLACE FUNCTION public.create_valuation_snapshot(
  p_tenant_id UUID,
  p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO inventory_valuation_snapshots (tenant_id, snapshot_date, inventory_item_id, quantity_on_hand, cmp, total_value)
  SELECT 
    p_tenant_id,
    p_snapshot_date,
    id,
    COALESCE(quantity_on_hand, 0),
    COALESCE(cmp, 0),
    COALESCE(total_stock_value, 0)
  FROM inventory_items
  WHERE tenant_id = p_tenant_id
    AND is_active = true
    AND item_category = 'production'
  ON CONFLICT (tenant_id, inventory_item_id, snapshot_date) 
  DO UPDATE SET
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    cmp = EXCLUDED.cmp,
    total_value = EXCLUDED.total_value;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
