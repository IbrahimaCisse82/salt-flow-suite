-- ============================================
-- 1. budget_commitment_summary: recreate view with security_invoker
-- ============================================
DROP VIEW IF EXISTS public.budget_commitment_summary;

CREATE VIEW public.budget_commitment_summary
WITH (security_invoker = on)
AS
WITH budget AS (
  SELECT bl.campagne_id, bl.phase, bl.expense_category, bl.budgeted_amount
  FROM campagne_budget_lines bl
),
commitments AS (
  SELECT 
    po.campagne_id,
    po.campagne_phase AS phase,
    po.expense_category,
    sum(CASE WHEN po.status IN ('approved', 'pending') THEN COALESCE(po.total_amount, 0) ELSE 0 END) AS committed_amount,
    sum(CASE WHEN po.status = 'received' THEN COALESCE(po.total_amount, 0) ELSE 0 END) AS realized_amount,
    sum(COALESCE(po.total_paid, 0)) AS paid_amount,
    count(*) FILTER (WHERE po.status NOT IN ('cancelled', 'rejected')) AS po_count
  FROM purchase_orders po
  WHERE po.deleted_at IS NULL 
    AND po.status NOT IN ('cancelled', 'rejected')
    AND po.campagne_id IS NOT NULL 
    AND po.campagne_phase IS NOT NULL
  GROUP BY po.campagne_id, po.campagne_phase, po.expense_category
)
SELECT
  b.campagne_id,
  b.phase,
  b.expense_category,
  b.budgeted_amount,
  COALESCE(c.committed_amount, 0) AS committed_amount,
  COALESCE(c.realized_amount, 0) AS realized_amount,
  COALESCE(c.paid_amount, 0) AS paid_amount,
  COALESCE(c.po_count, 0) AS po_count,
  COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0) AS total_engaged,
  b.budgeted_amount - COALESCE(c.committed_amount, 0) - COALESCE(c.realized_amount, 0) AS remaining_to_commit,
  CASE
    WHEN b.budgeted_amount > 0 THEN round((COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) / b.budgeted_amount * 100, 1)
    ELSE 0
  END AS engagement_rate,
  CASE
    WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) > b.budgeted_amount THEN 2
    WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) > (b.budgeted_amount * 0.8) THEN 1
    ELSE 0
  END AS alert_level
FROM budget b
LEFT JOIN commitments c ON b.campagne_id = c.campagne_id AND b.phase = c.phase AND b.expense_category = c.expense_category;

REVOKE ALL ON public.budget_commitment_summary FROM anon;
GRANT SELECT ON public.budget_commitment_summary TO authenticated;

-- ============================================
-- 2. purchase_order_history: remove overly broad INSERT policy
-- ============================================
DROP POLICY IF EXISTS "Users can insert history" ON public.purchase_order_history;

-- ============================================
-- 3. leaves: restrict INSERT so non-managers can only create for themselves
-- ============================================
DROP POLICY IF EXISTS "Employees can create leave requests" ON public.leaves;

CREATE POLICY "Employees can create leave requests" ON public.leaves
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    get_user_role(auth.uid()) IN ('admin', 'gerant')
    OR employee_id = auth.uid()
  )
);

-- ============================================
-- 4. accounts: restrict SELECT to financial roles
-- ============================================
DROP POLICY IF EXISTS "Users can view accounts" ON public.accounts;

CREATE POLICY "Authorized roles can view accounts" ON public.accounts
FOR SELECT TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
);

-- ============================================
-- 5. purchase_orders: restrict SELECT to authorized roles
-- ============================================
DROP POLICY IF EXISTS "Users can view purchase orders" ON public.purchase_orders;

CREATE POLICY "Authorized roles can view purchase orders" ON public.purchase_orders
FOR SELECT TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable', 'production')
);

-- ============================================
-- 6. purchase_payments: restrict SELECT to financial roles
-- ============================================
DROP POLICY IF EXISTS "Users can view purchase payments" ON public.purchase_payments;

CREATE POLICY "Authorized roles can view purchase payments" ON public.purchase_payments
FOR SELECT TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
);