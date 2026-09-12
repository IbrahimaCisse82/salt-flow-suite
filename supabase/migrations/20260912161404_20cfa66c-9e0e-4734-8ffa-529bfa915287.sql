-- Fonctions internes non appelables par les utilisateurs
REVOKE ALL ON FUNCTION public.post_closing_entry(uuid, date, text, text, jsonb, transaction_type) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_accounting_access(uuid) FROM PUBLIC, anon;

-- ============ Affectation du résultat ============
CREATE OR REPLACE FUNCTION public.allocate_result(
  p_tenant_id uuid, p_fiscal_year_end date,
  p_reserve_legale numeric DEFAULT 0, p_autres_reserves numeric DEFAULT 0,
  p_report_nouveau numeric DEFAULT 0, p_dividendes numeric DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _b131 numeric; _b139 numeric; _total numeric; _lines jsonb := '[]'::jsonb; _tx uuid;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);

  SELECT COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) INTO _b131
    FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date <= p_fiscal_year_end AND account_number LIKE '131%';
  SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) INTO _b139
    FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date <= p_fiscal_year_end AND account_number LIKE '139%';

  IF COALESCE(_b139,0) > 0.005 THEN
    -- Report de la perte au compte 129
    _lines := jsonb_build_array(
      jsonb_build_object('account','129','label','Report à nouveau débiteur','debit',_b139,'credit',0),
      jsonb_build_object('account','139','label','Résultat net : perte','debit',0,'credit',_b139));
    _tx := public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'AFF',
            'Report de la perte de l''exercice', _lines);
    RETURN jsonb_build_object('success', true, 'type', 'perte', 'montant', _b139, 'transaction_id', _tx);
  END IF;

  IF COALESCE(_b131,0) <= 0.005 THEN
    RAISE EXCEPTION 'Aucun résultat à affecter : clôturez d''abord l''exercice';
  END IF;

  _total := COALESCE(p_reserve_legale,0) + COALESCE(p_autres_reserves,0)
          + COALESCE(p_report_nouveau,0) + COALESCE(p_dividendes,0);
  IF ABS(_total - _b131) > 0.5 THEN
    RAISE EXCEPTION 'Affectation déséquilibrée : % affecté pour un résultat de %', _total, _b131;
  END IF;

  _lines := jsonb_build_array(
    jsonb_build_object('account','131','label','Affectation du résultat','debit',_b131,'credit',0));
  IF COALESCE(p_reserve_legale,0) > 0 THEN
    _lines := _lines || jsonb_build_object('account','111','label','Réserve légale','debit',0,'credit',p_reserve_legale);
  END IF;
  IF COALESCE(p_autres_reserves,0) > 0 THEN
    _lines := _lines || jsonb_build_object('account','118','label','Autres réserves','debit',0,'credit',p_autres_reserves);
  END IF;
  IF COALESCE(p_report_nouveau,0) > 0 THEN
    _lines := _lines || jsonb_build_object('account','121','label','Report à nouveau créditeur','debit',0,'credit',p_report_nouveau);
  END IF;
  IF COALESCE(p_dividendes,0) > 0 THEN
    _lines := _lines || jsonb_build_object('account','465','label','Associés — dividendes à payer','debit',0,'credit',p_dividendes);
  END IF;

  _tx := public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'AFF',
          'Affectation du résultat de l''exercice', _lines);

  PERFORM public.emit_domain_event(p_tenant_id, 'accounting.result_allocated', 'transaction', _tx,
    jsonb_build_object('montant', _b131));

  RETURN jsonb_build_object('success', true, 'type', 'benefice', 'montant', _b131, 'transaction_id', _tx);
END; $$;

