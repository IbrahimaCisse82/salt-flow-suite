
-- Vidage de toutes les données de test avant livraison
-- Conserve uniquement la structure et les utilisateurs/tenants

-- Supprimer les données dans l'ordre des dépendances (foreign keys)

-- 1. Pointages et paiements RH
DELETE FROM payroll_payments;
DELETE FROM team_attendance;

-- 2. Membres d'équipe et équipes
DELETE FROM team_members;
DELETE FROM teams;

-- 3. Ventes et paiements
DELETE FROM payments;
DELETE FROM sales;

-- 4. Production
DELETE FROM production_records;

-- 5. Comptabilité
DELETE FROM journal_entries;
DELETE FROM transactions;
DELETE FROM accountant_notifications;

-- 6. Types de dépenses
DELETE FROM expense_types;

-- 7. Plan comptable et comptes
DELETE FROM chart_of_accounts;
DELETE FROM accounts;

-- 8. Budgets de campagne
DELETE FROM campagne_phase_budgets;

-- 9. Campagnes
DELETE FROM campagnes;

-- 10. Bassins
DELETE FROM bassins;

-- 11. Clients
DELETE FROM clients;

-- 12. Travailleurs journaliers
DELETE FROM daily_workers;

-- 13. Employés
DELETE FROM employees;

-- Note: Les tables suivantes sont conservées car elles contiennent les données essentielles:
-- - tenants (entreprises)
-- - profiles (utilisateurs)
-- - user_roles (rôles des utilisateurs)
-- - security_audit_log (logs de sécurité)
