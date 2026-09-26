DELETE FROM public.purchase_orders WHERE notes = 'TEST-BUDGET' AND tenant_id = '11111111-2026-4001-8001-000000000001';

CREATE OR REPLACE FUNCTION public.enforce_po_budget()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_budget numeric; v_engaged numeric; v_locked boolean; v_amount numeric;
BEGIN
  IF NEW.campagne_id IS NULL OR NEW.deleted_at IS NOT NULL
     OR NEW.status::text IN ('cancelled','rejected') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND COALESCE(NEW.subtotal,0) <= COALESCE(OLD.subtotal,0)
     AND NEW.campagne_id IS NOT DISTINCT FROM OLD.campagne_id
     AND NEW.campagne_phase IS NOT DISTINCT FROM OLD.campagne_phase
     AND NEW.expense_category IS NOT DISTINCT FROM OLD.expense_category
     AND OLD.status::text NOT IN ('cancelled','rejected') THEN
    RETURN NEW;
  END IF;

  SELECT bool_or(is_locked) INTO v_locked FROM campagne_phase_budgets
   WHERE campagne_id = NEW.campagne_id AND phase = NEW.campagne_phase;
  IF COALESCE(v_locked,false) THEN
    RAISE EXCEPTION 'Phase "%" verrouillée : aucune nouvelle dépense possible', NEW.campagne_phase;
  END IF;

  SELECT SUM(budgeted_amount) INTO v_budget FROM campagne_budget_lines
   WHERE campagne_id = NEW.campagne_id AND phase = NEW.campagne_phase
     AND expense_category = NEW.expense_category;
  IF v_budget IS NULL THEN
    RAISE EXCEPTION 'Aucune ligne budgétaire pour la phase "%" / catégorie "%"', NEW.campagne_phase, NEW.expense_category;
  END IF;

  PERFORM 1 FROM campagne_budget_lines WHERE campagne_id = NEW.campagne_id
    AND phase = NEW.campagne_phase AND expense_category = NEW.expense_category FOR UPDATE;

  SELECT COALESCE(SUM(COALESCE(subtotal, amount_ht, total_amount, 0)),0) INTO v_engaged
    FROM purchase_orders
   WHERE campagne_id = NEW.campagne_id AND campagne_phase = NEW.campagne_phase
     AND expense_category = NEW.expense_category AND deleted_at IS NULL
     AND status::text NOT IN ('cancelled','rejected') AND id <> NEW.id;

  v_amount := COALESCE(NEW.subtotal, NEW.amount_ht, NEW.total_amount, 0);
  IF v_engaged + v_amount > v_budget THEN
    RAISE EXCEPTION 'Budget dépassé : % FCFA demandés, % FCFA disponibles sur % FCFA', v_amount, GREATEST(v_budget - v_engaged,0), v_budget
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_po_budget() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_po_budget ON public.purchase_orders;
CREATE TRIGGER trg_po_budget BEFORE INSERT OR UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_po_budget();