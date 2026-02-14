
-- Corriger les écritures d'achat à crédit existantes : remplacer 521 par 4011
-- Transaction 451b9c53 = PO à crédit de 420 000 FCFA
UPDATE journal_entries 
SET account_number = '4011', account_name = 'Fournisseurs locaux'
WHERE transaction_id = '451b9c53-7206-4a84-b0c5-42d77004655d'
AND account_number = '521';

-- Restaurer le solde bancaire qui a été débité à tort
UPDATE accounts 
SET balance = COALESCE(balance, 0) + 420000
WHERE account_number = '5211' 
AND tenant_id = 'b5302442-f6c6-493a-a19b-161cf3955acc';

-- Vérifier que le trigger de paiement fournisseur gère correctement le débit 4011 / crédit 521
-- (le trigger create_accounting_entry_on_purchase_payment devrait déjà le faire)
