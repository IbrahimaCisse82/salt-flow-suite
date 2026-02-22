
-- Trigger to prevent cancellation/deletion of purchase orders with payments (unless fully refunded)
CREATE OR REPLACE FUNCTION public.protect_purchase_order_with_payments()
RETURNS TRIGGER AS $$
DECLARE
  total_payments numeric;
  total_refunds numeric;
BEGIN
  -- Only check when status changes to 'cancelled' or when soft-deleting
  IF (TG_OP = 'UPDATE') THEN
    -- Check cancellation
    IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
      SELECT 
        COALESCE(SUM(CASE WHEN payment_type != 'refund' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_type = 'refund' THEN amount ELSE 0 END), 0)
      INTO total_payments, total_refunds
      FROM purchase_payments
      WHERE purchase_order_id = OLD.id;

      -- Block if there are net payments (payments - refunds > 0)
      IF (total_payments - total_refunds) > 0 THEN
        RAISE EXCEPTION 'Impossible d''annuler cette commande : des paiements ont été effectués (% F). Enregistrez d''abord un retour de fonds via la comptabilité.', 
          (total_payments - total_refunds);
      END IF;
    END IF;

    -- Check soft delete
    IF (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
      SELECT COALESCE(SUM(amount), 0) INTO total_payments
      FROM purchase_payments
      WHERE purchase_order_id = OLD.id;

      IF total_payments > 0 THEN
        RAISE EXCEPTION 'Impossible de supprimer cette commande : des paiements sont associés.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop if exists to avoid duplicates
DROP TRIGGER IF EXISTS trg_protect_purchase_order_payments ON purchase_orders;

CREATE TRIGGER trg_protect_purchase_order_payments
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION protect_purchase_order_with_payments();
