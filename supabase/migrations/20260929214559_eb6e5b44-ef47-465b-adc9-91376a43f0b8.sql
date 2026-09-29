-- 1.1 Tolérance d'équilibre = 0
CREATE OR REPLACE FUNCTION public.check_transaction_balance()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE _tx_id UUID; _d NUMERIC; _c NUMERIC; _status transaction_status;
BEGIN
  _tx_id := COALESCE(NEW.transaction_id, OLD.transaction_id);
  SELECT status INTO _status FROM public.transactions WHERE id = _tx_id;
  IF _status = 'validated' THEN
    SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0) INTO _d, _c
      FROM public.transaction_lines WHERE transaction_id = _tx_id;
    IF _d <> _c THEN
      RAISE EXCEPTION 'Écriture déséquilibrée : débit % ≠ crédit %', _d, _c;
    END IF;
  END IF;
  RETURN NULL;
END; $function$;

-- 1.1 Arrondi des lignes à l'unité FCFA, écart d'arrondi reporté sur la plus grosse ligne
CREATE OR REPLACE FUNCTION public.round_entry_lines(_lines jsonb)
 RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public'
AS $$
DECLARE _out jsonb := '[]'::jsonb; _l jsonb; _i int := 0; _big int := -1; _bigv numeric := -1;
  _d numeric; _c numeric; _sd numeric := 0; _sc numeric := 0; _diff numeric; _bigside text;
BEGIN
  FOR _l IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    _d := ROUND(COALESCE((_l->>'debit')::numeric,0), 0);
    _c := ROUND(COALESCE((_l->>'credit')::numeric,0), 0);
    _sd := _sd + _d; _sc := _sc + _c;
    IF GREATEST(_d,_c) > _bigv THEN _bigv := GREATEST(_d,_c); _big := _i; _bigside := CASE WHEN _d >= _c THEN 'debit' ELSE 'credit' END; END IF;
    _out := _out || jsonb_build_array(_l || jsonb_build_object('debit', _d, 'credit', _c));
    _i := _i + 1;
  END LOOP;
  _diff := _sd - _sc;
  IF _diff <> 0 AND abs(_diff) <= _i AND _big >= 0 THEN
    IF _bigside = 'debit' THEN
      _out := jsonb_set(_out, ARRAY[_big::text,'debit'], to_jsonb((_out->_big->>'debit')::numeric - _diff));
    ELSE
      _out := jsonb_set(_out, ARRAY[_big::text,'credit'], to_jsonb((_out->_big->>'credit')::numeric + _diff));
    END IF;
  END IF;
  RETURN _out;
END $$;