-- ============ Report à nouveau : écritures d'ouverture ============
CREATE OR REPLACE FUNCTION public.generate_opening_balances(
  p_tenant_id uuid, p_fiscal_year_end date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _open date; _lines jsonb := '[]'::jsonb; _r record; _tx uuid; _exists int; _total numeric := 0;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);
  _open := (p_fiscal_year_end + 1);

  SELECT count(*) INTO _exists FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND journal_code = 'AN' AND entry_date = _open;
  IF _exists > 0 THEN
    RAISE EXCEPTION 'Les à-nouveaux du % ont déjà été générés', _open;
  END IF;

  FOR _r IN
    SELECT je.account_number, MAX(je.account_name) AS account_name,
           COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0) AS net
      FROM public.journal_entries je
     WHERE je.tenant_id = p_tenant_id AND je.entry_date <= p_fiscal_year_end
       AND left(je.account_number, 1) IN ('1','2','3','4','5')
       AND je.account_number NOT LIKE '131%' AND je.account_number NOT LIKE '139%'
     GROUP BY je.account_number
    HAVING ABS(COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0)) > 0.005
  LOOP
    _total := _total + _r.net;
    _lines := _lines || jsonb_build_object(
      'account', _r.account_number, 'label', 'À-nouveau — ' || COALESCE(_r.account_name,''),
      'debit', CASE WHEN _r.net > 0 THEN _r.net ELSE 0 END,
      'credit', CASE WHEN _r.net < 0 THEN -_r.net ELSE 0 END);
  END LOOP;

  IF jsonb_array_length(_lines) = 0 THEN
    RAISE EXCEPTION 'Aucun solde de bilan à reporter';
  END IF;

  -- Écart d'arrondi éventuel porté au report à nouveau
  IF ABS(_total) > 0.005 THEN
    _lines := _lines || jsonb_build_object('account', CASE WHEN _total > 0 THEN '121' ELSE '129' END,
      'label','Report à nouveau (équilibrage)',
      'debit', CASE WHEN _total < 0 THEN -_total ELSE 0 END,
      'credit', CASE WHEN _total > 0 THEN _total ELSE 0 END);
  END IF;

  _tx := public.post_closing_entry(p_tenant_id, _open, 'AN',
          'Report à nouveau — ouverture exercice ' || EXTRACT(YEAR FROM _open)::int, _lines);

  INSERT INTO public.fiscal_years (tenant_id, year, start_date, end_date, status)
  VALUES (p_tenant_id, EXTRACT(YEAR FROM _open)::int, _open,
          (date_trunc('year', _open::timestamp) + interval '1 year - 1 day')::date, 'open')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'opening_date', _open,
                            'lines', jsonb_array_length(_lines), 'transaction_id', _tx);
END; $$;

-- ============ Bilan ============
CREATE OR REPLACE FUNCTION public.generate_balance_sheet(
  p_tenant_id uuid, p_period_start date, p_period_end date, p_campagne_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _immo jsonb; _circ jsonb; _cap jsonb; _det jsonb;
  _t_immo numeric; _t_circ numeric; _t_cap numeric; _t_det numeric; _resultat numeric; _data jsonb;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);

  CREATE TEMP TABLE IF NOT EXISTS _bs_bal (account_number text, account_name text, net numeric) ON COMMIT DROP;
  DELETE FROM _bs_bal;
  INSERT INTO _bs_bal
  SELECT je.account_number, MAX(je.account_name),
         COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0)
    FROM public.journal_entries je
   WHERE je.tenant_id = p_tenant_id AND je.entry_date <= p_period_end
     AND left(je.account_number,1) IN ('1','2','3','4','5')
   GROUP BY je.account_number
  HAVING ABS(COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0)) > 0.005;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(net),0) INTO _immo, _t_immo
    FROM _bs_bal WHERE left(account_number,1) = '2' AND net > 0;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(net),0) INTO _circ, _t_circ
    FROM _bs_bal WHERE left(account_number,1) IN ('3','4','5') AND net > 0;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',-net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(-net),0) INTO _cap, _t_cap
    FROM _bs_bal WHERE left(account_number,1) = '1'
      AND left(account_number,2) NOT IN ('16','17','18') AND net < 0;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',-net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(-net),0) INTO _det, _t_det
    FROM _bs_bal WHERE net < 0
      AND (left(account_number,1) IN ('4','5') OR left(account_number,2) IN ('16','17','18'));

  -- Résultat de la période non encore affecté (comptes de gestion)
  SELECT COALESCE(SUM(credit) - SUM(debit),0) INTO _resultat
    FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,1) IN ('6','7','8');

  IF ABS(COALESCE(_resultat,0)) > 0.005 THEN
    _cap := _cap || jsonb_build_object('account_number','13','account_name','Résultat net de la période','balance',_resultat);
    _t_cap := _t_cap + _resultat;
  END IF;

  _data := jsonb_build_object(
    'actif', jsonb_build_object('actif_immobilise', _immo, 'actif_circulant', _circ, 'total', _t_immo + _t_circ),
    'passif', jsonb_build_object('capitaux_propres', _cap, 'dettes', _det, 'total', _t_cap + _t_det),
    'equilibre', ABS((_t_immo + _t_circ) - (_t_cap + _t_det)) < 1,
    'generated_at', now());

  INSERT INTO public.financial_reports (tenant_id, report_type, period_start, period_end, status, data, generated_by)
  VALUES (p_tenant_id, 'bilan', p_period_start, p_period_end, 'draft', _data, auth.uid());

  RETURN _data;
