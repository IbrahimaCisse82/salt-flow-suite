-- Enums
CREATE TYPE public.employee_type AS ENUM ('permanent', 'saisonnier', 'journalier');
CREATE TYPE public.attendance_status AS ENUM ('pending', 'validated', 'paid');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'cancelled');

-- ============ EMPLOYEES ============
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_number TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  employee_type employee_type NOT NULL DEFAULT 'permanent',
  hire_date DATE,
  salary NUMERIC(15,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_number)
);
CREATE INDEX idx_employees_tenant ON public.employees(tenant_id);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_select_tenant ON public.employees FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY employees_insert_hr ON public.employees FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'admin')
));
CREATE POLICY employees_update_hr ON public.employees FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'admin')
));
CREATE POLICY employees_delete_hr ON public.employees FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')
));

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DAILY WORKERS ============
CREATE TABLE public.daily_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  daily_rate NUMERIC(15,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_daily_workers_tenant ON public.daily_workers(tenant_id);
ALTER TABLE public.daily_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY dw_select_tenant ON public.daily_workers FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY dw_insert_hr ON public.daily_workers FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')
));
CREATE POLICY dw_update_hr ON public.daily_workers FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')
));
CREATE POLICY dw_delete_hr ON public.daily_workers FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')
));

CREATE TRIGGER daily_workers_updated_at BEFORE UPDATE ON public.daily_workers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TEAMS ============
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  team_lead_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teams_tenant ON public.teams(tenant_id);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_select_tenant ON public.teams FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY teams_insert_mgmt ON public.teams FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')
));
CREATE POLICY teams_update_mgmt ON public.teams FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')
));
CREATE POLICY teams_delete_gerant ON public.teams FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')
));

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TEAM ATTENDANCE ============
CREATE TABLE public.team_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  hours_worked NUMERIC(6,2) NOT NULL DEFAULT 0,
  daily_rate NUMERIC(15,2) NOT NULL DEFAULT 0,
  calculated_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status attendance_status NOT NULL DEFAULT 'pending',
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attendance_tenant_date ON public.team_attendance(tenant_id, attendance_date);
CREATE INDEX idx_attendance_employee ON public.team_attendance(employee_id);
ALTER TABLE public.team_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_select_tenant ON public.team_attendance FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY attendance_insert_ops ON public.team_attendance FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'admin')
));
CREATE POLICY attendance_update_ops ON public.team_attendance FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'chef_production') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')
));
CREATE POLICY attendance_delete_mgmt ON public.team_attendance FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'rh') OR has_role(auth.uid(),'admin')
));

CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON public.team_attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-calculate amount
CREATE OR REPLACE FUNCTION public.calc_attendance_amount()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.calculated_amount = COALESCE(NEW.hours_worked,0) * COALESCE(NEW.daily_rate,0) / 8.0;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.calc_attendance_amount() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER attendance_calc BEFORE INSERT OR UPDATE ON public.team_attendance
FOR EACH ROW EXECUTE FUNCTION public.calc_attendance_amount();

-- ============ PAYROLL PAYMENTS ============
CREATE TABLE public.payroll_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  daily_worker_id UUID REFERENCES public.daily_workers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE,
  period_end DATE,
  payment_method TEXT,
  reference TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_tenant_date ON public.payroll_payments(tenant_id, payment_date);
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payroll_select_tenant ON public.payroll_payments FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY payroll_insert_acc ON public.payroll_payments FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')
));
CREATE POLICY payroll_update_acc ON public.payroll_payments FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')
));
CREATE POLICY payroll_delete_gerant ON public.payroll_payments FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (
  has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')
));

CREATE TRIGGER payroll_updated_at BEFORE UPDATE ON public.payroll_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();