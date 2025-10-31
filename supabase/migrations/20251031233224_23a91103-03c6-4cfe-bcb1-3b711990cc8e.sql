-- Table pour stocker les configurations de rapports planifiés
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('campagne', 'financier', 'production', 'rh', 'commercial')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  schedule_time TIME NOT NULL DEFAULT '09:00:00',
  start_date DATE NOT NULL,
  end_date DATE,
  recipient_emails TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tenant ON public.scheduled_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON public.scheduled_reports(next_run_at) WHERE is_active = true;

-- Trigger pour updated_at
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Politique de sélection : utilisateurs du même tenant
CREATE POLICY "Users can view scheduled reports from their tenant"
  ON public.scheduled_reports
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Politique d'insertion : seuls les gérants et admins peuvent créer
CREATE POLICY "Managers can create scheduled reports"
  ON public.scheduled_reports
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  );

-- Politique de mise à jour : seuls les gérants et admins peuvent modifier
CREATE POLICY "Managers can update scheduled reports"
  ON public.scheduled_reports
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  );

-- Politique de suppression : seuls les gérants et admins peuvent supprimer
CREATE POLICY "Managers can delete scheduled reports"
  ON public.scheduled_reports
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND is_manager_or_admin(auth.uid())
  );

-- Fonction pour calculer la prochaine exécution
CREATE OR REPLACE FUNCTION public.calculate_next_run(
  p_frequency TEXT,
  p_schedule_time TIME,
  p_current_run TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      next_run := (date_trunc('day', p_current_run) + INTERVAL '1 day' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    WHEN 'weekly' THEN
      next_run := (date_trunc('week', p_current_run) + INTERVAL '1 week' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    WHEN 'monthly' THEN
      next_run := (date_trunc('month', p_current_run) + INTERVAL '1 month' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    WHEN 'quarterly' THEN
      next_run := (date_trunc('quarter', p_current_run) + INTERVAL '3 months' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    ELSE
      next_run := p_current_run + INTERVAL '1 day';
  END CASE;
  
  -- Si la date calculée est dans le passé, ajouter une période supplémentaire
  IF next_run <= now() THEN
    next_run := public.calculate_next_run(p_frequency, p_schedule_time, next_run);
  END IF;
  
  RETURN next_run;
END;
$$;

-- Trigger pour calculer next_run_at automatiquement
CREATE OR REPLACE FUNCTION public.set_next_run_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.next_run_at IS NULL OR TG_OP = 'UPDATE' THEN
    NEW.next_run_at := public.calculate_next_run(
      NEW.frequency,
      NEW.schedule_time,
      COALESCE(NEW.last_run_at, NEW.start_date::TIMESTAMP WITH TIME ZONE)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_next_run_at
  BEFORE INSERT OR UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_next_run_at();