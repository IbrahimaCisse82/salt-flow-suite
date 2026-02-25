
-- =====================================================
-- RENFORCEMENT DU GRAND LIVRE (LEDGER HARDENING)
-- Journal append-only, validation, audit trail
-- =====================================================

-- 1. Add validation columns to transactions
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS is_validated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_by uuid;

-- 2. Create ledger audit log table
CREATE TABLE IF NOT EXISTS public.ledger_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  action_type text NOT NULL, -- 'validation', 'blocked_update', 'blocked_delete'
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ledger_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view audit log"
  ON public.ledger_audit_log FOR SELECT
  USING (tenant_id = get_user_tenant_id((SELECT auth.uid())));

CREATE POLICY "System can insert audit log"
  ON public.ledger_audit_log FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id((SELECT auth.uid())));

-- 3. Trigger: block UPDATE on validated transactions
CREATE OR REPLACE FUNCTION public.trg_protect_validated_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow only the validation action itself (setting is_validated to true)
  IF OLD.is_validated = true THEN
    -- Log the blocked attempt
    INSERT INTO public.ledger_audit_log (tenant_id, action_type, table_name, record_id, user_id, details)
    VALUES (OLD.tenant_id, 'blocked_update', 'transactions', OLD.id, auth.uid(),
      jsonb_build_object('reason', 'Transaction already validated', 'attempted_changes', to_jsonb(NEW) - to_jsonb(OLD)));
    RAISE EXCEPTION 'Transaction validée — modification interdite (ID: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_validated_transaction ON public.transactions;
CREATE TRIGGER trg_protect_validated_transaction
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_protect_validated_transaction();

-- 4. Trigger: block DELETE on transactions that have journal entries
CREATE OR REPLACE FUNCTION public.trg_prevent_transaction_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.journal_entries WHERE transaction_id = OLD.id LIMIT 1) THEN
    INSERT INTO public.ledger_audit_log (tenant_id, action_type, table_name, record_id, user_id, details)
    VALUES (OLD.tenant_id, 'blocked_delete', 'transactions', OLD.id, auth.uid(),
      jsonb_build_object('reason', 'Transaction has journal entries'));
    RAISE EXCEPTION 'Suppression interdite: la transaction % possède des écritures comptables', OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_transaction_delete ON public.transactions;
CREATE TRIGGER trg_prevent_transaction_delete
  BEFORE DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prevent_transaction_delete();

-- 5. Trigger: block all UPDATE/DELETE on journal_entries (strict append-only)
CREATE OR REPLACE FUNCTION public.trg_journal_entries_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT tenant_id INTO v_tenant_id FROM public.transactions WHERE id = OLD.transaction_id;
    INSERT INTO public.ledger_audit_log (tenant_id, action_type, table_name, record_id, user_id, details)
    VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), 'blocked_delete', 'journal_entries', OLD.id, auth.uid(),
      jsonb_build_object('account_number', OLD.account_number, 'debit', OLD.debit, 'credit', OLD.credit));
    RAISE EXCEPTION 'Les écritures comptables sont immuables — suppression interdite';
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT tenant_id INTO v_tenant_id FROM public.transactions WHERE id = OLD.transaction_id;
    INSERT INTO public.ledger_audit_log (tenant_id, action_type, table_name, record_id, user_id, details)
    VALUES (COALESCE(v_tenant_id, '00000000-0000-0000-0000-000000000000'), 'blocked_update', 'journal_entries', OLD.id, auth.uid(),
      jsonb_build_object('account_number', OLD.account_number, 'reason', 'Journal entries are immutable'));
    RAISE EXCEPTION 'Les écritures comptables sont immuables — modification interdite';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_journal_entries_immutable ON public.journal_entries;
CREATE TRIGGER trg_journal_entries_immutable
  BEFORE UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_journal_entries_immutable();

-- 6. Validate transaction function (RPC)
CREATE OR REPLACE FUNCTION public.validate_transaction(p_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
  v_debit numeric;
  v_credit numeric;
BEGIN
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction introuvable';
  END IF;
  IF v_tx.is_validated THEN
    RAISE EXCEPTION 'Transaction déjà validée';
  END IF;

  -- Verify debit/credit balance of journal entries
  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
  INTO v_debit, v_credit
  FROM public.journal_entries WHERE transaction_id = p_transaction_id;

  IF ABS(v_debit - v_credit) > 0.01 THEN
    RAISE EXCEPTION 'Écritures déséquilibrées (D: %, C: %) — validation impossible', v_debit, v_credit;
  END IF;

  -- Mark as validated (this bypasses the trigger because is_validated was false)
  UPDATE public.transactions
  SET is_validated = true,
      validated_at = now(),
      validated_by = auth.uid()
  WHERE id = p_transaction_id;

  -- Log validation
  INSERT INTO public.ledger_audit_log (tenant_id, action_type, table_name, record_id, user_id, details)
  VALUES (v_tx.tenant_id, 'validation', 'transactions', p_transaction_id, auth.uid(),
    jsonb_build_object('total_debit', v_debit, 'total_credit', v_credit));

  RETURN jsonb_build_object('status', 'validated', 'debit', v_debit, 'credit', v_credit);
END;
$$;

-- 7. Bulk validate transactions function
CREATE OR REPLACE FUNCTION public.validate_transactions_bulk(p_transaction_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_count int := 0;
BEGIN
  FOREACH v_id IN ARRAY p_transaction_ids LOOP
    PERFORM public.validate_transaction(v_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('validated_count', v_count);
END;
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_is_validated ON public.transactions(is_validated) WHERE is_validated = false;
CREATE INDEX IF NOT EXISTS idx_ledger_audit_log_tenant ON public.ledger_audit_log(tenant_id, created_at DESC);
