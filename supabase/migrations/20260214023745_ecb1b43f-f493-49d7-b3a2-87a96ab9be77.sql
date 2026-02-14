
-- 1. Drop the conflicting old trigger that deducts stock on confirmation
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
DROP FUNCTION IF EXISTS update_stock_on_sale();

-- 2. Replace manage_stock_reservation to also log a stock_movement on delivery
CREATE OR REPLACE FUNCTION manage_stock_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_item_name TEXT;
  v_item_id UUID;
  v_warehouse_name TEXT;
  v_previous_qty NUMERIC;
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
    -- Get current quantity for movement logging
    SELECT COALESCE(quantity_on_hand, 0) INTO v_previous_qty
    FROM inventory_items WHERE id = v_item_id;

    -- Cancelled: release reservation only
    IF NEW.sale_status = 'cancelled' AND OLD.sale_status IN ('draft', 'confirmed', 'invoiced') THEN
      UPDATE inventory_items
      SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - NEW.quantity),
          updated_at = now()
      WHERE id = v_item_id;
    END IF;

    -- Delivered/completed: release reservation AND deduct from stock definitively
    IF NEW.sale_status IN ('delivered', 'completed') AND OLD.sale_status IN ('draft', 'confirmed', 'invoiced') THEN
      UPDATE inventory_items
      SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - NEW.quantity),
          quantity_on_hand = GREATEST(0, COALESCE(quantity_on_hand, 0) - NEW.quantity),
          updated_at = now()
      WHERE id = v_item_id;

      -- Log stock movement for traceability
      INSERT INTO stock_movements (
        tenant_id, inventory_item_id, item_name, movement_type, quantity,
        previous_quantity, new_quantity, unit_of_measure,
        reference_type, reference_id, warehouse, notes
      ) VALUES (
        NEW.tenant_id, v_item_id, v_item_name, 'exit', NEW.quantity,
        v_previous_qty, GREATEST(0, v_previous_qty - NEW.quantity), 'tonnes',
        'sale', NEW.id, COALESCE(v_warehouse_name, 'Non assigné'),
        'Livraison commande - Client: ' || COALESCE(
          (SELECT name FROM clients WHERE id = NEW.client_id), 'N/A'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
