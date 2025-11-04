-- Priority 1: Fix team_attendance structure
ALTER TABLE public.team_attendance 
  ADD COLUMN IF NOT EXISTS daily_rate NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calculated_amount NUMERIC(12,2) DEFAULT 0;

-- Create function to calculate amount
CREATE OR REPLACE FUNCTION calculate_attendance_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.calculated_amount := NEW.hours_worked * NEW.daily_rate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate amount
DROP TRIGGER IF EXISTS calculate_attendance_amount_trigger ON public.team_attendance;
CREATE TRIGGER calculate_attendance_amount_trigger
  BEFORE INSERT OR UPDATE OF hours_worked, daily_rate ON public.team_attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attendance_amount();

-- Priority 2: Complete sales table with missing columns
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS salt_type TEXT,
  ADD COLUMN IF NOT EXISTS can_be_delivered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_date DATE,
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for order tracking
CREATE INDEX IF NOT EXISTS idx_sales_order_number ON public.sales(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_batch_number ON public.sales(batch_number);
CREATE INDEX IF NOT EXISTS idx_sales_delivered ON public.sales(delivered);

-- Priority 3: Complete teams table with missing columns
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS sector TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS production_target NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS efficiency_rate NUMERIC(5,2) DEFAULT 0;

-- Add constraint for team status
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_status_check;
ALTER TABLE public.teams ADD CONSTRAINT teams_status_check 
  CHECK (status IN ('active', 'inactive', 'rest'));

CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);

-- Priority 4: Fix suppliers table
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS supplier_type TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON public.suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);