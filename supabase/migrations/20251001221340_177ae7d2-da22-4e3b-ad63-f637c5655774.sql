-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create chart_of_accounts table (SYSCOHADA)
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create campagnes table
CREATE TABLE public.campagnes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campagnes ENABLE ROW LEVEL SECURITY;

-- Create campagne_phase_budgets table
CREATE TABLE public.campagne_phase_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campagne_id UUID REFERENCES public.campagnes(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  budget_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campagne_phase_budgets ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_number TEXT,
  transaction_date DATE,
  description TEXT,
  amount DECIMAL(15,2) DEFAULT 0,
  campagne_phase TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  account_number TEXT,
  account_name TEXT,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create production_records table
CREATE TABLE public.production_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  campagne_id UUID REFERENCES public.campagnes(id) ON DELETE CASCADE,
  salt_type TEXT NOT NULL,
  quantity DECIMAL(15,2) DEFAULT 0,
  production_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  campagne_id UUID REFERENCES public.campagnes(id) ON DELETE CASCADE,
  salt_type TEXT NOT NULL,
  quantity DECIMAL(15,2) DEFAULT 0,
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  sale_date DATE,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for tenants
CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage tenants"
  ON public.tenants FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins and managers can manage profiles"
  ON public.profiles FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for chart_of_accounts
CREATE POLICY "Users can view accounts in their tenant"
  ON public.chart_of_accounts FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins and managers can manage accounts"
  ON public.chart_of_accounts FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for campagnes
CREATE POLICY "Users can view campagnes in their tenant"
  ON public.campagnes FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage campagnes"
  ON public.campagnes FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for campagne_phase_budgets
CREATE POLICY "Users can view phase budgets for their tenant campagnes"
  ON public.campagne_phase_budgets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campagnes 
    WHERE campagnes.id = campagne_phase_budgets.campagne_id 
    AND campagnes.tenant_id = public.get_user_tenant_id(auth.uid())
  ));

CREATE POLICY "Managers can manage phase budgets"
  ON public.campagne_phase_budgets FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions in their tenant"
  ON public.transactions FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create transactions in their tenant"
  ON public.transactions FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage transactions"
  ON public.transactions FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for journal_entries
CREATE POLICY "Users can view journal entries for their tenant transactions"
  ON public.journal_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = journal_entries.transaction_id 
    AND transactions.tenant_id = public.get_user_tenant_id(auth.uid())
  ));

CREATE POLICY "Users can create journal entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = journal_entries.transaction_id 
    AND transactions.tenant_id = public.get_user_tenant_id(auth.uid())
  ));

-- RLS Policies for production_records
CREATE POLICY "Users can view production records in their tenant"
  ON public.production_records FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create production records"
  ON public.production_records FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage production records"
  ON public.production_records FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- RLS Policies for sales
CREATE POLICY "Users can view sales in their tenant"
  ON public.sales FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create sales"
  ON public.sales FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage sales"
  ON public.sales FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campagnes_updated_at BEFORE UPDATE ON public.campagnes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_production_records_updated_at BEFORE UPDATE ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();