
-- Vague 1: Colonnes & alias manquants (non destructif)

-- inventory_items: item_code (identifiant produit distinct du sku)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS item_code text;
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_code
  ON public.inventory_items(tenant_id, item_code);

-- inventory_valuation_layers: total_value (alias généré) + notes
ALTER TABLE public.inventory_valuation_layers
  ADD COLUMN IF NOT EXISTS notes text;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='inventory_valuation_layers'
       AND column_name='total_value'
  ) THEN
    ALTER TABLE public.inventory_valuation_layers
      ADD COLUMN total_value numeric(15,2)
      GENERATED ALWAYS AS (total_cost) STORED;
  END IF;
END $$;

-- purchase_order_items: notes (alias généré sur received_notes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='purchase_order_items'
       AND column_name='notes'
  ) THEN
    ALTER TABLE public.purchase_order_items
      ADD COLUMN notes text GENERATED ALWAYS AS (received_notes) STORED;
  END IF;
END $$;

-- quality_tests: humidity_level (alias généré sur humidity_percent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='quality_tests'
       AND column_name='humidity_level'
  ) THEN
    ALTER TABLE public.quality_tests
      ADD COLUMN humidity_level numeric GENERATED ALWAYS AS (humidity_percent) STORED;
  END IF;
END $$;
