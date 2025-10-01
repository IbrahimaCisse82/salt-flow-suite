-- Create account types enum
CREATE TYPE account_type AS ENUM ('banque', 'caisse');

-- Create transaction types enum
CREATE TYPE transaction_type AS ENUM ('depense', 'vente_locale', 'vente_export');

-- Create accounts table (comptes bancaires et caisse)
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  account_type account_type NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  account_number TEXT,
  bank_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table (dépenses et ventes)
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  transaction_type transaction_type NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view accounts in their tenant"
ON public.accounts
FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can manage accounts in their tenant"
ON public.accounts
FOR ALL
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions in their tenant"
ON public.transactions
FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can manage transactions in their tenant"
ON public.transactions
FOR ALL
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

-- Create trigger for accounts updated_at
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to update account balance automatically
CREATE TRIGGER update_balance_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();