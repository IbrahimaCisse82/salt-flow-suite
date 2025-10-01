-- Add subdomain to tenants
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Create bassins table (salt marshes/ponds)
CREATE TABLE IF NOT EXISTS public.bassins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area DECIMAL(15,2),
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bassins ENABLE ROW LEVEL SECURITY;

-- Add bassin_id to production_records
ALTER TABLE public.production_records 
  ADD COLUMN IF NOT EXISTS bassin_id UUID REFERENCES public.bassins(id);

-- RLS Policies for bassins
CREATE POLICY "Users can view bassins in their tenant"
  ON public.bassins FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage bassins"
  ON public.bassins FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- Add trigger for bassins
CREATE TRIGGER update_bassins_updated_at BEFORE UPDATE ON public.bassins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();