END; $$;

-- ============ Compte de résultat ============
CREATE OR REPLACE FUNCTION public.generate_income_statement(
  p_tenant_id uuid, p_period_start date, p_period_end date, p_campagne_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pe jsonb; _pf jsonb; _ce jsonb; _cf jsonb;
  _tpe numeric; _tpf numeric; _tce numeric; _tcf numeric; _data jsonb;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);

  CREATE TEMP TABLE IF NOT EXISTS _is_bal (account_number text, account_name text, net numeric) ON COMMIT DROP;
  DELETE FROM _is_bal;
  INSERT INTO _is_bal
  SELECT je.account_number, MAX(je.account_name),
         COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0)
    FROM public.journal_entries je
   WHERE je.tenant_id = p_tenant_id
     AND je.entry_date BETWEEN p_period_start AND p_period_end
     AND left(je.account_number,1) IN ('6','7','8')
   GROUP BY je.account_number
  HAVING ABS(COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0)) > 0.005;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',-net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(-net),0) INTO _pe, _tpe
    FROM _is_bal WHERE left(account_number,2) NOT IN ('77','87') AND left(account_number,1) IN ('7','8');

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',-net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(-net),0) INTO _pf, _tpf
    FROM _is_bal WHERE left(account_number,2) = '77';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(net),0) INTO _ce, _tce
    FROM _is_bal WHERE left(account_number,1) = '6' AND left(account_number,2) <> '67';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('account_number',account_number,'account_name',account_name,'balance',net) ORDER BY account_number),'[]'::jsonb),
         COALESCE(SUM(net),0) INTO _cf, _tcf
    FROM _is_bal WHERE left(account_number,2) IN ('67','87');

  _data := jsonb_build_object(
    'produits', jsonb_build_object('exploitation', _pe, 'financiers', _pf, 'total', _tpe + _tpf),
    'charges', jsonb_build_object('exploitation', _ce, 'financieres', _cf, 'total', _tce + _tcf),
    'resultats', jsonb_build_object(
      'exploitation', _tpe - _tce,
      'financier', _tpf - _tcf,
      'net', (_tpe + _tpf) - (_tce + _tcf)),
    'generated_at', now());

  INSERT INTO public.financial_reports (tenant_id, report_type, period_start, period_end, status, data, generated_by)
  VALUES (p_tenant_id, 'compte_resultat', p_period_start, p_period_end, 'draft', _data, auth.uid());

  RETURN _data;
END; $$;

