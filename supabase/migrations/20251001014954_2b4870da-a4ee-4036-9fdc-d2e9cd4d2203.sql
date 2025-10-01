-- Fix update_account_balance function search_path
DROP FUNCTION IF EXISTS public.update_account_balance() CASCADE;

CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- For expenses, subtract from balance
    IF NEW.transaction_type = 'depense' THEN
      UPDATE accounts 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.account_id;
    -- For sales, add to balance
    ELSIF NEW.transaction_type IN ('vente_locale', 'vente_export') THEN
      UPDATE accounts 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Reverse the transaction
    IF OLD.transaction_type = 'depense' THEN
      UPDATE accounts 
      SET balance = balance + OLD.amount 
      WHERE id = OLD.account_id;
    ELSIF OLD.transaction_type IN ('vente_locale', 'vente_export') THEN
      UPDATE accounts 
      SET balance = balance - OLD.amount 
      WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Reverse old transaction
    IF OLD.transaction_type = 'depense' THEN
      UPDATE accounts 
      SET balance = balance + OLD.amount 
      WHERE id = OLD.account_id;
    ELSIF OLD.transaction_type IN ('vente_locale', 'vente_export') THEN
      UPDATE accounts 
      SET balance = balance - OLD.amount 
      WHERE id = OLD.account_id;
    END IF;
    -- Apply new transaction
    IF NEW.transaction_type = 'depense' THEN
      UPDATE accounts 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.account_id;
    ELSIF NEW.transaction_type IN ('vente_locale', 'vente_export') THEN
      UPDATE accounts 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance();