-- ============ ENUMS ============
CREATE TYPE public.fiscal_period_status AS ENUM ('open', 'closed', 'locked');
CREATE TYPE public.transaction_type AS ENUM ('vente', 'achat', 'paiement', 'encaissement', 'od', 'paie', 'amortissement', 'cloture', 'transfert');
CREATE TYPE public.transaction_status AS ENUM ('draft', 'validated', 'cancelled');
CREATE TYPE public.fixed_asset_status AS ENUM ('active', 'disposed', 'scrapped');

-- ============ FISCAL YEARS ============
CREATE TABLE public.fiscal_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status fiscal_period_status NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, year)
);
CREATE INDEX idx_fiscal_years_tenant ON public.fiscal_years(tenant_id);
ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY fy_select ON public.fiscal_years FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY fy_ins ON public.fiscal_years FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY fy_upd ON public.fiscal_years FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY fy_del ON public.fiscal_years FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TRIGGER fy_updated_at BEFORE UPDATE ON public.fiscal_years
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FISCAL PERIODS ============
CREATE TABLE public.fiscal_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  fiscal_year_id UUID NOT NULL REFERENCES public.fiscal_years(id) ON DELETE CASCADE,
  period_number INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status fiscal_period_status NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fiscal_year_id, period_number)
);
CREATE INDEX idx_fp_tenant ON public.fiscal_periods(tenant_id);
CREATE INDEX idx_fp_dates ON public.fiscal_periods(tenant_id, period_start, period_end);
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY fp_select ON public.fiscal_periods FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY fp_ins ON public.fiscal_periods FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY fp_upd ON public.fiscal_periods FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY fp_del ON public.fiscal_periods FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TRIGGER fp_updated_at BEFORE UPDATE ON public.fiscal_periods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  reference TEXT,
  journal_code TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type transaction_type NOT NULL DEFAULT 'od',
  description TEXT,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status transaction_status NOT NULL DEFAULT 'draft',
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  source_table TEXT,
  source_id UUID,
  fiscal_period_id UUID REFERENCES public.fiscal_periods(id) ON DELETE SET NULL,
  created_by UUID,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tx_tenant_date ON public.transactions(tenant_id, transaction_date);
CREATE INDEX idx_tx_source ON public.transactions(source_table, source_id);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tx_select ON public.transactions FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY tx_ins ON public.transactions FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY tx_upd ON public.transactions FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY tx_del ON public.transactions FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TRIGGER tx_updated_at BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TRANSACTION LINES (partie double) ============
CREATE TABLE public.transaction_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  line_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);
CREATE INDEX idx_tl_tx ON public.transaction_lines(transaction_id);
CREATE INDEX idx_tl_account ON public.transaction_lines(account_id);
CREATE INDEX idx_tl_tenant ON public.transaction_lines(tenant_id);
ALTER TABLE public.transaction_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY tl_select ON public.transaction_lines FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY tl_ins ON public.transaction_lines FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY tl_upd ON public.transaction_lines FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY tl_del ON public.transaction_lines FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));

-- ============ JOURNAL ENTRIES ============
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  journal_code TEXT NOT NULL DEFAULT 'OD',
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
  account_number TEXT,
  description TEXT,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  reference TEXT,
  fiscal_period_id UUID REFERENCES public.fiscal_periods(id) ON DELETE SET NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_je_tenant_date ON public.journal_entries(tenant_id, entry_date);
CREATE INDEX idx_je_account ON public.journal_entries(account_id);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY je_select ON public.journal_entries FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY je_ins ON public.journal_entries FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY je_upd ON public.journal_entries FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_locked = false AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY je_del ON public.journal_entries FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_locked = false AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TRIGGER je_updated_at BEFORE UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FIXED ASSETS ============
CREATE TABLE public.fixed_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  asset_code TEXT,
  asset_name TEXT NOT NULL,
  category TEXT,
  account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  account_number TEXT,
  acquisition_date DATE NOT NULL,
  acquisition_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  residual_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  useful_life_years INTEGER NOT NULL DEFAULT 5,
  depreciation_method TEXT NOT NULL DEFAULT 'lineaire',
  accumulated_depreciation NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_book_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  status fixed_asset_status NOT NULL DEFAULT 'active',
  disposal_date DATE,
  disposal_value NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fa_tenant ON public.fixed_assets(tenant_id);
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY fa_select ON public.fixed_assets FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY fa_ins ON public.fixed_assets FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY fa_upd ON public.fixed_assets FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY fa_del ON public.fixed_assets FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

