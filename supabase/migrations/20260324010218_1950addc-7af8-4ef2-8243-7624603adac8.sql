-- Table for multi-line sale orders (multiple products per sale)
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  salt_type text NOT NULL,
  warehouse_id uuid,
  warehouse_name text,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  amount_ht numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_tenant_id ON public.sale_items(tenant_id);

-- Enable RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS: tenant isolation
CREATE POLICY "Users can view sale items" ON public.sale_items
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Authorized roles can insert sale items" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) AND
    get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','commercial'])
  );

CREATE POLICY "Authorized roles can update sale items" ON public.sale_items
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND
    get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','commercial'])
  );

CREATE POLICY "Managers can delete sale items" ON public.sale_items
  FOR DELETE TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND
    get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant'])
  );