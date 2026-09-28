ALTER TABLE public.accounting_config
  ADD COLUMN IF NOT EXISTS employee_social_rate numeric NOT NULL DEFAULT 0.056,
  ADD COLUMN IF NOT EXISTS employer_social_rate numeric NOT NULL DEFAULT 0.154,
  ADD COLUMN IF NOT EXISTS income_tax_rate numeric NOT NULL DEFAULT 0;

ALTER TABLE public.team_attendance
  ADD COLUMN IF NOT EXISTS social_employee_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS social_employer_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS income_tax_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.calc_attendance_amount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _e numeric := 0.056; _p numeric := 0.154; _t numeric := 0;
BEGIN
  NEW.calculated_amount := round(COALESCE(NEW.hours_worked,0) * COALESCE(NEW.daily_rate,0) / 8.0, 2);
  SELECT employee_social_rate, employer_social_rate, income_tax_rate INTO _e,_p,_t
    FROM public.accounting_config WHERE tenant_id = NEW.tenant_id;
  _e := COALESCE(_e,0.056); _p := COALESCE(_p,0.154); _t := COALESCE(_t,0);
  NEW.social_employee_amount := round(NEW.calculated_amount * _e, 2);
  NEW.social_employer_amount := round(NEW.calculated_amount * _p, 2);
  NEW.income_tax_amount := round(NEW.calculated_amount * _t, 2);
  NEW.net_amount := NEW.calculated_amount - NEW.social_employee_amount - NEW.income_tax_amount;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_acc_attendance_validated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lines JSONB; _g NUMERIC; _se NUMERIC; _sp NUMERIC; _tx NUMERIC; _net NUMERIC;
BEGIN
  IF NEW.status <> 'validated' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'validated' THEN RETURN NEW; END IF;
  _g := COALESCE(NEW.calculated_amount, 0);
  IF _g <= 0 THEN RETURN NEW; END IF;
  _se := COALESCE(NEW.social_employee_amount,0);
  _sp := COALESCE(NEW.social_employer_amount,0);
  _tx := COALESCE(NEW.income_tax_amount,0);
  _net := _g - _se - _tx;

  _lines := jsonb_build_array(
    jsonb_build_object('account','661','label','Rémunérations directes versées au personnel','debit',_g,'credit',0),
    jsonb_build_object('account','422','label','Personnel, rémunérations dues','debit',0,'credit',_net));
  IF _se > 0 THEN _lines := _lines || jsonb_build_object('account','431','label','Sécurité sociale — part salariale','debit',0,'credit',_se); END IF;
  IF _tx > 0 THEN _lines := _lines || jsonb_build_object('account','447','label','État, impôts retenus à la source','debit',0,'credit',_tx); END IF;
  IF _sp > 0 THEN
    _lines := _lines
      || jsonb_build_object('account','664','label','Charges sociales patronales','debit',_sp,'credit',0)
      || jsonb_build_object('account','431','label','Sécurité sociale — part patronale','debit',0,'credit',_sp);
  END IF;
  PERFORM public.post_accounting_entry(NEW.tenant_id,'payroll_accrual',NEW.attendance_date,'OD',
    'Charge de personnel (pointage validé)','team_attendance',NEW.id,_lines,'paie');
  RETURN NEW;
END; $$;

UPDATE public.team_attendance SET hours_worked = hours_worked WHERE status <> 'validated';

CREATE OR REPLACE FUNCTION public.post_inventory_variation(p_tenant_id uuid, p_fiscal_year_end date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _final numeric; _book numeric; _delta numeric; _lines jsonb; _tx uuid;
BEGIN
  PERFORM public.assert_accounting_access(p_tenant_id);
  SELECT COALESCE(SUM(COALESCE(quantity,0) * COALESCE(NULLIF(cmp,0), unit_cost, 0)),0) INTO _final
    FROM public.inventory_items
   WHERE tenant_id = p_tenant_id AND deleted_at IS NULL
     AND COALESCE(category,'') NOT IN ('warehouse','produit_fini','production','sel');
  SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) INTO _book
    FROM public.journal_entries
   WHERE tenant_id = p_tenant_id AND entry_date <= p_fiscal_year_end AND account_number LIKE '32%';
  _delta := round(_final - _book, 2);
  IF abs(_delta) < 0.01 THEN
    RETURN jsonb_build_object('posted', false, 'stock_final', _final, 'variation', 0);
  END IF;
  IF _delta > 0 THEN
    _lines := jsonb_build_array(
      jsonb_build_object('account','321','label','Stock matières premières','debit',_delta,'credit',0),
      jsonb_build_object('account','6032','label','Variation des stocks de matières premières','debit',0,'credit',_delta));
  ELSE
    _lines := jsonb_build_array(
      jsonb_build_object('account','6032','label','Variation des stocks de matières premières','debit',-_delta,'credit',0),
      jsonb_build_object('account','321','label','Stock matières premières','debit',0,'credit',-_delta));
  END IF;
  _tx := public.post_closing_entry(p_tenant_id, p_fiscal_year_end, 'OD',
    'Variation des stocks achetés (inventaire de fin d''exercice)', _lines, 'od');
  RETURN jsonb_build_object('posted', true, 'stock_final', _final, 'variation', _delta, 'transaction_id', _tx);
END; $$;

REVOKE EXECUTE ON FUNCTION public.post_inventory_variation(uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_inventory_variation(uuid,date) TO authenticated, service_role;