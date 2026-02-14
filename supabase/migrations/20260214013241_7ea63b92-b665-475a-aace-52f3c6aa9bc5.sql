
CREATE OR REPLACE FUNCTION public.update_stock_on_production()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_item_id UUID;
  v_item_name TEXT;
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.stock_updated = false)) AND NEW.deleted_at IS NULL THEN
    
    v_item_name := CASE 
      WHEN NEW.salt_type = 'gros' THEN 'Sel gros'
      WHEN NEW.salt_type = 'fin' THEN 'Sel fin'
      WHEN NEW.salt_type = 'iode' THEN 'Sel iodé'
      WHEN NEW.salt_type = 'export' THEN 'Sel export'
      ELSE 'Sel - ' || NEW.salt_type
    END;

    SELECT id INTO existing_item_id
    FROM inventory_items
    WHERE tenant_id = NEW.tenant_id
      AND inventory_items.item_name = v_item_name
      AND item_category = 'production'
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
        'production', NEW.quantity, 'kg',
        NEW.production_date, 'Entrepôt principal'
      );
    END IF;

    NEW.stock_updated := true;
  END IF;

  RETURN NEW;
END;
$function$;
