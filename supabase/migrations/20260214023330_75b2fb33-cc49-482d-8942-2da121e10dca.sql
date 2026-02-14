
-- 1. Add warehouse_id to sales
ALTER TABLE public.sales
ADD COLUMN warehouse_id UUID REFERENCES public.inventory_items(id);

-- 2. Replace reserve_stock_on_sale trigger to reserve from specific warehouse
CREATE OR REPLACE FUNCTION public.reserve_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_item_name TEXT;
  v_item_id UUID;
  v_warehouse_name TEXT;
BEGIN
  -- Determine normalized item name
  v_item_name := CASE 
    WHEN LOWER(NEW.salt_type) IN ('gros', 'sel gros') THEN 'Sel gros'
    WHEN LOWER(NEW.salt_type) IN ('fin', 'sel fin') THEN 'Sel fin'
    WHEN LOWER(NEW.salt_type) IN ('iode', 'iodé', 'sel iodé') THEN 'Sel iodé'
    WHEN LOWER(NEW.salt_type) IN ('export', 'sel export') THEN 'Sel export'
    WHEN LOWER(NEW.salt_type) IN ('industriel', 'sel industriel') THEN 'Sel industriel'
    ELSE 'Sel - ' || NEW.salt_type
  END;

  -- Get warehouse name if specified
  IF NEW.warehouse_id IS NOT NULL THEN
    SELECT item_name INTO v_warehouse_name
    FROM inventory_items WHERE id = NEW.warehouse_id;
  ELSE
    v_warehouse_name := NULL;
  END IF;

  -- Find the inventory item matching salt type + warehouse
  SELECT id INTO v_item_id
  FROM inventory_items
  WHERE tenant_id = NEW.tenant_id
    AND item_name = v_item_name
    AND item_category = 'production'
    AND is_active = true
    AND (
      (v_warehouse_name IS NOT NULL AND storage_location = v_warehouse_name)
      OR (v_warehouse_name IS NULL AND TRUE)
    )
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    UPDATE inventory_items
    SET reserved_quantity = COALESCE(reserved_quantity, 0) + NEW.quantity,
        updated_at = now()
    WHERE id = v_item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Replace manage_stock_reservation to handle cancel/deliver per warehouse
CREATE OR REPLACE FUNCTION public.manage_stock_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_item_name TEXT;
  v_item_id UUID;
  v_warehouse_name TEXT;
BEGIN
  -- Only act on status changes
  IF OLD.sale_status IS NOT DISTINCT FROM NEW.sale_status THEN
    RETURN NEW;
  END IF;

  v_item_name := CASE 
    WHEN LOWER(NEW.salt_type) IN ('gros', 'sel gros') THEN 'Sel gros'
    WHEN LOWER(NEW.salt_type) IN ('fin', 'sel fin') THEN 'Sel fin'
    WHEN LOWER(NEW.salt_type) IN ('iode', 'iodé', 'sel iodé') THEN 'Sel iodé'
    WHEN LOWER(NEW.salt_type) IN ('export', 'sel export') THEN 'Sel export'
    WHEN LOWER(NEW.salt_type) IN ('industriel', 'sel industriel') THEN 'Sel industriel'
    ELSE 'Sel - ' || NEW.salt_type
  END;

  -- Get warehouse name
  IF NEW.warehouse_id IS NOT NULL THEN
    SELECT item_name INTO v_warehouse_name
    FROM inventory_items WHERE id = NEW.warehouse_id;
  ELSE
    v_warehouse_name := NULL;
  END IF;

  -- Find the specific inventory item
  SELECT id INTO v_item_id
  FROM inventory_items
  WHERE tenant_id = NEW.tenant_id
    AND item_name = v_item_name
    AND item_category = 'production'
    AND is_active = true
    AND (
      (v_warehouse_name IS NOT NULL AND storage_location = v_warehouse_name)
      OR (v_warehouse_name IS NULL AND TRUE)
    )
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    -- Cancelled: release reservation only
    IF NEW.sale_status = 'cancelled' AND OLD.sale_status IN ('draft', 'confirmed', 'invoiced') THEN
      UPDATE inventory_items
      SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - NEW.quantity),
          updated_at = now()
      WHERE id = v_item_id;
    END IF;

    -- Delivered/completed: release reservation AND deduct from stock
    IF NEW.sale_status IN ('delivered', 'completed') AND OLD.sale_status IN ('draft', 'confirmed', 'invoiced') THEN
      UPDATE inventory_items
      SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - NEW.quantity),
          quantity_on_hand = GREATEST(0, COALESCE(quantity_on_hand, 0) - NEW.quantity),
          updated_at = now()
      WHERE id = v_item_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
