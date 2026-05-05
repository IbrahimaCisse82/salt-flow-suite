-- ENUMS
CREATE TYPE public.po_status AS ENUM ('draft','pending','approved','partial','received','cancelled');
CREATE TYPE public.purchase_payment_type AS ENUM ('advance','payment','refund');
CREATE TYPE public.stock_movement_type AS ENUM ('entry','exit','adjustment','transfer');
CREATE TYPE public.supplier_type AS ENUM ('fourniture','prestataire','transporteur');

-- SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  supplier_type supplier_type NOT NULL DEFAULT 'fourniture',
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  payment_terms TEXT,
  tax_id TEXT,
  registration_number TEXT,
  rating NUMERIC,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_suppliers_tenant ON public.suppliers(tenant_id);

CREATE POLICY suppliers_select ON public.suppliers FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY suppliers_insert ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY suppliers_delete ON public.suppliers FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- WAREHOUSES
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_warehouses_tenant ON public.warehouses(tenant_id);

CREATE POLICY warehouses_select ON public.warehouses FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY warehouses_insert ON public.warehouses FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY warehouses_update ON public.warehouses FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY warehouses_delete ON public.warehouses FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- INVENTORY ITEMS
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  warehouse_id UUID,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'unité',
  quantity NUMERIC NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  cmp NUMERIC NOT NULL DEFAULT 0,
  reorder_level NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inventory_items_tenant ON public.inventory_items(tenant_id);
CREATE INDEX idx_inventory_items_warehouse ON public.inventory_items(warehouse_id);

CREATE POLICY inv_select ON public.inventory_items FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY inv_insert ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY inv_update ON public.inventory_items FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY inv_delete ON public.inventory_items FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- STOCK MOVEMENTS
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  inventory_item_id UUID,
  item_name TEXT NOT NULL,
  movement_type stock_movement_type NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  previous_quantity NUMERIC NOT NULL DEFAULT 0,
  new_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'unité',
  warehouse TEXT,
  warehouse_from UUID,
  warehouse_to UUID,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stock_movements_tenant ON public.stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(inventory_item_id);

CREATE POLICY sm_select ON public.stock_movements FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY sm_insert ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));

-- STOCK RESERVATIONS
CREATE TABLE public.stock_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  quantity NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ
);
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stock_res_tenant ON public.stock_reservations(tenant_id);

CREATE POLICY sr_select ON public.stock_reservations FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY sr_ins ON public.stock_reservations FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'admin')));
CREATE POLICY sr_upd ON public.stock_reservations FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'commercial') OR has_role(auth.uid(),'admin')));
CREATE POLICY sr_del ON public.stock_reservations FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- INVENTORY VALUATIONS
CREATE TABLE public.inventory_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  inventory_item_id UUID NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  cmp NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_valuations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inv_val_tenant ON public.inventory_valuations(tenant_id);

CREATE POLICY iv_select ON public.inventory_valuations FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY iv_ins ON public.inventory_valuations FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));

-- PURCHASE ORDERS
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  supplier_id UUID,
  campagne_id UUID,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivery_date DATE,
  status po_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  received_by UUID,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_po_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE UNIQUE INDEX idx_po_number ON public.purchase_orders(tenant_id, order_number);

CREATE POLICY po_select ON public.purchase_orders FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY po_ins ON public.purchase_orders FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY po_upd ON public.purchase_orders FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY po_del ON public.purchase_orders FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- PURCHASE ORDER ITEMS
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL,
  inventory_item_id UUID,
  expense_type_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  received_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'unité',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_poi_tenant ON public.purchase_order_items(tenant_id);
CREATE INDEX idx_poi_order ON public.purchase_order_items(purchase_order_id);

