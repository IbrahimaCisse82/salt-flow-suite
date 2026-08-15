
-- 1. Inventory items
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.inventory_items ALTER COLUMN name SET DEFAULT '';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS total_stock_value numeric
  GENERATED ALWAYS AS (COALESCE(quantity, 0) * COALESCE(unit_cost, 0)) STORED;

CREATE OR REPLACE FUNCTION public.sync_inventory_item_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.item_name IS NULL OR NEW.item_name = '' THEN NEW.item_name := NEW.name; END IF;
  IF NEW.name IS NULL OR NEW.name = '' THEN NEW.name := NEW.item_name; END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_inventory_item_name() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_sync_inventory_item_name ON public.inventory_items;
CREATE TRIGGER trg_sync_inventory_item_name
BEFORE INSERT OR UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_item_name();

-- 2. Production records
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS warehouse_id uuid;

-- 3. Purchase order items
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS received_at timestamptz;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS received_by uuid;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS received_notes text;
ALTER TABLE public.purchase_order_items ALTER COLUMN description DROP NOT NULL;

-- 4. Purchase order history
ALTER TABLE public.purchase_order_history ADD COLUMN IF NOT EXISTS action_type text;
ALTER TABLE public.purchase_order_history ADD COLUMN IF NOT EXISTS action_by uuid;
ALTER TABLE public.purchase_order_history ALTER COLUMN action DROP NOT NULL;

-- 5. Quality tests
ALTER TABLE public.quality_tests ADD COLUMN IF NOT EXISTS impurities_level numeric;

-- 6. Profiles preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.update_own_profile(
  _full_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _avatar_url text DEFAULT NULL,
  _notification_preferences jsonb DEFAULT NULL,
  _security_preferences jsonb DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  UPDATE public.profiles p
  SET full_name = COALESCE(_full_name, p.full_name),
      phone = COALESCE(_phone, p.phone),
      avatar_url = COALESCE(_avatar_url, p.avatar_url),
      notification_preferences = COALESCE(_notification_preferences, p.notification_preferences),
      security_preferences = COALESCE(_security_preferences, p.security_preferences),
      updated_at = now()
  WHERE p.user_id = auth.uid()
  RETURNING * INTO result;

  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_own_profile(text, text, text, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_own_profile(text, text, text, jsonb, jsonb) TO authenticated;

-- 7. Default tenant_id on all public tables that require it
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.is_nullable = 'NO'
      AND c.column_default IS NULL
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT public.get_user_tenant_id(auth.uid())',
      r.table_name
    );
  END LOOP;
END $$;
