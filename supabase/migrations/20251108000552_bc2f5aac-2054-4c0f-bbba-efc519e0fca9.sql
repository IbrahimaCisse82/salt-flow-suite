-- Ajouter une colonne status à sales pour différencier commande/facture/livraison
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT 'draft';
COMMENT ON COLUMN sales.sale_status IS 'draft, confirmed, invoiced, delivered, completed';

-- Ajouter une colonne stock_updated à production_records pour tracer la mise à jour
ALTER TABLE production_records ADD COLUMN IF NOT EXISTS stock_updated BOOLEAN DEFAULT false;

-- Ajouter une colonne stock_updated à sales pour tracer la mise à jour
ALTER TABLE sales ADD COLUMN IF NOT EXISTS stock_updated BOOLEAN DEFAULT false;

-- Ajouter une colonne accounting_entry_id pour lier ventes et transactions comptables
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id);

-- Fonction pour mettre à jour les stocks lors de la production
CREATE OR REPLACE FUNCTION update_stock_on_production()
RETURNS TRIGGER AS $$
DECLARE
  existing_item_id UUID;
  item_name TEXT;
BEGIN
  -- Ne traiter que si c'est une nouvelle production ou si le stock n'a pas été mis à jour
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.stock_updated = false)) AND NEW.deleted_at IS NULL THEN
    
    -- Déterminer le nom de l'article selon le type de sel
    item_name := CASE 
      WHEN NEW.salt_type = 'gros' THEN 'Sel gros'
      WHEN NEW.salt_type = 'fin' THEN 'Sel fin'
      WHEN NEW.salt_type = 'iode' THEN 'Sel iodé'
      WHEN NEW.salt_type = 'export' THEN 'Sel export'
      ELSE 'Sel - ' || NEW.salt_type
    END;

    -- Vérifier si un article de stock existe déjà pour ce type de sel
    SELECT id INTO existing_item_id
    FROM inventory_items
    WHERE tenant_id = NEW.tenant_id
      AND item_name = item_name
      AND item_category = 'production'
    LIMIT 1;

    IF existing_item_id IS NOT NULL THEN
      -- Mettre à jour le stock existant
      UPDATE inventory_items
      SET 
        quantity_on_hand = quantity_on_hand + NEW.quantity,
        updated_at = now(),
        last_purchase_date = NEW.production_date
      WHERE id = existing_item_id;
    ELSE
      -- Créer un nouvel article de stock
      INSERT INTO inventory_items (
        tenant_id,
        item_name,
        item_code,
        item_category,
        quantity_on_hand,
        unit_of_measure,
        last_purchase_date,
        storage_location
      ) VALUES (
        NEW.tenant_id,
        item_name,
        'PROD-' || UPPER(SUBSTRING(NEW.salt_type, 1, 3)),
        'production',
        NEW.quantity,
        'kg',
        NEW.production_date,
        'Entrepôt principal'
      );
    END IF;

    -- Marquer comme mis à jour
    NEW.stock_updated := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour diminuer les stocks lors des ventes
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  existing_item_id UUID;
  item_name TEXT;
  available_quantity NUMERIC;
BEGIN
  -- Ne traiter que si c'est une vente confirmée et que le stock n'a pas été mis à jour
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.stock_updated = false)) 
     AND NEW.sale_status IN ('confirmed', 'invoiced', 'delivered', 'completed') 
     AND NEW.stock_updated = false THEN
    
    -- Déterminer le nom de l'article selon le type de sel
    item_name := CASE 
      WHEN NEW.salt_type = 'gros' THEN 'Sel gros'
      WHEN NEW.salt_type = 'fin' THEN 'Sel fin'
      WHEN NEW.salt_type = 'iode' THEN 'Sel iodé'
      WHEN NEW.salt_type = 'export' THEN 'Sel export'
      ELSE 'Sel - ' || NEW.salt_type
    END;

    -- Trouver l'article de stock correspondant
    SELECT id, quantity_on_hand INTO existing_item_id, available_quantity
    FROM inventory_items
    WHERE tenant_id = NEW.tenant_id
      AND item_name = item_name
      AND item_category = 'production'
    LIMIT 1;

    IF existing_item_id IS NOT NULL THEN
      -- Vérifier le stock disponible
      IF available_quantity < NEW.quantity THEN
        RAISE WARNING 'Stock insuffisant pour %: disponible %, demandé %', 
          item_name, available_quantity, NEW.quantity;
      END IF;

      -- Diminuer le stock
      UPDATE inventory_items
      SET 
        quantity_on_hand = quantity_on_hand - NEW.quantity,
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