-- ============ TAFIRE ============
CREATE OR REPLACE FUNCTION public.generate_tafire(
  p_tenant_id uuid, p_period_start date, p_period_end date, p_campagne_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _resultat numeric; _dotations numeric; _reprises numeric; _cafg numeric;
  _invest numeric; _cessions numeric; _capital numeric; _emprunts_new numeric; _emprunts_remb numeric;
  _var_stocks numeric; _var_creances numeric; _var_dettes numeric; _var_bfr numeric;
  _tres_debut numeric; _tres_fin numeric; _var_tres numeric;
  _emplois numeric; _ressources numeric; _data jsonb;
  _mvt numeric;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);

  SELECT COALESCE(SUM(credit) - SUM(debit),0) INTO _resultat FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,1) IN ('6','7','8');

  SELECT COALESCE(SUM(debit) - SUM(credit),0) INTO _dotations FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,2) IN ('68','69');

  SELECT COALESCE(SUM(credit) - SUM(debit),0) INTO _reprises FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,2) IN ('78','79');

  _cafg := _resultat + _dotations - _reprises;

  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0) INTO _invest, _cessions
    FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,1) = '2' AND left(account_number,2) NOT IN ('28','29');

  SELECT COALESCE(SUM(credit) - SUM(debit),0) INTO _capital FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,2) IN ('10','11');

  SELECT COALESCE(SUM(credit),0), COALESCE(SUM(debit),0) INTO _emprunts_new, _emprunts_remb
    FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,2) IN ('16','17');

  SELECT COALESCE(SUM(debit) - SUM(credit),0) INTO _var_stocks FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,1) = '3';

  SELECT COALESCE(SUM(debit) - SUM(credit),0) INTO _var_creances FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,2) IN ('41','42','43','44','45','46','47') AND left(account_number,2) <> '40';

  SELECT COALESCE(SUM(credit) - SUM(debit),0) INTO _var_dettes FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN p_period_start AND p_period_end
     AND left(account_number,2) = '40';

  _var_bfr := _var_stocks + _var_creances - _var_dettes;

  SELECT COALESCE(SUM(debit) - SUM(credit),0) INTO _tres_debut FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date < p_period_start AND left(account_number,1) = '5';

  SELECT COALESCE(SUM(debit) - SUM(credit),0) INTO _tres_fin FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date <= p_period_end AND left(account_number,1) = '5';

  _var_tres := _tres_fin - _tres_debut;
  _emplois := GREATEST(_invest,0) + GREATEST(_emprunts_remb,0) + GREATEST(_var_bfr,0);
  _ressources := _cafg + GREATEST(_cessions,0) + GREATEST(_capital,0) + GREATEST(_emprunts_new,0)
                 + GREATEST(-_var_bfr,0);

  _data := jsonb_build_object(
    'caf', jsonb_build_object(
      'resultat_net', _resultat, 'dotations', _dotations, 'reprises', _reprises, 'cafg', _cafg),
    'emplois', jsonb_build_array(
      jsonb_build_object('libelle','Acquisitions d''immobilisations','montant',GREATEST(_invest,0)),
      jsonb_build_object('libelle','Remboursements d''emprunts','montant',GREATEST(_emprunts_remb,0)),
      jsonb_build_object('libelle','Augmentation du besoin en fonds de roulement','montant',GREATEST(_var_bfr,0))),
    'ressources', jsonb_build_array(
      jsonb_build_object('libelle','Capacité d''autofinancement globale','montant',_cafg),
      jsonb_build_object('libelle','Cessions d''immobilisations','montant',GREATEST(_cessions,0)),
      jsonb_build_object('libelle','Augmentation de capital et subventions','montant',GREATEST(_capital,0)),
      jsonb_build_object('libelle','Nouveaux emprunts','montant',GREATEST(_emprunts_new,0)),
      jsonb_build_object('libelle','Diminution du besoin en fonds de roulement','montant',GREATEST(-_var_bfr,0))),
    'bfr', jsonb_build_object('stocks',_var_stocks,'creances',_var_creances,'dettes',_var_dettes,'variation',_var_bfr),
    'tresorerie', jsonb_build_object(
      'ouverture', _tres_debut, 'cloture', _tres_fin, 'variation', _var_tres),
    'total_emplois', _emplois,
    'total_ressources', _ressources,
    'ecart', (_ressources - _emplois) - _var_tres,
    'generated_at', now());

  INSERT INTO public.financial_reports (tenant_id, report_type, period_start, period_end, status, data, generated_by)
  VALUES (p_tenant_id, 'tafire', p_period_start, p_period_end, 'draft', _data, auth.uid());

  RETURN _data;
END; $$;