CREATE POLICY poi_select ON public.purchase_order_items FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY poi_ins ON public.purchase_order_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY poi_upd ON public.purchase_order_items FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')));
CREATE POLICY poi_del ON public.purchase_order_items FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- PURCHASE PAYMENTS
CREATE TABLE public.purchase_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL,
  payment_type purchase_payment_type NOT NULL DEFAULT 'payment',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID,
  transaction_id UUID,
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pp_tenant ON public.purchase_payments(tenant_id);
CREATE INDEX idx_pp_order ON public.purchase_payments(purchase_order_id);

CREATE POLICY pp_select ON public.purchase_payments FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY pp_ins ON public.purchase_payments FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY pp_upd ON public.purchase_payments FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY pp_del ON public.purchase_payments FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- PURCHASE NOTIFICATIONS
CREATE TABLE public.purchase_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  purchase_order_id UUID,
  notification_type TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_actioned BOOLEAN NOT NULL DEFAULT false,
  actioned_at TIMESTAMPTZ,
  actioned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pn_tenant ON public.purchase_notifications(tenant_id);

CREATE POLICY pn_select ON public.purchase_notifications FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY pn_ins ON public.purchase_notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY pn_upd ON public.purchase_notifications FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY pn_del ON public.purchase_notifications FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- TRIGGERS updated_at
CREATE TRIGGER trg_suppliers_uat BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_warehouses_uat BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_inv_uat BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_po_uat BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_poi_uat BEFORE UPDATE ON public.purchase_order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Restrict SECURITY DEFINER (none added in this migration, but seed exists already)

-- Function: handle PO reception → update stock with CMP
CREATE OR REPLACE FUNCTION public.apply_po_item_reception()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _delta NUMERIC;
  _item RECORD;
  _new_qty NUMERIC;
  _new_cmp NUMERIC;
BEGIN
  IF NEW.inventory_item_id IS NULL THEN RETURN NEW; END IF;
  _delta := COALESCE(NEW.received_quantity,0) - COALESCE(OLD.received_quantity,0);
  IF _delta = 0 THEN RETURN NEW; END IF;

  SELECT * INTO _item FROM public.inventory_items WHERE id = NEW.inventory_item_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF _delta > 0 THEN
    _new_qty := _item.quantity + _delta;
    IF _new_qty > 0 THEN
      _new_cmp := ((_item.quantity * _item.cmp) + (_delta * COALESCE(NEW.unit_price,0))) / _new_qty;
    ELSE
      _new_cmp := _item.cmp;
    END IF;
  ELSE
    _new_qty := _item.quantity + _delta;
    _new_cmp := _item.cmp;
  END IF;

  UPDATE public.inventory_items
    SET quantity = _new_qty,
        cmp = _new_cmp,
        unit_cost = _new_cmp,
        updated_at = now()
    WHERE id = NEW.inventory_item_id;

  INSERT INTO public.stock_movements (tenant_id, inventory_item_id, item_name, movement_type, quantity, previous_quantity, new_quantity, unit_cost, unit_of_measure, reference_type, reference_id, notes)
  VALUES (NEW.tenant_id, NEW.inventory_item_id, _item.name,
    CASE WHEN _delta > 0 THEN 'entry'::stock_movement_type ELSE 'adjustment'::stock_movement_type END,
    ABS(_delta), _item.quantity, _new_qty, COALESCE(NEW.unit_price,0), _item.unit_of_measure,
    'purchase_order', NEW.purchase_order_id, 'Réception bon de commande');

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_po_item_reception() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_poi_reception
AFTER UPDATE OF received_quantity ON public.purchase_order_items
FOR EACH ROW
WHEN (NEW.received_quantity IS DISTINCT FROM OLD.received_quantity)
EXECUTE FUNCTION public.apply_po_item_reception();

-- Function: prevent modifications on fully received POs
CREATE OR REPLACE FUNCTION public.prevent_modify_received_po()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'received' AND NEW.status = 'received' THEN
    RAISE EXCEPTION 'Bon de commande déjà livré : modification interdite';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_po_lock
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_modify_received_po();