-- Fix: Don't log stock movements for warehouse-type inventory items
CREATE OR REPLACE FUNCTION public.log_stock_movement_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip warehouse items - they are not stock movements
  IF NEW.item_category = 'warehouse' THEN
    RETURN NEW;
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix the update trigger
CREATE OR REPLACE FUNCTION public.log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip warehouse items
  IF NEW.item_category = 'warehouse' THEN
    RETURN NEW;
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Clean up the parasitic warehouse movement
DELETE FROM public.stock_movements 
WHERE inventory_item_id IN (
  SELECT id FROM public.inventory_items WHERE item_category = 'warehouse'
);