CREATE TRIGGER fa_updated_at BEFORE UPDATE ON public.fixed_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DEPRECIATION SCHEDULE ============
CREATE TABLE public.depreciation_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  fixed_asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  depreciation_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  accumulated_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_book_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_posted BOOLEAN NOT NULL DEFAULT false,
  posted_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ds_asset ON public.depreciation_schedule(fixed_asset_id);
CREATE INDEX idx_ds_tenant ON public.depreciation_schedule(tenant_id);
ALTER TABLE public.depreciation_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY ds_select ON public.depreciation_schedule FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY ds_ins ON public.depreciation_schedule FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY ds_upd ON public.depreciation_schedule FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
CREATE POLICY ds_del ON public.depreciation_schedule FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'admin')));

-- ============ LEDGER AUDIT LOG ============
CREATE TABLE public.ledger_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lal_tenant_date ON public.ledger_audit_log(tenant_id, created_at);
CREATE INDEX idx_lal_record ON public.ledger_audit_log(table_name, record_id);
ALTER TABLE public.ledger_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY lal_select ON public.ledger_audit_log FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'gerant') OR has_role(auth.uid(),'comptable') OR has_role(auth.uid(),'admin')));
-- pas d'INSERT direct : seulement via trigger
CREATE POLICY lal_ins_system ON public.ledger_audit_log FOR INSERT TO authenticated
WITH CHECK (false);

-- ============ TRIGGER : équilibre débit = crédit ============
CREATE OR REPLACE FUNCTION public.check_transaction_balance()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _tx_id UUID;
  _total_debit NUMERIC;
  _total_credit NUMERIC;
  _status transaction_status;
BEGIN
  _tx_id := COALESCE(NEW.transaction_id, OLD.transaction_id);
  SELECT status INTO _status FROM public.transactions WHERE id = _tx_id;
  -- on ne vérifie qu'à la validation
  IF _status = 'validated' THEN
    SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0)
      INTO _total_debit, _total_credit
      FROM public.transaction_lines WHERE transaction_id = _tx_id;
    IF ABS(_total_debit - _total_credit) > 0.01 THEN
      RAISE EXCEPTION 'Écriture déséquilibrée : débit % ≠ crédit %', _total_debit, _total_credit;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_transaction_balance() FROM PUBLIC, anon, authenticated;

CREATE CONSTRAINT TRIGGER trg_check_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transaction_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.check_transaction_balance();

-- ============ TRIGGER : blocage périodes clôturées ============
CREATE OR REPLACE FUNCTION public.check_period_not_closed()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _period_status fiscal_period_status;
BEGIN
  IF NEW.fiscal_period_id IS NOT NULL THEN
    SELECT status INTO _period_status
      FROM public.fiscal_periods WHERE id = NEW.fiscal_period_id;
    IF _period_status IN ('closed','locked') THEN
      RAISE EXCEPTION 'Période comptable clôturée : modification interdite';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_period_not_closed() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_tx_period_lock BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.check_period_not_closed();
CREATE TRIGGER trg_je_period_lock BEFORE INSERT OR UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.check_period_not_closed();

-- ============ TRIGGER : audit log auto ============
CREATE OR REPLACE FUNCTION public.log_ledger_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _tenant UUID;
BEGIN
  _tenant := COALESCE(
    (CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END),
    NULL
  );
  IF _tenant IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  INSERT INTO public.ledger_audit_log (tenant_id, table_name, record_id, action, old_data, new_data, user_id)
  VALUES (
    _tenant,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_ledger_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_audit_tx AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.log_ledger_change();
CREATE TRIGGER trg_audit_je AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.log_ledger_change();
CREATE TRIGGER trg_audit_fa AFTER INSERT OR UPDATE OR DELETE ON public.fixed_assets
FOR EACH ROW EXECUTE FUNCTION public.log_ledger_change();