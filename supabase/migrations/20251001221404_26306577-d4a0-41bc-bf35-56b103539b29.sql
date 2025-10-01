-- Add missing columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add missing column to tenants
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add missing columns to campagnes
ALTER TABLE public.campagnes 
  ADD COLUMN IF NOT EXISTS target_production DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_total DECIMAL(15,2) DEFAULT 0;

-- Rename budget_amount to budgeted_amount in campagne_phase_budgets
ALTER TABLE public.campagne_phase_budgets 
  RENAME COLUMN budget_amount TO budgeted_amount;

-- Add missing columns to sales
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS delivery_number TEXT,
  ADD COLUMN IF NOT EXISTS discount DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_date DATE,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS can_be_delivered BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT false;

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_type TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Add client_id to sales table
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  employee_number TEXT,
  position TEXT,
  salary DECIMAL(15,2) DEFAULT 0,
  hire_date DATE,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create daily_workers table
CREATE TABLE IF NOT EXISTS public.daily_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  daily_rate DECIMAL(15,2) DEFAULT 0,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_workers ENABLE ROW LEVEL SECURITY;

-- Create accounts table (for accounting purposes)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view clients in their tenant"
  ON public.clients FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage clients"
  ON public.clients FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for employees
CREATE POLICY "Users can view employees in their tenant"
  ON public.employees FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage employees"
  ON public.employees FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for daily_workers
CREATE POLICY "Users can view daily workers in their tenant"
  ON public.daily_workers FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage daily workers"
  ON public.daily_workers FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for accounts
CREATE POLICY "Users can view accounts in their tenant"
  ON public.accounts FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage accounts"
  ON public.accounts FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- Add triggers for new tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_workers_updated_at BEFORE UPDATE ON public.daily_workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();