-- Fonction pour créer une transaction comptable lors d'une vente
CREATE OR REPLACE FUNCTION create_accounting_entry_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  new_transaction_id UUID;
  account_vente_id UUID;
BEGIN
  -- Créer une écriture comptable uniquement pour les ventes confirmées ou facturées
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.sale_status != NEW.sale_status))
     AND NEW.sale_status IN ('invoiced', 'completed')
     AND NEW.transaction_id IS NULL THEN
    
    -- Trouver le compte de vente (701 - Ventes de produits finis en SYSCOHADA)
    SELECT id INTO account_vente_id
    FROM accounts
    WHERE tenant_id = NEW.tenant_id
      AND account_number LIKE '701%'
    LIMIT 1;

    -- Créer la transaction comptable
    INSERT INTO transactions (
      tenant_id,
      transaction_date,
      transaction_type,
      amount,
      description,
      account_id,
      reference_type,
      reference_id
    ) VALUES (
      NEW.tenant_id,
      COALESCE(NEW.sale_date, CURRENT_DATE),
      'recette',
      NEW.total_amount,
      'Vente - ' || COALESCE(NEW.invoice_number, 'N° ' || NEW.id),
      account_vente_id,
      'sale',
      NEW.id
    ) RETURNING id INTO new_transaction_id;

    -- Lier la vente à la transaction
    NEW.transaction_id := new_transaction_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour mettre à jour les stocks lors de la réception d'un achat
CREATE OR REPLACE FUNCTION update_stock_on_purchase_receipt()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  existing_item_id UUID;
BEGIN
  -- Traiter uniquement quand le statut passe à 'received'
  IF (TG_OP = 'UPDATE' AND OLD.status != 'received' AND NEW.status = 'received') THEN
    
    -- Pour chaque article de la commande
    FOR item_record IN 
      SELECT * FROM purchase_order_items WHERE purchase_order_id = NEW.id
    LOOP
      -- Vérifier si l'article existe déjà dans le stock
      SELECT id INTO existing_item_id
      FROM inventory_items
      WHERE tenant_id = NEW.tenant_id
        AND item_name = item_record.item_name
      LIMIT 1;

      IF existing_item_id IS NOT NULL THEN
        -- Mettre à jour le stock existant
        UPDATE inventory_items
        SET 
          quantity_on_hand = quantity_on_hand + item_record.received_quantity,
          last_purchase_date = NEW.actual_delivery_date,
          last_purchase_price = item_record.unit_price,
          updated_at = now()
        WHERE id = existing_item_id;
      ELSE
        -- Créer un nouvel article de stock
        INSERT INTO inventory_items (
          tenant_id,
          item_name,
          item_code,
          item_category,
          description,
          quantity_on_hand,
          unit_of_measure,
          unit_cost,
          last_purchase_date,
          last_purchase_price
        ) VALUES (
          NEW.tenant_id,
          item_record.item_name,
          'ACH-' || SUBSTRING(MD5(item_record.item_name), 1, 8),
          COALESCE(item_record.item_category, 'fourniture'),
          item_record.item_description,
          item_record.received_quantity,
          item_record.unit_of_measure,
          item_record.unit_price,
          NEW.actual_delivery_date,
          item_record.unit_price
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_update_stock_on_production ON production_records;
CREATE TRIGGER trigger_update_stock_on_production
  BEFORE INSERT OR UPDATE ON production_records
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_production();

DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sales;
CREATE TRIGGER trigger_update_stock_on_sale
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

DROP TRIGGER IF EXISTS trigger_create_accounting_entry_on_sale ON sales;
CREATE TRIGGER trigger_create_accounting_entry_on_sale
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION create_accounting_entry_on_sale();

DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase_receipt ON purchase_orders;
CREATE TRIGGER trigger_update_stock_on_purchase_receipt
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_purchase_receipt();