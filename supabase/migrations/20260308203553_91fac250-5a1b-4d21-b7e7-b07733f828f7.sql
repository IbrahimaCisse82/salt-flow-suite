-- 1. Fix orphaned_profiles view
REVOKE ALL ON public.orphaned_profiles FROM anon;
REVOKE ALL ON public.orphaned_profiles FROM authenticated;
DROP VIEW IF EXISTS public.orphaned_profiles;
CREATE VIEW public.orphaned_profiles WITH (security_invoker = true) AS
SELECT p.id, p.email, p.full_name, p.tenant_id, ur.role
FROM public.profiles p LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.tenant_id IS NULL AND has_role(auth.uid(), 'admin'::app_role);
GRANT SELECT ON public.orphaned_profiles TO authenticated;

-- 2. Fix accounting_ledger view
DROP VIEW IF EXISTS public.accounting_ledger;
CREATE VIEW public.accounting_ledger WITH (security_invoker = true) AS
SELECT je.id, t.id AS transaction_id, t.transaction_date, t.reference, t.description, t.transaction_type,
  je.account_number, je.account_name, je.debit, je.credit, t.tenant_id,
  SUM(COALESCE(je.debit,0) - COALESCE(je.credit,0)) OVER (PARTITION BY je.account_number, t.tenant_id ORDER BY t.transaction_date, t.created_at) AS running_balance
FROM public.journal_entries je JOIN public.transactions t ON t.id = je.transaction_id;
REVOKE ALL ON public.accounting_ledger FROM anon;
GRANT SELECT ON public.accounting_ledger TO authenticated;

-- 3. Fix budget_commitment_summary view (using correct column campagne_phase)
DROP VIEW IF EXISTS public.budget_commitment_summary;
CREATE VIEW public.budget_commitment_summary WITH (security_invoker = true) AS
WITH budget AS (
  SELECT bl.campagne_id, bl.phase, bl.expense_category, bl.budgeted_amount FROM campagne_budget_lines bl
), commitments AS (
  SELECT po.campagne_id, po.campagne_phase AS phase, po.expense_category,
    sum(CASE WHEN po.status = ANY (ARRAY['approved','pending']) THEN COALESCE(po.total_amount,0) ELSE 0 END) AS committed_amount,
    sum(CASE WHEN po.status = 'received' THEN COALESCE(po.total_amount,0) ELSE 0 END) AS realized_amount,
    sum(COALESCE(po.total_paid,0)) AS paid_amount,
    count(*) FILTER (WHERE po.status <> ALL (ARRAY['cancelled','rejected'])) AS po_count
  FROM purchase_orders po
  WHERE po.deleted_at IS NULL AND po.status <> ALL (ARRAY['cancelled','rejected']) AND po.campagne_id IS NOT NULL AND po.campagne_phase IS NOT NULL
  GROUP BY po.campagne_id, po.campagne_phase, po.expense_category
)
SELECT b.campagne_id, b.phase, b.expense_category, b.budgeted_amount,
  COALESCE(c.committed_amount,0) AS committed_amount, COALESCE(c.realized_amount,0) AS realized_amount,
  COALESCE(c.paid_amount,0) AS paid_amount, COALESCE(c.po_count,0::bigint) AS po_count,
  COALESCE(c.committed_amount,0) + COALESCE(c.realized_amount,0) AS total_engaged,
  b.budgeted_amount - COALESCE(c.committed_amount,0) - COALESCE(c.realized_amount,0) AS remaining_to_commit,
  CASE WHEN b.budgeted_amount > 0 THEN round((COALESCE(c.committed_amount,0)+COALESCE(c.realized_amount,0))/b.budgeted_amount*100,1) ELSE 0 END AS engagement_rate,
  CASE WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount,0)+COALESCE(c.realized_amount,0)) > b.budgeted_amount THEN 2
       WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount,0)+COALESCE(c.realized_amount,0)) > b.budgeted_amount*0.8 THEN 1 ELSE 0 END AS alert_level
FROM budget b LEFT JOIN commitments c ON b.campagne_id = c.campagne_id AND b.phase = c.phase AND b.expense_category = c.expense_category;
REVOKE ALL ON public.budget_commitment_summary FROM anon;
GRANT SELECT ON public.budget_commitment_summary TO authenticated;

-- 4. Fix admin_settings invoice_style policy
DROP POLICY IF EXISTS "Managers can upsert invoice style settings" ON public.admin_settings;
CREATE POLICY "Managers can upsert invoice style settings" ON public.admin_settings FOR ALL TO authenticated
  USING (setting_key LIKE 'invoice_style_%' AND get_user_role(auth.uid()) IN ('admin','gerant'))
  WITH CHECK (setting_key LIKE 'invoice_style_%' AND get_user_role(auth.uid()) IN ('admin','gerant'));

-- 5. Fix campagne_budget_lines write policies
DROP POLICY IF EXISTS "Users can insert budget lines for their tenant campagnes" ON public.campagne_budget_lines;
DROP POLICY IF EXISTS "Users can update budget lines for their tenant campagnes" ON public.campagne_budget_lines;
DROP POLICY IF EXISTS "Users can delete budget lines for their tenant campagnes" ON public.campagne_budget_lines;
DROP POLICY IF EXISTS "Users can view budget lines for their tenant campagnes" ON public.campagne_budget_lines;

CREATE POLICY "Managers can insert budget lines" ON public.campagne_budget_lines FOR INSERT TO authenticated
  WITH CHECK (campagne_id IN (SELECT id FROM campagnes WHERE tenant_id = get_user_tenant_id(auth.uid())) AND get_user_role(auth.uid()) IN ('admin','gerant'));
CREATE POLICY "Managers can update budget lines" ON public.campagne_budget_lines FOR UPDATE TO authenticated
  USING (campagne_id IN (SELECT id FROM campagnes WHERE tenant_id = get_user_tenant_id(auth.uid())) AND get_user_role(auth.uid()) IN ('admin','gerant'));
CREATE POLICY "Managers can delete budget lines" ON public.campagne_budget_lines FOR DELETE TO authenticated
  USING (campagne_id IN (SELECT id FROM campagnes WHERE tenant_id = get_user_tenant_id(auth.uid())) AND get_user_role(auth.uid()) IN ('admin','gerant'));
CREATE POLICY "Users can view budget lines" ON public.campagne_budget_lines FOR SELECT TO authenticated
  USING (campagne_id IN (SELECT id FROM campagnes WHERE tenant_id = get_user_tenant_id(auth.uid())));

-- 6. Fix ledger_audit_log INSERT
DROP POLICY IF EXISTS "System can insert audit log" ON public.ledger_audit_log;
CREATE POLICY "Accounting roles can insert audit log" ON public.ledger_audit_log FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin','gerant','comptable'));

-- 7. Fix purchase_order_history INSERT
DROP POLICY IF EXISTS "Users can insert purchase order history" ON public.purchase_order_history;
DROP POLICY IF EXISTS "Tenant users can insert purchase order history" ON public.purchase_order_history;
CREATE POLICY "Authorized roles can insert purchase order history" ON public.purchase_order_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_history.purchase_order_id AND po.tenant_id = get_user_tenant_id(auth.uid()))
    AND get_user_role(auth.uid()) IN ('admin','gerant','comptable','production'));