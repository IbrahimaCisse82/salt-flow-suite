-- Create payments table to track invoice payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view payments in their tenant" 
ON public.payments 
FOR SELECT 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can manage payments in their tenant" 
ON public.payments 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to sales table if not exists
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS can_be_delivered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_number TEXT,
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

-- Update payment_status to be more dynamic
-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_can_be_delivered ON public.sales(can_be_delivered);
CREATE INDEX IF NOT EXISTS idx_sales_delivered ON public.sales(delivered);