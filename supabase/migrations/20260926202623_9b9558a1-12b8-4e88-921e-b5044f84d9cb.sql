CREATE OR REPLACE FUNCTION public.validate_sale_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _stock numeric; _rejected boolean;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantité invalide : elle doit être strictement positive';
  END IF;
  IF COALESCE(NEW.unit_price,0) < 0 OR COALESCE(NEW.total_price,0) < 0 THEN
    RAISE EXCEPTION 'Prix invalide : il ne peut pas être négatif';
  END IF;
  IF NEW.inventory_item_id IS NOT NULL THEN
    SELECT quantity INTO _stock FROM inventory_items WHERE id = NEW.inventory_item_id FOR UPDATE;
    IF _stock IS NOT NULL AND NEW.quantity > _stock THEN
      RAISE EXCEPTION 'Stock insuffisant : % t demandées, % t disponibles', NEW.quantity, _stock;
    END IF;
  END IF;
  IF NEW.production_record_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM quality_tests WHERE production_record_id = NEW.production_record_id
                   AND status = 'rejected' AND deleted_at IS NULL) INTO _rejected;
    IF _rejected THEN
      RAISE EXCEPTION 'Lot non conforme : vente interdite';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_sale_item ON public.sale_items;
CREATE TRIGGER trg_validate_sale_item BEFORE INSERT OR UPDATE OF quantity, unit_price, total_price, inventory_item_id, production_record_id
ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.validate_sale_item();

CREATE OR REPLACE FUNCTION public.validate_bassin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.surface_m2 IS NOT NULL AND NEW.surface_m2 <= 0) OR (NEW.area IS NOT NULL AND NEW.area <= 0) THEN
    RAISE EXCEPTION 'Superficie invalide : elle doit être strictement positive';
  END IF;
  IF NEW.capacity_tonnes IS NOT NULL AND NEW.capacity_tonnes <= 0 THEN
    RAISE EXCEPTION 'Capacité invalide : elle doit être strictement positive';
  END IF;
  IF NEW.deleted_at IS NULL AND EXISTS (SELECT 1 FROM bassins WHERE tenant_id = NEW.tenant_id
      AND lower(trim(name)) = lower(trim(NEW.name)) AND id <> NEW.id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Un bassin nommé "%" existe déjà', NEW.name;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_bassin ON public.bassins;
CREATE TRIGGER trg_validate_bassin BEFORE INSERT OR UPDATE OF name, surface_m2, area, capacity_tonnes, deleted_at
ON public.bassins FOR EACH ROW EXECUTE FUNCTION public.validate_bassin();

CREATE OR REPLACE FUNCTION public.validate_po_item()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN RAISE EXCEPTION 'Quantité commandée invalide'; END IF;
  IF COALESCE(NEW.unit_price,0) < 0 THEN RAISE EXCEPTION 'Prix unitaire invalide'; END IF;
  IF COALESCE(NEW.received_quantity,0) < 0 THEN RAISE EXCEPTION 'Quantité reçue invalide'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_po_item ON public.purchase_order_items;
CREATE TRIGGER trg_validate_po_item BEFORE INSERT OR UPDATE OF quantity, unit_price, received_quantity
ON public.purchase_order_items FOR EACH ROW EXECUTE FUNCTION public.validate_po_item();

REVOKE EXECUTE ON FUNCTION public.validate_sale_item(), public.validate_bassin() FROM PUBLIC, anon;