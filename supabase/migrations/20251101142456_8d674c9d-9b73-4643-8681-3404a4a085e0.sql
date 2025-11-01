-- Correction des warnings de sécurité: Ajouter search_path aux fonctions

-- Fonction 1: calculate_next_run
CREATE OR REPLACE FUNCTION public.calculate_next_run(p_frequency text, p_schedule_time time without time zone, p_current_run timestamp with time zone DEFAULT now())
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      next_run := (date_trunc('day', p_current_run) + INTERVAL '1 day' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    WHEN 'weekly' THEN
      next_run := (date_trunc('week', p_current_run) + INTERVAL '1 week' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    WHEN 'monthly' THEN
      next_run := (date_trunc('month', p_current_run) + INTERVAL '1 month' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    WHEN 'quarterly' THEN
      next_run := (date_trunc('quarter', p_current_run) + INTERVAL '3 months' + p_schedule_time)::TIMESTAMP WITH TIME ZONE;
    ELSE
      next_run := p_current_run + INTERVAL '1 day';
  END CASE;
  
  -- Si la date calculée est dans le passé, ajouter une période supplémentaire
  IF next_run <= now() THEN
    next_run := public.calculate_next_run(p_frequency, p_schedule_time, next_run);
  END IF;
  
  RETURN next_run;
END;
$function$;

-- Fonction 2: set_next_run_at
CREATE OR REPLACE FUNCTION public.set_next_run_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.next_run_at IS NULL OR TG_OP = 'UPDATE' THEN
    NEW.next_run_at := public.calculate_next_run(
      NEW.frequency,
      NEW.schedule_time,
      COALESCE(NEW.last_run_at, NEW.start_date::TIMESTAMP WITH TIME ZONE)
    );
  END IF;
  RETURN NEW;
END;
$function$;