-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'chef_exploitation', 'contremaitre', 'comptable', 'operateur');
CREATE TYPE bassin_status AS ENUM ('actif', 'maintenance', 'repos', 'preparation');
CREATE TYPE campagne_status AS ENUM ('planification', 'en_cours', 'terminee', 'annulee');
CREATE TYPE salt_type AS ENUM ('gros', 'fin', 'iode', 'industriel', 'export');
CREATE TYPE employee_type AS ENUM ('permanent', 'journalier');
CREATE TYPE client_type AS ENUM ('grossiste', 'detaillant', 'industriel', 'exportateur', 'cooperative');

-- ============================================
-- TENANTS (Multi-tenant architecture)
-- ============================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES (User management)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'operateur',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BASSINS (Salt ponds)
-- ============================================
CREATE TABLE public.bassins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  surface_area DECIMAL(10,2) NOT NULL,
  sector TEXT,
  status bassin_status DEFAULT 'actif',
  salinity DECIMAL(5,2),
  water_level DECIMAL(5,2),
  humidity DECIMAL(5,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE public.bassins ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_bassins_tenant ON public.bassins(tenant_id);
CREATE INDEX idx_bassins_status ON public.bassins(status);

-- ============================================
-- CAMPAGNES (Production campaigns)
-- ============================================
CREATE TABLE public.campagnes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status campagne_status DEFAULT 'planification',
  target_production DECIMAL(12,2),
  actual_production DECIMAL(12,2) DEFAULT 0,
  budget_total DECIMAL(15,2),
  revenue_forecast DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campagnes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campagnes_tenant ON public.campagnes(tenant_id);
CREATE INDEX idx_campagnes_status ON public.campagnes(status);

-- ============================================
-- PRODUCTION RECORDS (Daily production tracking)
-- ============================================
CREATE TABLE public.production_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campagne_id UUID REFERENCES public.campagnes(id) ON DELETE SET NULL,
  bassin_id UUID NOT NULL REFERENCES public.bassins(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  salt_type salt_type NOT NULL,
  quality_grade INTEGER CHECK (quality_grade >= 1 AND quality_grade <= 5),
  salinity DECIMAL(5,2),
  humidity DECIMAL(5,2),
  weather_conditions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_production_tenant ON public.production_records(tenant_id);
CREATE INDEX idx_production_date ON public.production_records(date);

-- ============================================
-- HARVESTS (Récoltes)
-- ============================================
CREATE TABLE public.harvests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campagne_id UUID REFERENCES public.campagnes(id) ON DELETE SET NULL,
  bassin_id UUID NOT NULL REFERENCES public.bassins(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  salt_type salt_type NOT NULL,
  team_size INTEGER,
  cost_per_ton DECIMAL(10,2),
  lot_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_harvests_tenant ON public.harvests(tenant_id);
CREATE INDEX idx_harvests_date ON public.harvests(date);

-- ============================================
-- WAREHOUSES (Entrepôts)
-- ============================================
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location TEXT,
  capacity DECIMAL(12,2) NOT NULL,
  current_stock DECIMAL(12,2) DEFAULT 0,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_warehouses_tenant ON public.warehouses(tenant_id);

-- ============================================
-- STOCKS (Inventory management)
-- ============================================
CREATE TABLE public.stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  salt_type salt_type NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  lot_number TEXT,
  harvest_date DATE,
  expiry_date DATE,
  quality_grade INTEGER CHECK (quality_grade >= 1 AND quality_grade <= 5),
  unit_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_stocks_tenant ON public.stocks(tenant_id);
CREATE INDEX idx_stocks_warehouse ON public.stocks(warehouse_id);

-- ============================================
-- EMPLOYEES (Permanent employees)
-- ============================================
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_type employee_type NOT NULL DEFAULT 'permanent',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  specialization TEXT,
  hire_date DATE,
  salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_employees_tenant ON public.employees(tenant_id);
CREATE INDEX idx_employees_active ON public.employees(is_active);

-- ============================================
-- DAILY WORKERS (Journaliers)
-- ============================================
CREATE TABLE public.daily_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  daily_rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_workers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_daily_workers_tenant ON public.daily_workers(tenant_id);

-- ============================================
-- WORK LOGS (Pointage)
-- ============================================
CREATE TABLE public.work_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.daily_workers(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL,
  task_description TEXT,
  bassin_id UUID REFERENCES public.bassins(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (worker_id IS NOT NULL OR employee_id IS NOT NULL)
);

ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_work_logs_tenant ON public.work_logs(tenant_id);
CREATE INDEX idx_work_logs_date ON public.work_logs(date);

-- ============================================
-- CLIENTS (Customers)
-- ============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_type client_type NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX idx_clients_active ON public.clients(is_active);

-- ============================================
-- SALES (Ventes)
-- ============================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  invoice_number TEXT,
  salt_type salt_type NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_sales_client ON public.sales(client_id);

-- ============================================
-- QUALITY CONTROLS (Contrôles qualité)
-- ============================================
CREATE TABLE public.quality_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  lot_number TEXT,
  salt_type salt_type NOT NULL,
  salinity DECIMAL(5,2),
  humidity DECIMAL(5,2),
  iodine_level DECIMAL(5,2),
  granulometry TEXT,
  purity DECIMAL(5,2),
  passed BOOLEAN,
  lab_name TEXT,
  certificate_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quality_controls ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_quality_controls_tenant ON public.quality_controls(tenant_id);
CREATE INDEX idx_quality_controls_date ON public.quality_controls(test_date);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Tenants policies
CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Bassins policies
CREATE POLICY "Users can view bassins in their tenant"
  ON public.bassins FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage bassins in their tenant"
  ON public.bassins FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Campagnes policies
CREATE POLICY "Users can view campagnes in their tenant"
  ON public.campagnes FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage campagnes in their tenant"
  ON public.campagnes FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Production records policies
CREATE POLICY "Users can view production records in their tenant"
  ON public.production_records FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage production records in their tenant"
  ON public.production_records FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Harvests policies
CREATE POLICY "Users can view harvests in their tenant"
  ON public.harvests FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage harvests in their tenant"
  ON public.harvests FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Warehouses policies
CREATE POLICY "Users can view warehouses in their tenant"
  ON public.warehouses FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage warehouses in their tenant"
  ON public.warehouses FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Stocks policies
CREATE POLICY "Users can view stocks in their tenant"
  ON public.stocks FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage stocks in their tenant"
  ON public.stocks FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Employees policies
CREATE POLICY "Users can view employees in their tenant"
  ON public.employees FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage employees in their tenant"
  ON public.employees FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Daily workers policies
CREATE POLICY "Users can view daily workers in their tenant"
  ON public.daily_workers FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage daily workers in their tenant"
  ON public.daily_workers FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Work logs policies
CREATE POLICY "Users can view work logs in their tenant"
  ON public.work_logs FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage work logs in their tenant"
  ON public.work_logs FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Clients policies
CREATE POLICY "Users can view clients in their tenant"
  ON public.clients FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage clients in their tenant"
  ON public.clients FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Sales policies
CREATE POLICY "Users can view sales in their tenant"
  ON public.sales FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage sales in their tenant"
  ON public.sales FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Quality controls policies
CREATE POLICY "Users can view quality controls in their tenant"
  ON public.quality_controls FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage quality controls in their tenant"
  ON public.quality_controls FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bassins_updated_at BEFORE UPDATE ON public.bassins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campagnes_updated_at BEFORE UPDATE ON public.campagnes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_records_updated_at BEFORE UPDATE ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvests_updated_at BEFORE UPDATE ON public.harvests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON public.stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_workers_updated_at BEFORE UPDATE ON public.daily_workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_controls_updated_at BEFORE UPDATE ON public.quality_controls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, email, full_name, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::uuid,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operateur')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();