-- Backfill missing account_id links for global (and tenant) expense types based on account_number
-- This fixes user-side "Non lié" when the expense type has an account_number but no FK.

UPDATE public.expense_types et
SET account_id = coa.id,
    updated_at = now()
FROM public.chart_of_accounts coa
WHERE et.account_id IS NULL
  AND et.account_number IS NOT NULL
  AND coa.account_number = et.account_number
  AND (coa.tenant_id = et.tenant_id OR coa.tenant_id = '00000000-0000-0000-0000-000000000001');

-- Optional safety: ensure account_number is consistent with the linked account
UPDATE public.expense_types et
SET account_number = coa.account_number,
    updated_at = now()
FROM public.chart_of_accounts coa
WHERE et.account_id = coa.id
  AND (et.account_number IS DISTINCT FROM coa.account_number);
