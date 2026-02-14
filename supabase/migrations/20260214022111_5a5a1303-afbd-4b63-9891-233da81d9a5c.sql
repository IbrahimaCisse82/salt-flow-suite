-- Add reserved_quantity column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN reserved_quantity numeric DEFAULT 0;

-- Create function to reserve stock on sale creation (draft)
CREATE OR REPLACE FUNCTION public.reserve_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_item_name TEXT;
  v_item_id UUID;
  v_quantity_tonnes NUMERIC;
  v_item_unit TEXT;
BEGIN
  -- Determine item name from salt_type
  v_item_name := CASE 
    WHEN LOWER(NEW.salt_type) IN ('gros', 'sel gros') THEN 'Sel gros'
    WHEN LOWER(NEW.salt_type) IN ('fin', 'sel fin') THEN 'Sel fin'
    WHEN LOWER(NEW.salt_type) IN ('iode', 'iodé', 'sel iodé') THEN 'Sel iodé'
    WHEN LOWER(NEW.salt_type) IN ('export', 'sel export') THEN 'Sel export'
    ELSE 'Sel - ' || NEW.salt_type
  END;

  -- Find the inventory item
  SELECT id, unit_of_measure INTO v_item_id, v_item_unit
  FROM inventory_items
  WHERE tenant_id = NEW.tenant_id
    AND item_name = v_item_name
    AND item_category = 'production'
    AND is_active = true
  LIMIT 1;

  -- Convert quantity to match inventory unit (sales are in tonnes now)
  v_quantity_tonnes := NEW.quantity;

  IF v_item_id IS NOT NULL THEN
    -- Reserve stock
    UPDATE inventory_items
    SET reserved_quantity = COALESCE(reserved_quantity, 0) + v_quantity_tonnes,
        updated_at = now()
    WHERE id = v_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to handle stock reservation changes on sale status update
CREATE OR REPLACE FUNCTION public.manage_stock_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_item_name TEXT;
  v_item_id UUID;
  v_quantity_tonnes NUMERIC;
  v_item_unit TEXT;
BEGIN
  -- Only act on status changes
  IF OLD.sale_status IS NOT DISTINCT FROM NEW.sale_status THEN
    RETURN NEW;
  END IF;

  -- Determine item name
  v_item_name := CASE 
    WHEN LOWER(NEW.salt_type) IN ('gros', 'sel gros') THEN 'Sel gros'
    WHEN LOWER(NEW.salt_type) IN ('fin', 'sel fin') THEN 'Sel fin'
    WHEN LOWER(NEW.salt_type) IN ('iode', 'iodé', 'sel iodé') THEN 'Sel iodé'
    WHEN LOWER(NEW.salt_type) IN ('export', 'sel export') THEN 'Sel export'
    ELSE 'Sel - ' || NEW.salt_type
  END;

  SELECT id, unit_of_measure INTO v_item_id, v_item_unit
  FROM inventory_items
  WHERE tenant_id = NEW.tenant_id
    AND item_name = v_item_name
    AND item_category = 'production'
    AND is_active = true
  LIMIT 1;

  v_quantity_tonnes := NEW.quantity;

  IF v_item_id IS NOT NULL THEN
    -- If cancelled: release reservation
    IF NEW.sale_status = 'cancelled' AND OLD.sale_status IN ('draft', 'confirmed', 'invoiced') THEN
      UPDATE inventory_items
      SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - v_quantity_tonnes),
          updated_at = now()
      WHERE id = v_item_id;
    END IF;

    -- If delivered/completed: release reservation (stock deduction handled by existing trigger)
    IF NEW.sale_status IN ('delivered', 'completed') AND OLD.sale_status IN ('draft', 'confirmed', 'invoiced') THEN
      UPDATE inventory_items
      SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - v_quantity_tonnes),
          updated_at = now()
      WHERE id = v_item_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: reserve on INSERT
CREATE TRIGGER trigger_reserve_stock_on_sale
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.reserve_stock_on_sale();

-- Trigger: manage reservation on UPDATE (before the existing stock deduction trigger)
CREATE TRIGGER trigger_manage_stock_reservation
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_stock_reservation();