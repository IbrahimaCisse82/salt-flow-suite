-- ============ Helpers ============
CREATE OR REPLACE FUNCTION public.assert_accounting_access(_tenant_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _tenant_id IS NULL THEN RAISE EXCEPTION 'Entreprise non identifiée'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR (public.is_tenant_member(auth.uid(), _tenant_id)
              AND public.has_any_role(auth.uid(), ARRAY['gerant','comptable']::app_role[]))) THEN
    RAISE EXCEPTION 'Accès refusé : opération réservée au gérant, au comptable ou à l''administrateur';
  END IF;
END; $$;

-- Poste une écriture directement au grand livre (ignore le mode shadow : opérations de clôture)
CREATE OR REPLACE FUNCTION public.post_closing_entry(
  _tenant_id uuid, _entry_date date, _journal text, _description text, _lines jsonb,
  _tx_type transaction_type DEFAULT 'cloture'::transaction_type)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _tx uuid; _line jsonb; _acc uuid; _debit numeric; _credit numeric; _total numeric := 0; _order int := 0;
BEGIN
  IF _lines IS NULL OR jsonb_array_length(_lines) = 0 THEN RETURN NULL; END IF;

  SELECT COALESCE(SUM(GREATEST((l->>'debit')::numeric, 0)), 0) INTO _total
    FROM jsonb_array_elements(_lines) l;
  IF _total <= 0 THEN RETURN NULL; END IF;

  INSERT INTO public.transactions
    (tenant_id, transaction_date, transaction_type, journal_code, description, amount,
     status, source_table, created_by)
  VALUES (_tenant_id, _entry_date, _tx_type, _journal, _description, _total,
          'draft', 'fiscal_closing', auth.uid())
  RETURNING id INTO _tx;

  FOR _line IN SELECT * FROM jsonb_array_elements(_lines) LOOP
    _acc := public.resolve_account(_tenant_id, _line->>'account', _line->>'label');
    _debit := COALESCE((_line->>'debit')::numeric, 0);
    _credit := COALESCE((_line->>'credit')::numeric, 0);
    _order := _order + 1;

    INSERT INTO public.transaction_lines
      (tenant_id, transaction_id, account_id, debit, credit, description, line_order)
    VALUES (_tenant_id, _tx, _acc, _debit, _credit, COALESCE(_line->>'label', _description), _order);

    INSERT INTO public.journal_entries
      (tenant_id, transaction_id, entry_date, journal_code, account_id,
       account_number, account_name, description, debit, credit, created_by)
    SELECT _tenant_id, _tx, _entry_date, _journal, _acc, coa.account_number, coa.account_name,
           COALESCE(_line->>'label', _description), _debit, _credit, auth.uid()
      FROM public.chart_of_accounts coa WHERE coa.id = _acc;
  END LOOP;

  UPDATE public.transactions SET status = 'validated', is_validated = true WHERE id = _tx;
  RETURN _tx;
END; $$;

-- ============ Clôture d'exercice ============
CREATE OR REPLACE FUNCTION public.close_fiscal_year(
  p_tenant_id uuid, p_fiscal_year_end date, p_description text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _start date; _year int; _fy uuid;
  _lines jsonb := '[]'::jsonb; _r record; _net numeric; _solde numeric := 0;
  _resultat numeric; _tx uuid; _tx104 uuid; _b104 numeric;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);
  _year := EXTRACT(YEAR FROM p_fiscal_year_end)::int;
  _start := make_date(_year, 1, 1);

  SELECT id INTO _fy FROM public.fiscal_years
   WHERE tenant_id = p_tenant_id AND year = _year;
  IF _fy IS NULL THEN
    INSERT INTO public.fiscal_years (tenant_id, year, start_date, end_date, status)
    VALUES (p_tenant_id, _year, _start, p_fiscal_year_end, 'open') RETURNING id INTO _fy;
  ELSIF (SELECT status::text FROM public.fiscal_years WHERE id = _fy) IN ('closed','locked') THEN
    RAISE EXCEPTION 'Exercice % déjà clôturé', _year;
  END IF;

  -- Soldes des comptes de gestion (classes 6, 7 et 8)
  FOR _r IN
    SELECT je.account_number,
           MAX(je.account_name) AS account_name,
           COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0) AS net
      FROM public.journal_entries je
     WHERE je.tenant_id = p_tenant_id
       AND je.entry_date BETWEEN _start AND p_fiscal_year_end
       AND left(je.account_number, 1) IN ('6','7','8')
     GROUP BY je.account_number
    HAVING ABS(COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0)) > 0.005
  LOOP
    _net := _r.net;
    _solde := _solde + _net;
    _lines := _lines || jsonb_build_object(
      'account', _r.account_number, 'label', 'Solde de clôture — ' || COALESCE(_r.account_name,''),
      'debit', CASE WHEN _net < 0 THEN -_net ELSE 0 END,
      'credit', CASE WHEN _net > 0 THEN _net ELSE 0 END);
  END LOOP;

  IF jsonb_array_length(_lines) = 0 THEN
    RAISE EXCEPTION 'Aucune écriture de gestion à solder pour l''exercice %', _year;
  END IF;

  _resultat := -_solde; -- > 0 : bénéfice
  IF _resultat >= 0 THEN
    _lines := _lines || jsonb_build_object('account', '131', 'label', 'Résultat net : bénéfice',
                                           'debit', 0, 'credit', _resultat);
  ELSE
    _lines := _lines || jsonb_build_object('account', '139', 'label', 'Résultat net : perte',
                                           'debit', -_resultat, 'credit', 0);
  END IF;

  _tx := public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'CLO',
          COALESCE(p_description, 'Clôture exercice ' || _year), _lines);

  -- Virement compte de l'exploitant 104 → capital personnel 103
  SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) INTO _b104
    FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date <= p_fiscal_year_end
     AND account_number LIKE '104%';
  IF _b104 IS NOT NULL AND ABS(_b104) > 0.005 THEN
    _tx104 := public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'CLO',
      'Virement compte de l''exploitant',
      jsonb_build_array(
        jsonb_build_object('account','104','label','Compte de l''exploitant',
          'debit', CASE WHEN _b104 < 0 THEN -_b104 ELSE 0 END,
          'credit', CASE WHEN _b104 > 0 THEN _b104 ELSE 0 END),
        jsonb_build_object('account','103','label','Capital personnel',
          'debit', CASE WHEN _b104 > 0 THEN _b104 ELSE 0 END,
          'credit', CASE WHEN _b104 < 0 THEN -_b104 ELSE 0 END)));
  END IF;

  UPDATE public.fiscal_years
     SET status = 'closed', closed_at = now(), closed_by = auth.uid(), updated_at = now()
   WHERE id = _fy;

  UPDATE public.fiscal_periods
     SET status = 'closed', closed_at = now(), closed_by = auth.uid(), updated_at = now()
   WHERE tenant_id = p_tenant_id AND fiscal_year_id = _fy AND status = 'open';

  UPDATE public.journal_entries
     SET is_locked = true, updated_at = now()
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN _start AND p_fiscal_year_end;

  PERFORM public.emit_domain_event(p_tenant_id, 'accounting.fiscal_year_closed', 'fiscal_year', _fy,
    jsonb_build_object('year', _year, 'resultat', _resultat));

  RETURN jsonb_build_object('success', true, 'fiscal_year_id', _fy, 'year', _year,
                            'resultat', _resultat, 'transaction_id', _tx);
END; $$;
