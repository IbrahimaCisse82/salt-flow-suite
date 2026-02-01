-- =====================================================
-- Trigger: Réception automatique de stock (Achats)
-- Lorsqu'une commande passe à "received", les articles 
-- sont automatiquement ajoutés à l'inventaire
-- =====================================================

-- Fonction pour gérer la réception de stock
CREATE OR REPLACE FUNCTION public.handle_purchase_order_stock_reception()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  existing_inventory_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Déclencher seulement quand le statut passe à 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    -- Récupérer le tenant_id de la commande
    v_tenant_id := NEW.tenant_id;
    
    -- Parcourir tous les articles de la commande
    FOR item_record IN 
      SELECT * FROM purchase_order_items 
      WHERE purchase_order_id = NEW.id
    LOOP
      -- Chercher si l'article existe déjà dans l'inventaire (par nom et catégorie)
      SELECT id INTO existing_inventory_id
      FROM inventory_items
      WHERE tenant_id = v_tenant_id
        AND item_name = item_record.item_name
        AND (item_category = item_record.item_category OR (item_category IS NULL AND item_record.item_category IS NULL))
      LIMIT 1;
      
      IF existing_inventory_id IS NOT NULL THEN
        -- Mettre à jour l'article existant
        UPDATE inventory_items
        SET 
          quantity_on_hand = COALESCE(quantity_on_hand, 0) + item_record.quantity,
          last_purchase_date = NEW.actual_delivery_date,
          last_purchase_price = item_record.unit_price,
          unit_cost = item_record.unit_price,
          updated_at = NOW()
        WHERE id = existing_inventory_id;
        
        -- Mettre à jour la quantité reçue sur la ligne de commande
        UPDATE purchase_order_items
        SET received_quantity = COALESCE(received_quantity, 0) + item_record.quantity
        WHERE id = item_record.id;
      ELSE
        -- Créer un nouvel article dans l'inventaire
        INSERT INTO inventory_items (
          tenant_id,
          item_name,
          item_category,
          description,
          quantity_on_hand,
          unit_of_measure,
          unit_cost,
          last_purchase_date,
          last_purchase_price,
          is_active
        ) VALUES (
          v_tenant_id,
          item_record.item_name,
          item_record.item_category,
          item_record.item_description,
          item_record.quantity,
          item_record.unit_of_measure,
          item_record.unit_price,
          NEW.actual_delivery_date,
          item_record.unit_price,
          true
        );
        
        -- Mettre à jour la quantité reçue sur la ligne de commande
        UPDATE purchase_order_items
        SET received_quantity = item_record.quantity
        WHERE id = item_record.id;
      END IF;
    END LOOP;
    
    -- Créer une notification pour le comptable
    INSERT INTO accountant_notifications (
      tenant_id,
      notification_type,
      title,
      message,
      amount,
      reference_id
    ) VALUES (
      v_tenant_id,
      'purchase_received',
      'Réception de commande',
      'Commande ' || NEW.order_number || ' réceptionnée - Stock mis à jour automatiquement',
      COALESCE(NEW.total_amount, 0),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_purchase_order_stock_reception ON purchase_orders;

-- Créer le trigger
CREATE TRIGGER trigger_purchase_order_stock_reception
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_order_stock_reception();

-- Ajouter un commentaire pour documentation
COMMENT ON FUNCTION public.handle_purchase_order_stock_reception() IS 
'Gère la réception automatique de stock : quand une commande passe à "received", 
les articles sont ajoutés/mis à jour dans inventory_items et une notification est créée.';