-- Table pour les fournisseurs
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Informations de base
  name TEXT NOT NULL,
  supplier_type TEXT NOT NULL DEFAULT 'goods' CHECK (supplier_type IN ('goods', 'services', 'equipment')),
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Informations fiscales
  tax_id TEXT,
  registration_number TEXT,
  
  -- Statut et métadonnées
  is_active BOOLEAN DEFAULT true,
  payment_terms TEXT DEFAULT '30_days' CHECK (payment_terms IN ('immediate', '15_days', '30_days', '60_days', '90_days')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX idx_suppliers_tenant ON public.suppliers(tenant_id);
CREATE INDEX idx_suppliers_active ON public.suppliers(is_active);

-- RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers"
  ON public.suppliers FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can create suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  );

CREATE POLICY "Managers can update suppliers"
  ON public.suppliers FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  );

CREATE POLICY "Managers can delete suppliers"
  ON public.suppliers FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  );

-- Trigger
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour les bons de commande
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  
  -- Informations commande
  order_number TEXT UNIQUE NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  
  -- Montants
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  
  -- Métadonnées
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX idx_purchase_orders_tenant ON public.purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_number ON public.purchase_orders(order_number);

-- RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can create purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  );

CREATE POLICY "Managers can update purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  );

CREATE POLICY "Managers can delete purchase orders"
  ON public.purchase_orders FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  );

-- Trigger
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour les lignes de commande
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  
  -- Informations produit
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_category TEXT,
  
  -- Quantités
  quantity NUMERIC NOT NULL,
  unit_of_measure TEXT DEFAULT 'unit',
  received_quantity NUMERIC DEFAULT 0,
  
  -- Prix
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Métadonnées
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX idx_purchase_order_items_order ON public.purchase_order_items(purchase_order_id);

-- RLS (hérite de la commande)
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase order items"
  ON public.purchase_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders 
    WHERE id = purchase_order_items.purchase_order_id 
    AND tenant_id = get_user_tenant_id(auth.uid())
  ));

CREATE POLICY "Managers can create purchase order items"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchase_orders 
    WHERE id = purchase_order_items.purchase_order_id 
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  ));

CREATE POLICY "Managers can update purchase order items"
  ON public.purchase_order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders 
    WHERE id = purchase_order_items.purchase_order_id 
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  ));

CREATE POLICY "Managers can delete purchase order items"
  ON public.purchase_order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders 
    WHERE id = purchase_order_items.purchase_order_id 
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'gerant')
  ));

-- Trigger
CREATE TRIGGER update_purchase_order_items_updated_at
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour l'inventaire des fournitures
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Informations produit
  item_name TEXT NOT NULL,
  item_code TEXT,
  item_category TEXT,
  description TEXT,
  
  -- Stock
  quantity_on_hand NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 0,
  unit_of_measure TEXT DEFAULT 'unit',
  
  -- Prix
  unit_cost NUMERIC,
  last_purchase_price NUMERIC,
  last_purchase_date DATE,
  
  -- Localisation
  storage_location TEXT,
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX idx_inventory_items_tenant ON public.inventory_items(tenant_id);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(item_category);
CREATE INDEX idx_inventory_items_code ON public.inventory_items(item_code);

-- RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory items"
  ON public.inventory_items FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage inventory items"
  ON public.inventory_items FOR ALL
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable', 'production')
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable', 'production')
  );

-- Trigger
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();