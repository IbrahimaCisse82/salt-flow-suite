
-- 1) Enum extensions
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'recette';
ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'salaire';

-- 2) sales: add missing columns used by app
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS sale_status public.sale_status,
  ADD COLUMN IF NOT EXISTS stock_updated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS warehouse_id uuid,
  ADD COLUMN IF NOT EXISTS tva_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tva_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_ht numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0;

-- Backfill sale_status from legacy status
UPDATE public.sales
   SET sale_status = COALESCE(sale_status, status::text::public.sale_status)
 WHERE sale_status IS NULL;

ALTER TABLE public.sales
  ALTER COLUMN sale_status SET DEFAULT 'draft'::public.sale_status,
  ALTER COLUMN sale_status SET NOT NULL;

-- Optional FK warehouses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_warehouse_id_fkey'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_warehouse_id_fkey
      FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_sale_status ON public.sales(sale_status);
CREATE INDEX IF NOT EXISTS idx_sales_warehouse_id ON public.sales(warehouse_id);

-- 3) transactions: campagne_id + is_validated
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS campagne_id uuid,
  ADD COLUMN IF NOT EXISTS is_validated boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_campagne_id_fkey'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_campagne_id_fkey
      FOREIGN KEY (campagne_id) REFERENCES public.campagnes(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_campagne_id ON public.transactions(campagne_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_validated ON public.transactions(is_validated);

-- Backfill is_validated from status
UPDATE public.transactions
   SET is_validated = (status = 'validated')
 WHERE is_validated = false AND status = 'validated';

-- 4) expense_types: account_id (alias of default_account_id) + account_number
ALTER TABLE public.expense_types
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS account_number text;

-- Backfill from existing default_account_id
UPDATE public.expense_types et
   SET account_id = COALESCE(et.account_id, et.default_account_id),
       account_number = COALESCE(et.account_number, coa.account_number)
  FROM public.chart_of_accounts coa
 WHERE coa.id = et.default_account_id;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expense_types_account_id_fkey'
  ) THEN
    ALTER TABLE public.expense_types
      ADD CONSTRAINT expense_types_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Trigger to keep account_id <-> default_account_id and account_number in sync
CREATE OR REPLACE FUNCTION public.sync_expense_type_account()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  -- prefer account_id, fallback to default_account_id
  IF NEW.account_id IS NULL AND NEW.default_account_id IS NOT NULL THEN
    NEW.account_id := NEW.default_account_id;
  ELSIF NEW.default_account_id IS NULL AND NEW.account_id IS NOT NULL THEN
    NEW.default_account_id := NEW.account_id;
  END IF;
  IF NEW.account_id IS NOT NULL THEN
    SELECT account_number INTO NEW.account_number
      FROM public.chart_of_accounts WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_sync_expense_type_account ON public.expense_types;
CREATE TRIGGER trg_sync_expense_type_account
  BEFORE INSERT OR UPDATE OF account_id, default_account_id ON public.expense_types
  FOR EACH ROW EXECUTE FUNCTION public.sync_expense_type_account();