-- Écriture définitive (partagée par le mode live et la validation des écritures en attente)
CREATE OR REPLACE FUNCTION public.post_entry_live(_tenant_id uuid, _event_type text, _entry_date date, _journal text, _description text, _source_table text, _source_id uuid, _lines jsonb, _tx_type transaction_type DEFAULT 'od'::transaction_type)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _tx UUID; _line JSONB; _acc UUID; _debit NUMERIC; _credit NUMERIC; _total NUMERIC := 0; _tc NUMERIC := 0; _order INT := 0;
BEGIN
  _lines := public.round_entry_lines(_lines);
  SELECT COALESCE(SUM((l->>'debit')::numeric),0), COALESCE(SUM((l->>'credit')::numeric),0) INTO _total, _tc FROM jsonb_array_elements(_lines) l;
  IF _total = 0 THEN RETURN NULL; END IF;
  IF _total <> _tc THEN RAISE EXCEPTION 'Écriture déséquilibrée : débit % ≠ crédit %', _total, _tc; END IF;

  INSERT INTO public.transactions (tenant_id, transaction_date, transaction_type, journal_code, description, amount, status, source_table, source_id, created_by)
  VALUES (_tenant_id, _entry_date, _tx_type, _journal, _description, _total, 'draft', _source_table, _source_id, auth.uid())
  RETURNING id INTO _tx;

  FOR _line IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    _acc := public.resolve_account(_tenant_id, _line->>'account', _line->>'label');
    _debit := COALESCE((_line->>'debit')::NUMERIC, 0);
    _credit := COALESCE((_line->>'credit')::NUMERIC, 0);
    IF _debit = 0 AND _credit = 0 THEN CONTINUE; END IF;
    _order := _order + 1;
    INSERT INTO public.transaction_lines (tenant_id, transaction_id, account_id, debit, credit, description, line_order)
    VALUES (_tenant_id, _tx, _acc, _debit, _credit, COALESCE(_line->>'label', _description), _order);
    INSERT INTO public.journal_entries (tenant_id, transaction_id, entry_date, journal_code, account_id, account_number, account_name, description, debit, credit, created_by)
    SELECT _tenant_id, _tx, _entry_date, _journal, _acc, coa.account_number, coa.account_name, COALESCE(_line->>'label', _description), _debit, _credit, auth.uid()
    FROM public.chart_of_accounts coa WHERE coa.id = _acc;
  END LOOP;

  UPDATE public.transactions SET status = 'validated', is_validated = true WHERE id = _tx;
  PERFORM public.emit_domain_event(_tenant_id, 'accounting.entry_posted', 'transaction', _tx,
    jsonb_build_object('event_type', _event_type, 'amount', _total, 'source', _source_table));
  RETURN _tx;
END; $function$;

CREATE OR REPLACE FUNCTION public.post_accounting_entry(_tenant_id uuid, _event_type text, _entry_date date, _journal text, _description text, _source_table text, _source_id uuid, _lines jsonb, _tx_type transaction_type DEFAULT 'od'::transaction_type)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _mode TEXT; _tx UUID; _total NUMERIC := 0;
BEGIN
  IF _tenant_id IS NULL OR _lines IS NULL OR jsonb_array_length(_lines) = 0 THEN RETURN NULL; END IF;
  SELECT posting_mode INTO _mode FROM public.accounting_config WHERE tenant_id = _tenant_id;
  IF _mode IS NULL THEN
    INSERT INTO public.accounting_config (tenant_id) VALUES (_tenant_id) ON CONFLICT (tenant_id) DO NOTHING;
    _mode := 'shadow';
  END IF;
  IF _mode = 'off' THEN RETURN NULL; END IF;
  _lines := public.round_entry_lines(_lines);
  SELECT COALESCE(SUM((l->>'debit')::numeric), 0) INTO _total FROM jsonb_array_elements(_lines) l;
  IF _total = 0 THEN RETURN NULL; END IF;
  IF _mode = 'shadow' THEN
    INSERT INTO public.accounting_shadow_entries (tenant_id, event_type, entry_date, journal_code, description, source_table, source_id, lines, total_amount, tx_type)
    VALUES (_tenant_id, _event_type, _entry_date, _journal, _description, _source_table, _source_id, _lines, _total, _tx_type::text)
    RETURNING id INTO _tx;
    RETURN _tx;
  END IF;
  RETURN public.post_entry_live(_tenant_id, _event_type, _entry_date, _journal, _description, _source_table, _source_id, _lines, _tx_type);
END; $function$;

-- 1.2 Écritures en attente : statut, validation, rejet
ALTER TABLE public.accounting_shadow_entries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tx_type text NOT NULL DEFAULT 'od',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS posted_transaction_id uuid;
CREATE INDEX IF NOT EXISTS idx_shadow_tenant_status ON public.accounting_shadow_entries(tenant_id, status);

