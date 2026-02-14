-- Add warehouse_id to production_records
ALTER TABLE public.production_records 
ADD COLUMN warehouse_id UUID REFERENCES public.inventory_items(id);

-- Update production trigger: stock goes to selected warehouse's inventory
-- Each inventory_item is now per salt_type + warehouse combination
CREATE OR REPLACE FUNCTION public.update_stock_on_production()
RETURNS TRIGGER AS $$
DECLARE
  existing_item_id UUID;
  v_item_name TEXT;
  v_warehouse_name TEXT;
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.stock_updated = false)) AND NEW.deleted_at IS NULL THEN
    
    v_item_name := CASE 
      WHEN LOWER(NEW.salt_type) = 'gros' OR LOWER(NEW.salt_type) = 'sel gros' THEN 'Sel gros'
      WHEN LOWER(NEW.salt_type) = 'fin' OR LOWER(NEW.salt_type) = 'sel fin' THEN 'Sel fin'
      WHEN LOWER(NEW.salt_type) = 'iode' OR LOWER(NEW.salt_type) = 'sel iodé' OR LOWER(NEW.salt_type) = 'sel iode' THEN 'Sel iodé'
      WHEN LOWER(NEW.salt_type) = 'export' OR LOWER(NEW.salt_type) = 'sel export' THEN 'Sel export'
      ELSE NEW.salt_type
    END;

    -- Get warehouse name if specified
    IF NEW.warehouse_id IS NOT NULL THEN
      SELECT item_name INTO v_warehouse_name
      FROM inventory_items WHERE id = NEW.warehouse_id;
    ELSE
      v_warehouse_name := NULL;
    END IF;

    -- Find existing item for this salt_type + warehouse combination
    SELECT id INTO existing_item_id
    FROM inventory_items
    WHERE tenant_id = NEW.tenant_id
      AND inventory_items.item_name = v_item_name
      AND item_category = 'production'
      AND (
        (v_warehouse_name IS NOT NULL AND storage_location = v_warehouse_name)
        OR (v_warehouse_name IS NULL AND storage_location IS NULL)
      )
    LIMIT 1;

    IF existing_item_id IS NOT NULL THEN
      UPDATE inventory_items
      SET 
        quantity_on_hand = quantity_on_hand + NEW.quantity,
        updated_at = now(),
        last_purchase_date = NEW.production_date
      WHERE id = existing_item_id;
    ELSE
      INSERT INTO inventory_items (
        tenant_id, item_name, item_code, item_category,
        quantity_on_hand, unit_of_measure, last_purchase_date, storage_location
      ) VALUES (
        NEW.tenant_id, v_item_name,
        'PROD-' || UPPER(SUBSTRING(NEW.salt_type, 1, 3)),
        'production', NEW.quantity, 'tonnes',
        NEW.production_date, v_warehouse_name
      );
    END IF;

    NEW.stock_updated := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;