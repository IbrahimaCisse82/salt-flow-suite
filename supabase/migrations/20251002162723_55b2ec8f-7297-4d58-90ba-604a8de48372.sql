-- ============================================================
-- SYSTÈME DE POINTAGE ET PAIEMENT RH
-- ============================================================

-- Table de pointage des équipes
CREATE TABLE public.team_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  hours_worked NUMERIC DEFAULT 0,
  daily_rate NUMERIC DEFAULT 0,
  calculated_amount NUMERIC GENERATED ALWAYS AS (hours_worked * daily_rate) STORED,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'paid')),
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, attendance_date, team_id)
);

-- Table des paiements de salaires
CREATE TABLE public.payroll_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  attendance_id UUID REFERENCES public.team_attendance(id) ON DELETE CASCADE,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  paid_to UUID REFERENCES public.employees(id),
  payment_account_id UUID REFERENCES public.accounts(id),
  payment_date DATE NOT NULL,
  payment_method TEXT,
  receiver_signature TEXT,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des notifications comptables
CREATE TABLE public.accountant_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('payroll_validated', 'payment_required')),
  reference_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX idx_team_attendance_tenant ON public.team_attendance(tenant_id);
CREATE INDEX idx_team_attendance_status ON public.team_attendance(status);
CREATE INDEX idx_team_attendance_date ON public.team_attendance(attendance_date);
CREATE INDEX idx_payroll_payments_tenant ON public.payroll_payments(tenant_id);
CREATE INDEX idx_accountant_notifications_tenant ON public.accountant_notifications(tenant_id);
CREATE INDEX idx_accountant_notifications_unread ON public.accountant_notifications(is_read) WHERE is_read = false;

-- RLS Policies pour team_attendance
ALTER TABLE public.team_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and production can view attendance"
ON public.team_attendance FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'production'])
);

CREATE POLICY "Managers and production can create attendance"
ON public.team_attendance FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'production'])
);

CREATE POLICY "Managers can update attendance"
ON public.team_attendance FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant'])
);

-- RLS Policies pour payroll_payments
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and accountants can view payments"
ON public.payroll_payments FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

CREATE POLICY "Accountants can create payments"
ON public.payroll_payments FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

-- RLS Policies pour accountant_notifications
ALTER TABLE public.accountant_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accountants can view their notifications"
ON public.accountant_notifications FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

CREATE POLICY "Accountants can update notifications"
ON public.accountant_notifications FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin', 'gerant', 'comptable'])
);

-- Trigger pour notifications automatiques après validation
CREATE OR REPLACE FUNCTION notify_accountant_on_validation()
RETURNS TRIGGER AS $$
DECLARE
  total_amount NUMERIC;
BEGIN
  IF NEW.status = 'validated' AND OLD.status = 'pending' THEN
    -- Calculer le total validé
    SELECT COALESCE(SUM(calculated_amount), 0)
    INTO total_amount
    FROM public.team_attendance
    WHERE id = NEW.id;
    
    -- Créer la notification
    INSERT INTO public.accountant_notifications (
      tenant_id,
      notification_type,
      reference_id,
      amount,
      title,
      message
    ) VALUES (
      NEW.tenant_id,
      'payroll_validated',
      NEW.id,
      total_amount,
      'Nouveau pointage validé',
      'Un pointage a été validé et requiert un paiement RH de ' || total_amount || ' FCFA'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_accountant
AFTER UPDATE ON public.team_attendance
FOR EACH ROW
EXECUTE FUNCTION notify_accountant_on_validation();

-- Trigger pour mise à jour du statut après paiement
CREATE OR REPLACE FUNCTION update_attendance_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.team_attendance
  SET status = 'paid'
  WHERE id = NEW.attendance_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_attendance_status
AFTER INSERT ON public.payroll_payments
FOR EACH ROW
EXECUTE FUNCTION update_attendance_status_on_payment();

-- Trigger pour updated_at
CREATE TRIGGER update_team_attendance_updated_at
BEFORE UPDATE ON public.team_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_payments_updated_at
BEFORE UPDATE ON public.payroll_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();