CREATE OR REPLACE FUNCTION public.validate_shadow_entries(_ids uuid[])
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _t uuid := get_user_tenant_id(auth.uid()); _e record; _tx uuid; _n int := 0;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['gerant','comptable','admin']::app_role[]) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  FOR _e IN SELECT * FROM accounting_shadow_entries WHERE tenant_id = _t AND status = 'pending'
            AND (_ids IS NULL OR id = ANY(_ids)) ORDER BY entry_date, created_at FOR UPDATE LOOP
    _tx := post_entry_live(_e.tenant_id, _e.event_type, _e.entry_date, _e.journal_code, _e.description,
                           _e.source_table, _e.source_id, _e.lines, COALESCE(NULLIF(_e.tx_type,''),'od')::transaction_type);
    UPDATE accounting_shadow_entries SET status='validated', reviewed_by=auth.uid(), reviewed_at=now(), posted_transaction_id=_tx WHERE id=_e.id;
    PERFORM emit_domain_event(_t, 'accounting.shadow_validated', 'shadow_entry', _e.id, jsonb_build_object('transaction_id', _tx, 'amount', _e.total_amount));
    _n := _n + 1;
  END LOOP;
  RETURN jsonb_build_object('validated', _n);
END $$;

CREATE OR REPLACE FUNCTION public.reject_shadow_entries(_ids uuid[], _reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _t uuid := get_user_tenant_id(auth.uid()); _n int;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['gerant','comptable','admin']::app_role[]) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF coalesce(trim(_reason),'') = '' THEN RAISE EXCEPTION 'Le motif du rejet est obligatoire'; END IF;
  WITH u AS (
    UPDATE accounting_shadow_entries SET status='rejected', reviewed_by=auth.uid(), reviewed_at=now(), reject_reason=_reason
    WHERE tenant_id=_t AND status='pending' AND id = ANY(_ids) RETURNING id)
  SELECT count(*) INTO _n FROM u;
  PERFORM emit_domain_event(_t, 'accounting.shadow_rejected', 'shadow_entry', NULL, jsonb_build_object('ids', _ids, 'reason', _reason));
  RETURN jsonb_build_object('rejected', _n);
END $$;

CREATE OR REPLACE FUNCTION public.set_posting_mode(_mode text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _t uuid := get_user_tenant_id(auth.uid());
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['gerant','admin']::app_role[]) THEN RAISE EXCEPTION 'Seul le gérant peut changer le mode comptable'; END IF;
  IF _mode NOT IN ('shadow','live') THEN RAISE EXCEPTION 'Mode invalide'; END IF;
  INSERT INTO accounting_config (tenant_id, posting_mode) VALUES (_t, _mode)
    ON CONFLICT (tenant_id) DO UPDATE SET posting_mode = EXCLUDED.posting_mode;
  PERFORM emit_domain_event(_t, 'accounting.mode_changed', 'accounting_config', NULL, jsonb_build_object('mode', _mode));
  RETURN _mode;
END $$;

-- 1.3 Comptes de trésorerie : soldes réservés à la comptabilité ; liste sans soldes pour payer
DROP POLICY IF EXISTS accounts_select_tenant ON public.accounts;
CREATE POLICY accounts_select_accounting ON public.accounts FOR SELECT TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid()) AND has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[])) OR has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.list_payment_accounts()
 RETURNS TABLE(id uuid, account_name text, account_number text, account_type text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.id, a.account_name, a.account_number, a.account_type::text
  FROM accounts a
  WHERE a.tenant_id = get_user_tenant_id(auth.uid())
    AND COALESCE(a.is_active, true)
    AND has_any_role(auth.uid(), ARRAY['gerant','comptable','rh','commercial','magasinier','chef_production','admin']::app_role[])
  ORDER BY a.account_name
$$;

REVOKE EXECUTE ON FUNCTION public.post_entry_live(uuid,text,date,text,text,text,uuid,jsonb,transaction_type) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.round_entry_lines(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_shadow_entries(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_shadow_entries(uuid[], text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_posting_mode(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_payment_accounts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_shadow_entries(uuid[]), public.reject_shadow_entries(uuid[], text), public.set_posting_mode(text), public.list_payment_accounts() TO authenticated;