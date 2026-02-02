-- =====================================================
-- Correction du trigger de vente pour conversion kg/tonnes
-- et meilleure gestion des statuts
-- =====================================================

-- Fonction corrigée pour diminuer les stocks lors des ventes
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  existing_item_id UUID;
  item_name TEXT;
  available_quantity NUMERIC;
  quantity_to_deduct NUMERIC;
  item_unit TEXT;
BEGIN
  -- Ne traiter que si le stock n'a pas été mis à jour ET statut valide
  IF NEW.stock_updated = false 
     AND NEW.sale_status IN ('confirmed', 'invoiced', 'delivered', 'completed') THEN
    
    -- Déterminer le nom de l'article selon le type de sel
    item_name := CASE 
      WHEN LOWER(NEW.salt_type) IN ('gros', 'sel gros') THEN 'Sel gros'
      WHEN LOWER(NEW.salt_type) IN ('fin', 'sel fin') THEN 'Sel fin'
      WHEN LOWER(NEW.salt_type) IN ('iode', 'iodé', 'sel iodé') THEN 'Sel iodé'
      WHEN LOWER(NEW.salt_type) IN ('export', 'sel export') THEN 'Sel export'
      ELSE 'Sel - ' || NEW.salt_type
    END;

    -- Trouver l'article de stock correspondant
    SELECT id, quantity_on_hand, unit_of_measure 
    INTO existing_item_id, available_quantity, item_unit
    FROM inventory_items
    WHERE tenant_id = NEW.tenant_id
      AND item_name = item_name
      AND item_category = 'production'
    LIMIT 1;

    IF existing_item_id IS NOT NULL THEN
      -- Conversion: si l'inventaire est en tonnes, convertir la quantité kg en tonnes
      quantity_to_deduct := CASE 
        WHEN item_unit IN ('tonnes', 'tonne', 't') THEN NEW.quantity / 1000.0
        ELSE NEW.quantity  -- déjà en kg
      END;
      
      -- Vérifier le stock disponible
      IF available_quantity < quantity_to_deduct THEN
        RAISE WARNING 'Stock insuffisant pour %: disponible % %, demandé % kg', 
          item_name, available_quantity, COALESCE(item_unit, 'kg'), NEW.quantity;
        -- On continue quand même mais on enregistre l'alerte
      END IF;

      -- Diminuer le stock
      UPDATE inventory_items
      SET 
        quantity_on_hand = GREATEST(0, quantity_on_hand - quantity_to_deduct),
        updated_at = now()
      WHERE id = existing_item_id;

      -- Marquer la vente comme ayant mis à jour le stock
      NEW.stock_updated := true;
    ELSE
      RAISE WARNING 'Aucun article de stock trouvé pour %', item_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ajouter un commentaire pour documentation
COMMENT ON FUNCTION update_stock_on_sale() IS 
'Diminue le stock lors de la confirmation d''une vente. 
Gère la conversion kg→tonnes si nécessaire.
Déclenché pour sale_status IN (confirmed, invoiced, delivered, completed).';