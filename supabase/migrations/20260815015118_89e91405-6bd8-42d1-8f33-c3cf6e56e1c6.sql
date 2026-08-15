
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS rejected_by uuid;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS requires_reapproval boolean NOT NULL DEFAULT false;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS previous_total numeric;

ALTER TABLE public.purchase_order_history ADD COLUMN IF NOT EXISTS previous_amount numeric;
ALTER TABLE public.purchase_order_history ADD COLUMN IF NOT EXISTS new_amount numeric;

ALTER TYPE public.po_status ADD VALUE IF NOT EXISTS 'modified';
ALTER TYPE public.po_status ADD VALUE IF NOT EXISTS 'partially_paid';
ALTER TYPE public.po_status ADD VALUE IF NOT EXISTS 'paid';

CREATE TABLE IF NOT EXISTS public.financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.get_user_tenant_id(auth.uid()),
  report_type text NOT NULL,
  period_start date,
  period_end date,
  status text NOT NULL DEFAULT 'generated',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_reports TO authenticated;
GRANT ALL ON public.financial_reports TO service_role;

ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_reports_select" ON public.financial_reports;
CREATE POLICY "financial_reports_select" ON public.financial_reports
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "financial_reports_insert" ON public.financial_reports;
CREATE POLICY "financial_reports_insert" ON public.financial_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "financial_reports_update" ON public.financial_reports;
CREATE POLICY "financial_reports_update" ON public.financial_reports
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "financial_reports_delete" ON public.financial_reports;
CREATE POLICY "financial_reports_delete" ON public.financial_reports
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['gerant','comptable','admin']::public.app_role[])
         AND public.is_tenant_member(auth.uid(), tenant_id));

DROP TRIGGER IF EXISTS update_financial_reports_updated_at ON public.financial_reports;
CREATE TRIGGER update_financial_reports_updated_at
BEFORE UPDATE ON public.financial_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_financial_reports_tenant_created
  ON public.financial_reports (tenant_id, created_at DESC);
