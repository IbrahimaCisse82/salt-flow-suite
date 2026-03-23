
-- ============================================================
-- HARDEN ALL WRITE POLICIES: Restrict from 'public' to 'authenticated'
-- This prevents any possibility of anonymous write access.
-- ============================================================

-- accountant_notifications
DROP POLICY IF EXISTS "Accountants can update notifications" ON accountant_notifications;
CREATE POLICY "Accountants can update notifications" ON accountant_notifications
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

-- bassins
DROP POLICY IF EXISTS "Managers and production can delete bassins" ON bassins;
CREATE POLICY "Managers and production can delete bassins" ON bassins
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

DROP POLICY IF EXISTS "Managers and production can insert bassins" ON bassins;
CREATE POLICY "Managers and production can insert bassins" ON bassins
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

DROP POLICY IF EXISTS "Managers and production can update bassins" ON bassins;
CREATE POLICY "Managers and production can update bassins" ON bassins
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

DROP POLICY IF EXISTS "Tenant users can view bassins" ON bassins;
CREATE POLICY "Tenant users can view bassins" ON bassins
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- campagnes
DROP POLICY IF EXISTS "Managers can delete campagnes" ON campagnes;
CREATE POLICY "Managers can delete campagnes" ON campagnes
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can insert campagnes" ON campagnes;
CREATE POLICY "Managers can insert campagnes" ON campagnes
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can update campagnes" ON campagnes;
CREATE POLICY "Managers can update campagnes" ON campagnes
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Tenant users can view campagnes" ON campagnes;
CREATE POLICY "Tenant users can view campagnes" ON campagnes
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- clients
DROP POLICY IF EXISTS "Managers can delete clients" ON clients;
CREATE POLICY "Managers can delete clients" ON clients
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Authorized roles can create clients" ON clients;
CREATE POLICY "Authorized roles can create clients" ON clients
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','commercial']));

DROP POLICY IF EXISTS "Managers can update clients" ON clients;
CREATE POLICY "Managers can update clients" ON clients
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Authorized roles can view clients" ON clients;
CREATE POLICY "Authorized roles can view clients" ON clients
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','commercial']));

-- cost_per_ton
DROP POLICY IF EXISTS "Managers can delete cost per ton" ON cost_per_ton;
CREATE POLICY "Managers can delete cost per ton" ON cost_per_ton
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can create cost per ton" ON cost_per_ton;
CREATE POLICY "Managers can create cost per ton" ON cost_per_ton
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Managers can update cost per ton" ON cost_per_ton;
CREATE POLICY "Managers can update cost per ton" ON cost_per_ton
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Users can view cost per ton" ON cost_per_ton;
CREATE POLICY "Users can view cost per ton" ON cost_per_ton
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- daily_workers
DROP POLICY IF EXISTS "Only managers can view and manage daily workers" ON daily_workers;
CREATE POLICY "Only managers can view and manage daily workers" ON daily_workers
FOR ALL TO authenticated
USING (get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']) AND tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']) AND tenant_id = get_user_tenant_id(auth.uid()));

-- email_templates
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates" ON email_templates
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- employees (DELETE/INSERT/UPDATE already use public)
DROP POLICY IF EXISTS "Managers can delete employees" ON employees;
CREATE POLICY "Managers can delete employees" ON employees
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'gerant'::app_role));

DROP POLICY IF EXISTS "Managers can insert employees" ON employees;
CREATE POLICY "Managers can insert employees" ON employees
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'gerant'::app_role));

DROP POLICY IF EXISTS "Managers can update employees" ON employees;
CREATE POLICY "Managers can update employees" ON employees
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'gerant'::app_role));

-- expense_types
DROP POLICY IF EXISTS "Managers can delete expense types" ON expense_types;
CREATE POLICY "Managers can delete expense types" ON expense_types
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can insert expense types" ON expense_types;
CREATE POLICY "Managers can insert expense types" ON expense_types
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can update expense types" ON expense_types;
CREATE POLICY "Managers can update expense types" ON expense_types
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_manager_or_admin(auth.uid()));

-- financial_reports
DROP POLICY IF EXISTS "Managers can create financial reports" ON financial_reports;
CREATE POLICY "Managers can create financial reports" ON financial_reports
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Managers can delete financial reports" ON financial_reports;
CREATE POLICY "Managers can delete financial reports" ON financial_reports
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can update financial reports" ON financial_reports;
CREATE POLICY "Managers can update financial reports" ON financial_reports
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

-- global_announcements
DROP POLICY IF EXISTS "Admins delete announcements" ON global_announcements;
CREATE POLICY "Admins delete announcements" ON global_announcements
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert announcements" ON global_announcements;
CREATE POLICY "Admins insert announcements" ON global_announcements
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update announcements" ON global_announcements;
CREATE POLICY "Admins update announcements" ON global_announcements
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- inventory_items
DROP POLICY IF EXISTS "Users can access inventory items" ON inventory_items;
CREATE POLICY "Users can access inventory items" ON inventory_items
FOR ALL TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable','production']));

-- inventory_valuation_layers
DROP POLICY IF EXISTS "Authorized roles can insert valuation layers" ON inventory_valuation_layers;
CREATE POLICY "Authorized roles can insert valuation layers" ON inventory_valuation_layers
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable','production']));

DROP POLICY IF EXISTS "Users can view valuation layers" ON inventory_valuation_layers;
CREATE POLICY "Users can view valuation layers" ON inventory_valuation_layers
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- inventory_valuation_snapshots
DROP POLICY IF EXISTS "System can insert valuation snapshots" ON inventory_valuation_snapshots;
CREATE POLICY "System can insert valuation snapshots" ON inventory_valuation_snapshots
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Users can view valuation snapshots" ON inventory_valuation_snapshots;
CREATE POLICY "Users can view valuation snapshots" ON inventory_valuation_snapshots
FOR SELECT TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- admin_settings (already has authenticated for some, fix public ones)
DROP POLICY IF EXISTS "Only admins can manage settings" ON admin_settings;
CREATE POLICY "Only admins can manage settings" ON admin_settings
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- admin_activity_logs SELECT
DROP POLICY IF EXISTS "Only admins can view activity logs" ON admin_activity_logs;
CREATE POLICY "Only admins can view activity logs" ON admin_activity_logs
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
