CREATE OR REPLACE FUNCTION public.validate_sale_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _stock numeric; _rejected boolean; _wh text; _label text;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide : elle doit être strictement positive';
  END IF;
  IF COALESCE(NEW.unit_price,0) < 0 OR COALESCE(NEW.total_price,0) < 0 THEN
    RAISE EXCEPTION 'Prix invalide : il ne peut pas être négatif';
  END IF;
  IF NEW.inventory_item_id IS NOT NULL THEN
    SELECT quantity - COALESCE(reserved_quantity,0) INTO _stock FROM inventory_items WHERE id = NEW.inventory_item_id FOR UPDATE;
  ELSIF NEW.warehouse_id IS NOT NULL THEN
    SELECT name INTO _wh FROM inventory_items WHERE id = NEW.warehouse_id;
    _label := CASE lower(COALESCE(NEW.salt_type,'')) WHEN 'gros' THEN 'Sel gros' WHEN 'fin' THEN 'Sel fin'
               WHEN 'iode' THEN 'Sel iodé' WHEN 'raffine' THEN 'Sel raffiné' ELSE NEW.salt_type END;
    SELECT COALESCE(sum(quantity - COALESCE(reserved_quantity,0)),0) INTO _stock
      FROM inventory_items
     WHERE tenant_id = NEW.tenant_id AND category = 'production' AND deleted_at IS NULL
       AND (warehouse_id = NEW.warehouse_id OR storage_location = _wh)
       AND (_label IS NULL OR lower(name) = lower(_label) OR name ILIKE '%'||COALESCE(NEW.salt_type,'')||'%');
  END IF;
  IF _stock IS NOT NULL AND NEW.quantity > _stock THEN
    RAISE EXCEPTION 'Stock insuffisant : % t demandées, % t disponibles', NEW.quantity, _stock;
  END IF;
  IF NEW.production_record_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM quality_tests WHERE production_record_id = NEW.production_record_id
                   AND status = 'rejected' AND deleted_at IS NULL) INTO _rejected;
    IF _rejected THEN RAISE EXCEPTION 'Lot non conforme : vente interdite'; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.validate_sale_item() FROM PUBLIC, anon, authenticated;