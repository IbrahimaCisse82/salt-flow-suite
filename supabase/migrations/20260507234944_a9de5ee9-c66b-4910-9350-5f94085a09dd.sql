
-- ============ TENANTS: colonnes manquantes ============
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_unique ON public.tenants(slug) WHERE slug IS NOT NULL;

-- ============ TRANSACTIONS: colonnes manquantes ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='amount') THEN
    ALTER TABLE public.transactions ADD COLUMN amount NUMERIC NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='validated_by') THEN
    ALTER TABLE public.transactions ADD COLUMN validated_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='validated_at') THEN
    ALTER TABLE public.transactions ADD COLUMN validated_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='is_validated') THEN
    ALTER TABLE public.transactions ADD COLUMN is_validated BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='reference') THEN
    ALTER TABLE public.transactions ADD COLUMN reference TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='transaction_type') THEN
    ALTER TABLE public.transactions ADD COLUMN transaction_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='description') THEN
    ALTER TABLE public.transactions ADD COLUMN description TEXT;
  END IF;
END $$;

-- ============ ACCOUNTANT_NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.accountant_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  reference_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accountant_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "an_select" ON public.accountant_notifications FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "an_ins" ON public.accountant_notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "an_upd" ON public.accountant_notifications FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "an_del" ON public.accountant_notifications FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'gerant'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- ============ NOTIFICATION_HISTORY ============
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nh_select" ON public.notification_history FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "nh_ins" ON public.notification_history FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "nh_del" ON public.notification_history FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'gerant'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- ============ SCHEDULED_REPORTS ============
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  recipients TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_select" ON public.scheduled_reports FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "sr_ins" ON public.scheduled_reports FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'gerant'::app_role) OR has_role(auth.uid(), 'comptable'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "sr_upd" ON public.scheduled_reports FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'gerant'::app_role) OR has_role(auth.uid(), 'comptable'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "sr_del" ON public.scheduled_reports FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'gerant'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE TRIGGER scheduled_reports_set_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REALTIME ============
ALTER TABLE public.accountant_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.accountant_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
