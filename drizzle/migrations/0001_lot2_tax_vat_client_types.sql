ALTER TYPE public.client_type ADD VALUE IF NOT EXISTS 'zone_ohada';
ALTER TYPE public.client_type ADD VALUE IF NOT EXISTS 'hors_ohada';

ALTER TABLE public.accounting_config
  ADD COLUMN IF NOT EXISTS corporate_tax_rate numeric NOT NULL DEFAULT 0.30,
  ADD COLUMN IF NOT EXISTS minimum_tax_rate numeric NOT NULL DEFAULT 0.005,
  ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'SN';

CREATE OR REPLACE FUNCTION public.close_fiscal_year(p_tenant_id uuid, p_fiscal_year_end date, p_description text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _start date; _year int; _fy uuid;
  _lines jsonb := '[]'::jsonb; _r record; _net numeric; _solde numeric := 0;
  _resultat numeric; _tx uuid; _tx104 uuid; _b104 numeric;
  _rai numeric; _ca numeric; _is_rate numeric; _imf_rate numeric; _impot numeric := 0; _has89 boolean;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);
  _year := EXTRACT(YEAR FROM p_fiscal_year_end)::int;
  _start := make_date(_year, 1, 1);

  SELECT id INTO _fy FROM public.fiscal_years WHERE tenant_id = p_tenant_id AND year = _year;
  IF _fy IS NULL THEN
    INSERT INTO public.fiscal_years (tenant_id, year, start_date, end_date, status)
    VALUES (p_tenant_id, _year, _start, p_fiscal_year_end, 'open') RETURNING id INTO _fy;
  ELSIF (SELECT status::text FROM public.fiscal_years WHERE id = _fy) IN ('closed','locked') THEN
    RAISE EXCEPTION 'Exercice % déjà clôturé', _year;
  END IF;

  -- Impôt sur le résultat (classe 89) avant détermination du résultat net
  SELECT EXISTS (SELECT 1 FROM public.journal_entries WHERE tenant_id = p_tenant_id
     AND entry_date BETWEEN _start AND p_fiscal_year_end AND account_number LIKE '89%') INTO _has89;
  IF NOT _has89 THEN
    SELECT COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) INTO _rai FROM public.journal_entries
     WHERE tenant_id = p_tenant_id AND entry_date BETWEEN _start AND p_fiscal_year_end
       AND left(account_number,1) IN ('6','7','8');
    SELECT COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) INTO _ca FROM public.journal_entries
     WHERE tenant_id = p_tenant_id AND entry_date BETWEEN _start AND p_fiscal_year_end
       AND account_number LIKE '70%';
    SELECT COALESCE(corporate_tax_rate,0.30), COALESCE(minimum_tax_rate,0.005) INTO _is_rate, _imf_rate
      FROM public.accounting_config WHERE tenant_id = p_tenant_id;
    _is_rate := COALESCE(_is_rate,0.30); _imf_rate := COALESCE(_imf_rate,0.005);
    _impot := round(GREATEST(GREATEST(_rai,0) * _is_rate, GREATEST(_ca,0) * _imf_rate), 0);
    IF _impot > 0 THEN
      PERFORM public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'CLO',
        'Impôt sur le résultat ' || _year,
        jsonb_build_array(
          jsonb_build_object('account','891','label','Impôts sur les bénéfices de l''exercice','debit',_impot,'credit',0),
          jsonb_build_object('account','441','label','État, impôt sur les bénéfices','debit',0,'credit',_impot)));
    END IF;
  END IF;

  FOR _r IN
    SELECT je.account_number, MAX(je.account_name) AS account_name,
           COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0) AS net
      FROM public.journal_entries je
     WHERE je.tenant_id = p_tenant_id AND je.entry_date BETWEEN _start AND p_fiscal_year_end
       AND left(je.account_number, 1) IN ('6','7','8')
     GROUP BY je.account_number
    HAVING COALESCE(SUM(je.debit),0) - COALESCE(SUM(je.credit),0) <> 0
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

  _resultat := -_solde;
  IF _resultat >= 0 THEN
    _lines := _lines || jsonb_build_object('account','131','label','Résultat net : bénéfice','debit',0,'credit',_resultat);
  ELSE
    _lines := _lines || jsonb_build_object('account','139','label','Résultat net : perte','debit',-_resultat,'credit',0);
  END IF;

  _tx := public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'CLO',
          COALESCE(p_description, 'Clôture exercice ' || _year), _lines);

  SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) INTO _b104 FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date <= p_fiscal_year_end AND account_number LIKE '104%';
  IF _b104 IS NOT NULL AND _b104 <> 0 THEN
    _tx104 := public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'CLO', 'Virement compte de l''exploitant',
      jsonb_build_array(
        jsonb_build_object('account','104','label','Compte de l''exploitant',
          'debit', CASE WHEN _b104 < 0 THEN -_b104 ELSE 0 END, 'credit', CASE WHEN _b104 > 0 THEN _b104 ELSE 0 END),
        jsonb_build_object('account','103','label','Capital personnel',
          'debit', CASE WHEN _b104 > 0 THEN _b104 ELSE 0 END, 'credit', CASE WHEN _b104 < 0 THEN -_b104 ELSE 0 END)));
  END IF;

  UPDATE public.fiscal_years SET status = 'closed', closed_at = now(), closed_by = auth.uid(), updated_at = now() WHERE id = _fy;
  UPDATE public.fiscal_periods SET status = 'closed', closed_at = now(), closed_by = auth.uid(), updated_at = now()
   WHERE tenant_id = p_tenant_id AND fiscal_year_id = _fy AND status = 'open';
  UPDATE public.journal_entries SET is_locked = true, updated_at = now()
   WHERE tenant_id = p_tenant_id AND entry_date BETWEEN _start AND p_fiscal_year_end;

  PERFORM public.emit_domain_event(p_tenant_id, 'accounting.fiscal_year_closed', 'fiscal_year', _fy,
    jsonb_build_object('year', _year, 'resultat', _resultat, 'impot', _impot));

  RETURN jsonb_build_object('success', true, 'fiscal_year_id', _fy, 'year', _year,
                            'resultat', _resultat, 'impot', _impot, 'transaction_id', _tx);
