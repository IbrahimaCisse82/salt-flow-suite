-- Fix security issue: Set search_path for calculate_attendance_amount function
CREATE OR REPLACE FUNCTION calculate_attendance_amount()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.calculated_amount := NEW.hours_worked * NEW.daily_rate;
  RETURN NEW;
END;
$$;