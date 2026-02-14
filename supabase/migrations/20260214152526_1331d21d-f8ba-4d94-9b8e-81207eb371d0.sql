
-- Insérer les comptes SYSCOHADA opérationnels manquants pour tous les tenants qui ont des transactions
-- mais pas les comptes correspondants dans chart_of_accounts
INSERT INTO public.chart_of_accounts (tenant_id, account_number, account_name, account_type, is_active)
SELECT DISTINCT t.tenant_id, je.account_number, je.account_name, 
  CASE 
    WHEN je.account_number LIKE '1%' THEN 'capitaux'
    WHEN je.account_number LIKE '2%' THEN 'immobilisations'
    WHEN je.account_number LIKE '3%' THEN 'stocks'
    WHEN je.account_number LIKE '4%' THEN 'tiers'
    WHEN je.account_number LIKE '5%' THEN 'tresorerie'
    WHEN je.account_number LIKE '6%' THEN 'charges'
    WHEN je.account_number LIKE '7%' THEN 'produits'
    WHEN je.account_number LIKE '8%' THEN 'comptes_speciaux'
    ELSE 'autre'
  END,
  true
FROM journal_entries je
JOIN transactions t ON je.transaction_id = t.id
WHERE je.account_number IS NOT NULL
  AND je.account_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM chart_of_accounts coa 
    WHERE coa.tenant_id = t.tenant_id 
    AND coa.account_number = je.account_number
  )
GROUP BY t.tenant_id, je.account_number, je.account_name;
