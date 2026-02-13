
-- Table pour l'historique des mouvements de stock
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  item_name TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment', 'production', 'sale', 'purchase')),
  quantity NUMERIC NOT NULL,
  previous_quantity NUMERIC DEFAULT 0,
  new_quantity NUMERIC DEFAULT 0,
  unit_of_measure TEXT DEFAULT 'tonnes',
  reference_type TEXT, -- 'production_record', 'sale', 'purchase_order', 'manual'
  reference_id UUID,
  warehouse TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view stock movements of their tenant"
ON public.stock_movements FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Staff can create stock movements"
ON public.stock_movements FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'production', 'comptable')
);

-- Index for fast queries
CREATE INDEX idx_stock_movements_tenant ON public.stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(movement_type);

-- Trigger: log stock movements automatically when inventory_items quantity changes
CREATE OR REPLACE FUNCTION public.log_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log if quantity actually changed
  IF OLD.quantity_on_hand IS DISTINCT FROM NEW.quantity_on_hand THEN
    INSERT INTO public.stock_movements (
      tenant_id,
      inventory_item_id,
      item_name,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      unit_of_measure,
      reference_type,
      notes
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      NEW.item_name,
      CASE 
        WHEN NEW.quantity_on_hand > COALESCE(OLD.quantity_on_hand, 0) THEN 'entry'
        ELSE 'exit'
      END,
      ABS(NEW.quantity_on_hand - COALESCE(OLD.quantity_on_hand, 0)),
      COALESCE(OLD.quantity_on_hand, 0),
      NEW.quantity_on_hand,
      COALESCE(NEW.unit_of_measure, 'tonnes'),
      'automatic',
      'Mouvement automatique via trigger'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_stock_movement
AFTER UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.log_stock_movement();

-- Also log on INSERT (new items)
CREATE OR REPLACE FUNCTION public.log_stock_movement_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(NEW.quantity_on_hand, 0) > 0 THEN
    INSERT INTO public.stock_movements (
      tenant_id,
      inventory_item_id,
      item_name,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      unit_of_measure,
      reference_type,
      notes
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      NEW.item_name,
      'entry',
      COALESCE(NEW.quantity_on_hand, 0),
      0,
      COALESCE(NEW.quantity_on_hand, 0),
      COALESCE(NEW.unit_of_measure, 'tonnes'),
      'initial',
      'Stock initial'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_stock_movement_insert
AFTER INSERT ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.log_stock_movement_insert();
