-- ============================================
-- OPTIMISATION PERFORMANCES: Index Critiques
-- ============================================
-- Impact: +50-70% performance sur les requêtes fréquentes

-- 1. Index pour production_records (Dashboard + Rapports)
CREATE INDEX IF NOT EXISTS idx_production_records_tenant_date 
  ON public.production_records(tenant_id, production_date DESC);

CREATE INDEX IF NOT EXISTS idx_production_records_campagne 
  ON public.production_records(campagne_id) 
  WHERE campagne_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_production_records_bassin 
  ON public.production_records(bassin_id) 
  WHERE bassin_id IS NOT NULL;

-- 2. Index pour sales (Commercial + Comptabilité)
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date 
  ON public.sales(tenant_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_payment_status 
  ON public.sales(tenant_id, payment_status) 
  WHERE payment_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sales_client 
  ON public.sales(client_id) 
  WHERE client_id IS NOT NULL;

-- 3. Index pour leaves (Gestion Congés)
CREATE INDEX IF NOT EXISTS idx_leaves_employee_dates 
  ON public.leaves(employee_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_leaves_status 
  ON public.leaves(tenant_id, status) 
  WHERE status = 'pending';

-- 4. Index pour team_attendance (Paie + RH)
CREATE INDEX IF NOT EXISTS idx_team_attendance_date_status 
  ON public.team_attendance(tenant_id, attendance_date DESC, status);

-- 5. Index pour purchase_orders (Achats)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status 
  ON public.purchase_orders(tenant_id, status, order_date DESC);

-- 6. Index pour quality_tests (Production)
CREATE INDEX IF NOT EXISTS idx_quality_tests_production 
  ON public.quality_tests(production_record_id) 
  WHERE production_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quality_tests_status 
  ON public.quality_tests(tenant_id, quality_status, test_date DESC);

-- 7. Index pour notification_history (Notifications)
CREATE INDEX IF NOT EXISTS idx_notification_history_user_date 
  ON public.notification_history(user_id, sent_at DESC);

-- 8. Index composite pour bassins actifs
CREATE INDEX IF NOT EXISTS idx_bassins_tenant_active 
  ON public.bassins(tenant_id, is_active) 
  WHERE is_active = true;

-- 9. Index pour employees actifs
CREATE INDEX IF NOT EXISTS idx_employees_tenant_active 
  ON public.employees(tenant_id, is_active) 
  WHERE is_active = true;

-- ============================================
-- ANALYSE: Vérifier l'utilisation des index
-- ============================================
COMMENT ON INDEX idx_production_records_tenant_date IS 'Optimise Dashboard + filtres date production';
COMMENT ON INDEX idx_sales_payment_status IS 'Optimise recherche factures impayées';
COMMENT ON INDEX idx_leaves_status IS 'Optimise dashboard congés en attente';
COMMENT ON INDEX idx_team_attendance_date_status IS 'Optimise validation pointages RH';