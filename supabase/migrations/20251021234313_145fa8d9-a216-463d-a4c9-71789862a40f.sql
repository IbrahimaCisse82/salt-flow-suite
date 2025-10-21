
-- Nettoyage complet des données pour le tenant 'DEMO SEL' (support@g-suiteapp.com)
-- tenant_id: 98f910f4-7414-4775-b9d7-1dbb28660fb1

DO $$
DECLARE
  target_tenant_id UUID := '98f910f4-7414-4775-b9d7-1dbb28660fb1';
BEGIN
  -- Supprimer les données liées aux transactions
  DELETE FROM public.journal_entries 
  WHERE transaction_id IN (
    SELECT id FROM public.transactions WHERE tenant_id = target_tenant_id
  );
  
  DELETE FROM public.transactions WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les données de paie
  DELETE FROM public.payroll_payments WHERE tenant_id = target_tenant_id;
  DELETE FROM public.team_attendance WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les membres et équipes
  DELETE FROM public.team_members 
  WHERE team_id IN (
    SELECT id FROM public.teams WHERE tenant_id = target_tenant_id
  );
  
  DELETE FROM public.teams WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les données de production
  DELETE FROM public.production_records WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les données commerciales
  DELETE FROM public.payments WHERE tenant_id = target_tenant_id;
  DELETE FROM public.sales WHERE tenant_id = target_tenant_id;
  DELETE FROM public.clients WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les budgets de campagne
  DELETE FROM public.campagne_phase_budgets 
  WHERE campagne_id IN (
    SELECT id FROM public.campagnes WHERE tenant_id = target_tenant_id
  );
  
  DELETE FROM public.campagnes WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les bassins
  DELETE FROM public.bassins WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les employés et travailleurs journaliers
  DELETE FROM public.employees WHERE tenant_id = target_tenant_id;
  DELETE FROM public.daily_workers WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les données comptables
  DELETE FROM public.expense_types WHERE tenant_id = target_tenant_id;
  DELETE FROM public.chart_of_accounts WHERE tenant_id = target_tenant_id;
  DELETE FROM public.accounts WHERE tenant_id = target_tenant_id;
  
  -- Supprimer les notifications comptables
  DELETE FROM public.accountant_notifications WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE 'Toutes les données du tenant % ont été supprimées avec succès', target_tenant_id;
END $$;
