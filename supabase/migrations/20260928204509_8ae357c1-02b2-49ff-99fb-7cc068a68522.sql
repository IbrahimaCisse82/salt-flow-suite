ALTER TABLE public.accounting_config ADD COLUMN IF NOT EXISTS daily_worker_withholding_rate numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.calc_attendance_amount()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _e numeric; _p numeric; _t numeric; _w numeric; _type text;
BEGIN
  NEW.calculated_amount := round(COALESCE(NEW.hours_worked,0) * COALESCE(NEW.daily_rate,0) / 8.0, 2);
  SELECT employee_social_rate, employer_social_rate, income_tax_rate, daily_worker_withholding_rate
    INTO _e,_p,_t,_w FROM public.accounting_config WHERE tenant_id = NEW.tenant_id;
  _e := COALESCE(_e,0.056); _p := COALESCE(_p,0.154); _t := COALESCE(_t,0); _w := COALESCE(_w,0);
  SELECT employee_type::text INTO _type FROM public.employees WHERE id = NEW.employee_id;
  IF _type = 'journalier' THEN
    -- Journaliers : exonérés de cotisations, retenue à la source uniquement
    _e := 0; _p := 0; _t := _w;
  END IF;
  NEW.social_employee_amount := round(NEW.calculated_amount * _e, 2);
  NEW.social_employer_amount := round(NEW.calculated_amount * _p, 2);
  NEW.income_tax_amount := round(NEW.calculated_amount * _t, 2);
  NEW.net_amount := NEW.calculated_amount - NEW.social_employee_amount - NEW.income_tax_amount;
  RETURN NEW;
END; $function$;