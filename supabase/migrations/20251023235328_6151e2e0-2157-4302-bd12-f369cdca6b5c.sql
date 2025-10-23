-- Create leaves table for employee leave management
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('conge_annuel', 'conge_maladie', 'conge_maternite', 'conge_sans_solde', 'autre')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Create policies for leaves
-- Employees can view their own leaves
CREATE POLICY "Employees can view their own leaves"
ON public.leaves
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- Employees can create their own leave requests
CREATE POLICY "Employees can create leave requests"
ON public.leaves
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- Only pending leaves can be cancelled by the requester
CREATE POLICY "Employees can cancel pending leaves"
ON public.leaves
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND status = 'pending'
)
WITH CHECK (
  status = 'cancelled'
);

-- Managers can view all leaves in their tenant
CREATE POLICY "Managers can view all leaves"
ON public.leaves
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);

-- Managers can approve/reject leaves
CREATE POLICY "Managers can process leaves"
ON public.leaves
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);

-- Managers can delete leaves
CREATE POLICY "Managers can delete leaves"
ON public.leaves
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);

-- Create trigger for updated_at
CREATE TRIGGER update_leaves_updated_at
BEFORE UPDATE ON public.leaves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_leaves_tenant_id ON public.leaves(tenant_id);
CREATE INDEX idx_leaves_employee_id ON public.leaves(employee_id);
CREATE INDEX idx_leaves_status ON public.leaves(status);
CREATE INDEX idx_leaves_dates ON public.leaves(start_date, end_date);