
-- =============================================
-- Engagements Budgétaires Avancés
-- Vue consolidée: Budget vs Engagé vs Réalisé vs Reste à engager
-- =============================================

-- 1) Vue matérialisée consolidée budget vs engagements
CREATE OR REPLACE VIEW public.budget_commitment_summary AS
WITH budget AS (
  SELECT 
    bl.campagne_id,
    bl.phase,
    bl.expense_category,
    bl.budgeted_amount
  FROM campagne_budget_lines bl
),
commitments AS (
  SELECT
    po.campagne_id,
    po.campagne_phase AS phase,
    po.expense_category,
    -- Engagé = montant des PO approuvées/en cours (non encore reçues/payées intégralement)
    SUM(CASE WHEN po.status IN ('approved', 'pending') THEN COALESCE(po.total_amount, 0) ELSE 0 END) AS committed_amount,
    -- Réalisé = montant des PO reçues ou payées
    SUM(CASE WHEN po.status IN ('received') THEN COALESCE(po.total_amount, 0) ELSE 0 END) AS realized_amount,
    -- Total payé
    SUM(COALESCE(po.total_paid, 0)) AS paid_amount,
    -- Nombre de commandes
    COUNT(*) FILTER (WHERE po.status NOT IN ('cancelled', 'rejected')) AS po_count
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
  -- Total engagé = engagé + réalisé
  COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0) AS total_engaged,
  -- Reste à engager = budget - total engagé
  b.budgeted_amount - COALESCE(c.committed_amount, 0) - COALESCE(c.realized_amount, 0) AS remaining_to_commit,
  -- Taux d'engagement %
  CASE WHEN b.budgeted_amount > 0 
    THEN ROUND(((COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) / b.budgeted_amount) * 100, 1)
    ELSE 0 
  END AS engagement_rate,
  -- Alerte: 0=OK, 1=Attention(>80%), 2=Dépassement(>100%)
  CASE 
    WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) > b.budgeted_amount THEN 2
    WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) > b.budgeted_amount * 0.8 THEN 1
    ELSE 0
  END AS alert_level
FROM budget b
LEFT JOIN commitments c ON b.campagne_id = c.campagne_id 
  AND b.phase = c.phase 
  AND b.expense_category = c.expense_category;

-- 2) RPC pour vérifier si un engagement est possible avant validation de BC
CREATE OR REPLACE FUNCTION public.check_budget_commitment(
  p_campagne_id UUID,
  p_phase TEXT,
  p_expense_category TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_budgeted NUMERIC := 0;
  v_total_engaged NUMERIC := 0;
  v_remaining NUMERIC := 0;
  v_allowed BOOLEAN := false;
BEGIN
  -- Récupérer le budget prévu
  SELECT COALESCE(budgeted_amount, 0) INTO v_budgeted
  FROM campagne_budget_lines
  WHERE campagne_id = p_campagne_id
    AND phase = p_phase
    AND expense_category = p_expense_category;

  -- Récupérer le total déjà engagé (approved + received)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_engaged
  FROM purchase_orders
  WHERE campagne_id = p_campagne_id
    AND campagne_phase = p_phase
    AND expense_category = p_expense_category
    AND status NOT IN ('cancelled', 'rejected', 'draft')
    AND deleted_at IS NULL;

  v_remaining := v_budgeted - v_total_engaged;
  v_allowed := p_amount <= v_remaining;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'budgeted', v_budgeted,
    'total_engaged', v_total_engaged,
    'remaining', v_remaining,
    'requested', p_amount,
    'overshoot', CASE WHEN NOT v_allowed THEN p_amount - v_remaining ELSE 0 END
  );
END;
$$;

-- 3) Index pour la performance des engagements
CREATE INDEX IF NOT EXISTS idx_purchase_orders_budget_lookup
  ON purchase_orders(campagne_id, campagne_phase, expense_category, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budget_lines_campagne_phase
  ON campagne_budget_lines(campagne_id, phase, expense_category);
