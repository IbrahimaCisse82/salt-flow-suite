-- Add missing columns to sales
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15,2) DEFAULT 0;

-- Add missing columns to transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS transaction_type TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS reference TEXT;

-- Add missing columns to accounts
ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS account_type TEXT;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view payments in their tenant"
  ON public.payments FOR SELECT
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Managers can manage payments"
  ON public.payments FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('admin', 'gerant'));

-- Add trigger for payments
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();