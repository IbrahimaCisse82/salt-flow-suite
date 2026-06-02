-- Tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contact_email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS tenants_subdomain_key ON public.tenants(subdomain) WHERE subdomain IS NOT NULL;

-- Purchase orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS campagne_phase TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS amount_ht NUMERIC DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tva_amount NUMERIC DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tva_rate NUMERIC DEFAULT 18;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Admin settings
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_settings_tenant_key_unique') THEN
    ALTER TABLE public.admin_settings
      ADD CONSTRAINT admin_settings_tenant_key_unique UNIQUE (tenant_id, setting_key);
  END IF;
END$$;

-- Profiles RPC
DROP FUNCTION IF EXISTS public.get_profiles_with_roles();
CREATE FUNCTION public.get_profiles_with_roles()
RETURNS TABLE(id uuid, user_id uuid, email text, full_name text, phone text, avatar_url text, is_active boolean, tenant_id uuid, roles text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _tenant UUID;
BEGIN
  _tenant := get_user_tenant_id(auth.uid());
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT p.id, p.user_id, p.email, p.full_name, p.phone, p.avatar_url, p.is_active, p.tenant_id,
    COALESCE(ARRAY_AGG(ur.role::TEXT) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::TEXT[])
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE p.tenant_id = _tenant
     OR p.user_id = auth.uid()
  GROUP BY p.id, p.user_id, p.email, p.full_name, p.phone, p.avatar_url, p.is_active, p.tenant_id;
END;
$function$;

-- View budget_commitment_summary
CREATE OR REPLACE VIEW public.budget_commitment_summary
WITH (security_invoker = true) AS
SELECT
  cbl.tenant_id,
  cbl.campagne_id,
  cbl.phase,
  cbl.expense_category,
  cbl.budgeted_amount,
  COALESCE(SUM(CASE WHEN po.status::text NOT IN ('cancelled','rejected') THEN po.total_amount ELSE 0 END), 0) AS committed_amount,
  CASE WHEN cbl.budgeted_amount > 0
    THEN (COALESCE(SUM(CASE WHEN po.status::text NOT IN ('cancelled','rejected') THEN po.total_amount ELSE 0 END), 0) / cbl.budgeted_amount) * 100
    ELSE 0 END AS engagement_rate,
  CASE
    WHEN cbl.budgeted_amount = 0 THEN 0
    WHEN COALESCE(SUM(CASE WHEN po.status::text NOT IN ('cancelled','rejected') THEN po.total_amount ELSE 0 END), 0) >= cbl.budgeted_amount THEN 2
    WHEN COALESCE(SUM(CASE WHEN po.status::text NOT IN ('cancelled','rejected') THEN po.total_amount ELSE 0 END), 0) >= (cbl.budgeted_amount * 0.8) THEN 1
    ELSE 0 END AS alert_level,
  cbl.budgeted_amount - COALESCE(SUM(CASE WHEN po.status::text NOT IN ('cancelled','rejected') THEN po.total_amount ELSE 0 END), 0) AS remaining_to_commit
FROM public.campagne_budget_lines cbl
LEFT JOIN public.purchase_orders po
  ON po.campagne_id = cbl.campagne_id
 AND po.campagne_phase = cbl.phase
 AND po.expense_category = cbl.expense_category
 AND po.tenant_id = cbl.tenant_id
GROUP BY cbl.tenant_id, cbl.campagne_id, cbl.phase, cbl.expense_category, cbl.budgeted_amount;

GRANT SELECT ON public.budget_commitment_summary TO authenticated;