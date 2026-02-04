-- Fix linter: ensure view uses invoker privileges
CREATE OR REPLACE VIEW public.accounting_ledger
WITH (security_invoker=on)
AS
SELECT je.id,
    je.transaction_id,
    t.transaction_date,
    t.transaction_type,
    je.account_number,
    je.account_name,
    je.debit,
    je.credit,
    je.description,
    t.reference,
    t.tenant_id,
    sum(je.debit - je.credit) OVER (PARTITION BY je.account_number, t.tenant_id ORDER BY t.transaction_date, je.id) AS running_balance
   FROM public.journal_entries je
     JOIN public.transactions t ON je.transaction_id = t.id
  ORDER BY t.transaction_date DESC, je.id;