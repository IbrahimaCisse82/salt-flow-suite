
-- ============================================================
-- 1. ATOMIC STOCK MOVEMENT RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_stock_movement(
  p_item_id UUID, p_quantity NUMERIC, p_movement_type TEXT,
  p_unit_cost NUMERIC DEFAULT 0, p_warehouse_from TEXT DEFAULT NULL,
  p_warehouse_to TEXT DEFAULT NULL, p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item RECORD; v_new_qty NUMERIC; v_new_cmp NUMERIC; v_tenant_id UUID;
BEGIN
  SELECT * INTO v_item FROM inventory_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found: %', p_item_id; END IF;
  v_tenant_id := v_item.tenant_id;
  CASE p_movement_type
    WHEN 'entry' THEN
      v_new_qty := COALESCE(v_item.quantity_on_hand, 0) + p_quantity;
      IF (COALESCE(v_item.quantity_on_hand, 0) + p_quantity) > 0 THEN
        v_new_cmp := (COALESCE(v_item.quantity_on_hand, 0) * COALESCE(v_item.cmp, 0) + p_quantity * p_unit_cost) / (COALESCE(v_item.quantity_on_hand, 0) + p_quantity);
      ELSE v_new_cmp := p_unit_cost; END IF;
    WHEN 'exit' THEN
      v_new_qty := COALESCE(v_item.quantity_on_hand, 0) - p_quantity;
      IF v_new_qty < 0 THEN RAISE EXCEPTION 'Insufficient stock for item %. Available: %, Requested: %', v_item.item_name, v_item.quantity_on_hand, p_quantity; END IF;
      v_new_cmp := COALESCE(v_item.cmp, 0);
    WHEN 'adjustment' THEN
      v_new_qty := p_quantity;
      v_new_cmp := CASE WHEN p_unit_cost > 0 THEN p_unit_cost ELSE COALESCE(v_item.cmp, 0) END;
    WHEN 'transfer' THEN
      v_new_qty := COALESCE(v_item.quantity_on_hand, 0);
      v_new_cmp := COALESCE(v_item.cmp, 0);
    ELSE RAISE EXCEPTION 'Invalid movement type: %', p_movement_type;
  END CASE;
  UPDATE inventory_items SET quantity_on_hand = v_new_qty, cmp = ROUND(v_new_cmp, 2), total_stock_value = ROUND(v_new_qty * v_new_cmp, 2), updated_at = NOW() WHERE id = p_item_id;
  INSERT INTO stock_movements (tenant_id, item_name, movement_type, quantity, previous_quantity, new_quantity, unit_of_measure, reference_type, warehouse, notes)
  VALUES (v_tenant_id, v_item.item_name, p_movement_type, p_quantity, COALESCE(v_item.quantity_on_hand, 0), v_new_qty, COALESCE(v_item.unit_of_measure, 't'), p_reference_type, COALESCE(p_warehouse_to, p_warehouse_from), p_notes);
  RETURN jsonb_build_object('item_id', p_item_id, 'previous_qty', COALESCE(v_item.quantity_on_hand, 0), 'new_qty', v_new_qty, 'cmp', ROUND(v_new_cmp, 2), 'movement_type', p_movement_type);
END; $$;

-- ============================================================
-- 2. GENERIC FINANCIAL AUDIT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_financial_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant_id UUID; v_record_id TEXT; v_details JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN v_tenant_id := OLD.tenant_id; v_record_id := OLD.id::TEXT; v_details := jsonb_build_object('old_data', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN v_tenant_id := NEW.tenant_id; v_record_id := NEW.id::TEXT; v_details := jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW));
  ELSIF TG_OP = 'INSERT' THEN v_tenant_id := NEW.tenant_id; v_record_id := NEW.id::TEXT; v_details := jsonb_build_object('new_data', to_jsonb(NEW));
  END IF;
  INSERT INTO ledger_audit_log (tenant_id, table_name, record_id, action_type, user_id, details)
  VALUES (v_tenant_id, TG_TABLE_NAME, v_record_id, TG_OP, auth.uid(), v_details);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['transactions','journal_entries','sales','purchase_orders','payments','payroll_payments','fixed_assets','depreciation_schedule'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_financial_audit_trigger()', t, t);
  END LOOP;
END; $$;

-- ============================================================
-- 3. COMPOSITE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date ON transactions(tenant_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_type ON transactions(tenant_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_status ON sales(tenant_id, sale_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_date ON purchase_orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_status ON purchase_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_category ON inventory_items(tenant_id, item_category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_date ON stock_movements(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_transaction ON journal_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_production_records_tenant_date ON production_records(tenant_id, production_date DESC);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_active ON employees(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_attendance_tenant_date ON team_attendance(tenant_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_tenant_status ON fixed_assets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_deleted ON clients(tenant_id, deleted_at);

-- ============================================================
-- 4. NUMERIC(15,2) on monetary columns (drop/recreate view first)
-- ============================================================
DROP VIEW IF EXISTS budget_commitment_summary CASCADE;

ALTER TABLE transactions ALTER COLUMN amount TYPE NUMERIC(15,2);
ALTER TABLE sales ALTER COLUMN total_amount TYPE NUMERIC(15,2);
ALTER TABLE sales ALTER COLUMN unit_price TYPE NUMERIC(15,2);
ALTER TABLE payments ALTER COLUMN amount TYPE NUMERIC(15,2);
ALTER TABLE purchase_orders ALTER COLUMN total_amount TYPE NUMERIC(15,2);
ALTER TABLE payroll_payments ALTER COLUMN paid_amount TYPE NUMERIC(15,2);
ALTER TABLE fixed_assets ALTER COLUMN acquisition_cost TYPE NUMERIC(15,2);
ALTER TABLE fixed_assets ALTER COLUMN net_book_value TYPE NUMERIC(15,2);
ALTER TABLE fixed_assets ALTER COLUMN residual_value TYPE NUMERIC(15,2);
ALTER TABLE inventory_items ALTER COLUMN cmp TYPE NUMERIC(15,4);
ALTER TABLE inventory_items ALTER COLUMN unit_cost TYPE NUMERIC(15,4);
ALTER TABLE inventory_items ALTER COLUMN total_stock_value TYPE NUMERIC(15,2);

-- Recreate the view
CREATE OR REPLACE VIEW budget_commitment_summary WITH (security_invoker=on) AS
WITH budget AS (
  SELECT bl.campagne_id, bl.phase, bl.expense_category, bl.budgeted_amount
  FROM campagne_budget_lines bl
), commitments AS (
  SELECT po.campagne_id, po.campagne_phase AS phase, po.expense_category,
    sum(CASE WHEN po.status = ANY (ARRAY['approved','pending']) THEN COALESCE(po.total_amount, 0) ELSE 0 END) AS committed_amount,
    sum(CASE WHEN po.status = 'received' THEN COALESCE(po.total_amount, 0) ELSE 0 END) AS realized_amount,
    sum(COALESCE(po.total_paid, 0)) AS paid_amount,
    count(*) FILTER (WHERE po.status <> ALL (ARRAY['cancelled','rejected'])) AS po_count
  FROM purchase_orders po
  WHERE po.deleted_at IS NULL AND po.status <> ALL (ARRAY['cancelled','rejected']) AND po.campagne_id IS NOT NULL AND po.campagne_phase IS NOT NULL
  GROUP BY po.campagne_id, po.campagne_phase, po.expense_category
)
SELECT b.campagne_id, b.phase, b.expense_category, b.budgeted_amount,
  COALESCE(c.committed_amount, 0) AS committed_amount,
  COALESCE(c.realized_amount, 0) AS realized_amount,
  COALESCE(c.paid_amount, 0) AS paid_amount,
  COALESCE(c.po_count, 0::bigint) AS po_count,
  COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0) AS total_engaged,
  b.budgeted_amount - COALESCE(c.committed_amount, 0) - COALESCE(c.realized_amount, 0) AS remaining_to_commit,
  CASE WHEN b.budgeted_amount > 0 THEN round((COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) / b.budgeted_amount * 100, 1) ELSE 0 END AS engagement_rate,
  CASE WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) > b.budgeted_amount THEN 2
       WHEN b.budgeted_amount > 0 AND (COALESCE(c.committed_amount, 0) + COALESCE(c.realized_amount, 0)) > (b.budgeted_amount * 0.8) THEN 1
       ELSE 0 END AS alert_level
FROM budget b LEFT JOIN commitments c ON b.campagne_id = c.campagne_id AND b.phase = c.phase AND b.expense_category = c.expense_category;