END; $function$;

-- Vente : seul le client "local" est en 7021 avec TVA ; tous les autres clients (zone OHADA, hors zone, export) en 7022 sans TVA
CREATE OR REPLACE FUNCTION public.trg_acc_sale_invoiced()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _ht NUMERIC; _tva NUMERIC; _ttc NUMERIC; _lines JSONB; _ctype text; _foreign boolean;
BEGIN
  IF NEW.status NOT IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('invoiced','confirmed','delivered','completed') THEN RETURN NEW; END IF;
  SELECT client_type::text INTO _ctype FROM public.clients WHERE id = NEW.client_id;
  _foreign := COALESCE(NEW.is_export, false) OR COALESCE(_ctype,'local') IN ('export','zone_ohada','hors_ohada');
  _ttc := COALESCE(NEW.total_amount, 0);
  _tva := COALESCE(NEW.tva_amount, NEW.tax_amount, 0);
  _ht  := COALESCE(NULLIF(NEW.amount_ht, 0), _ttc - _tva);
  IF _ttc <= 0 THEN RETURN NEW; END IF;
  IF _foreign THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','411','label','Clients','debit',_ttc,'credit',0),
      jsonb_build_object('account','7022','label','Ventes de produits finis hors Région','debit',0,'credit',_ttc));
    PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_invoiced_export',NEW.sale_date,'VE',
      'Facture export ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'vente_export');
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','411','label','Clients','debit',_ttc,'credit',0),
      jsonb_build_object('account','7021','label','Ventes de produits finis dans la Région','debit',0,'credit',_ht));
    IF _tva > 0 THEN
      _lines := _lines || jsonb_build_array(
        jsonb_build_object('account','4431','label','TVA facturée sur ventes','debit',0,'credit',_tva));
    END IF;
    PERFORM public.post_accounting_entry(NEW.tenant_id,'sale_invoiced_local',NEW.sale_date,'VE',
      'Facture ' || COALESCE(NEW.invoice_number, NEW.sale_number),'sales',NEW.id,_lines,'vente_locale');
  END IF;
  RETURN NEW;
END; $function$;