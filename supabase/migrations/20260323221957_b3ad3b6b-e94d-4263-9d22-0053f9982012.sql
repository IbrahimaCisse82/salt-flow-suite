
-- Fix remaining public-role write policies (batch 3)

-- leaves
DROP POLICY IF EXISTS "Managers can delete leaves" ON leaves;
CREATE POLICY "Managers can delete leaves" ON leaves FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Users can update leaves" ON leaves;
CREATE POLICY "Users can update leaves" ON leaves FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']) OR (employee_id = auth.uid() AND status = 'pending')))
WITH CHECK ((employee_id = auth.uid() AND status = 'cancelled') OR get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

-- payments
DROP POLICY IF EXISTS "Managers can insert payments" ON payments;
CREATE POLICY "Managers can insert payments" ON payments FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable','commercial']));

-- payroll_payments
DROP POLICY IF EXISTS "Accountants can create payments" ON payroll_payments;
CREATE POLICY "Accountants can create payments" ON payroll_payments FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

-- production_records
DROP POLICY IF EXISTS "Managers can delete production records" ON production_records;
CREATE POLICY "Managers can delete production records" ON production_records FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Production staff can create records" ON production_records;
CREATE POLICY "Production staff can create records" ON production_records FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

DROP POLICY IF EXISTS "Managers can manage production records" ON production_records;
CREATE POLICY "Managers can manage production records" ON production_records FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

-- profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- purchase_notifications
DROP POLICY IF EXISTS "Users can update their notifications" ON purchase_notifications;
CREATE POLICY "Users can update their notifications" ON purchase_notifications FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "System can insert notifications" ON purchase_notifications;
CREATE POLICY "System can insert notifications" ON purchase_notifications FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- purchase_order_items
DROP POLICY IF EXISTS "Managers can update purchase order items" ON purchase_order_items;
CREATE POLICY "Managers can update purchase order items" ON purchase_order_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.tenant_id = get_user_tenant_id(auth.uid())));

DROP POLICY IF EXISTS "Managers can delete purchase order items" ON purchase_order_items;
CREATE POLICY "Managers can delete purchase order items" ON purchase_order_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.tenant_id = get_user_tenant_id(auth.uid())));

-- purchase_orders
DROP POLICY IF EXISTS "Managers can create purchase orders" ON purchase_orders;
CREATE POLICY "Managers can create purchase orders" ON purchase_orders FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Managers can update purchase orders" ON purchase_orders;
CREATE POLICY "Managers can update purchase orders" ON purchase_orders FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Managers can delete purchase orders" ON purchase_orders;
CREATE POLICY "Managers can delete purchase orders" ON purchase_orders FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

-- purchase_payments
DROP POLICY IF EXISTS "Accountants can create purchase payments" ON purchase_payments;
CREATE POLICY "Accountants can create purchase payments" ON purchase_payments FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Accountants can update purchase payments" ON purchase_payments;
CREATE POLICY "Accountants can update purchase payments" ON purchase_payments FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

-- push_subscriptions
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- quality_certificates
DROP POLICY IF EXISTS "Managers can delete quality certificates" ON quality_certificates;
CREATE POLICY "Managers can delete quality certificates" ON quality_certificates FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can create quality certificates" ON quality_certificates;
CREATE POLICY "Managers can create quality certificates" ON quality_certificates FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

DROP POLICY IF EXISTS "Managers can update quality certificates" ON quality_certificates;
CREATE POLICY "Managers can update quality certificates" ON quality_certificates FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

-- quality_tests
DROP POLICY IF EXISTS "Production staff can create quality tests" ON quality_tests;
CREATE POLICY "Production staff can create quality tests" ON quality_tests FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

DROP POLICY IF EXISTS "Managers can delete quality tests" ON quality_tests;
CREATE POLICY "Managers can delete quality tests" ON quality_tests FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can update quality tests" ON quality_tests;
CREATE POLICY "Managers can update quality tests" ON quality_tests FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production']));

-- sales
DROP POLICY IF EXISTS "Managers can manage sales" ON sales;
CREATE POLICY "Managers can manage sales" ON sales FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','commercial']));

DROP POLICY IF EXISTS "Commercial can create sales" ON sales;
CREATE POLICY "Commercial can create sales" ON sales FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','commercial']));

DROP POLICY IF EXISTS "Managers can delete sales" ON sales;
CREATE POLICY "Managers can delete sales" ON sales FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

-- scheduled_reports
DROP POLICY IF EXISTS "Managers can delete scheduled reports" ON scheduled_reports;
CREATE POLICY "Managers can delete scheduled reports" ON scheduled_reports FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can create scheduled reports" ON scheduled_reports;
CREATE POLICY "Managers can create scheduled reports" ON scheduled_reports FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can update scheduled reports" ON scheduled_reports;
CREATE POLICY "Managers can update scheduled reports" ON scheduled_reports FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

-- stock_movements
DROP POLICY IF EXISTS "Staff can create stock movements" ON stock_movements;
CREATE POLICY "Staff can create stock movements" ON stock_movements FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','production','comptable']));

-- suppliers
DROP POLICY IF EXISTS "Managers can delete suppliers" ON suppliers;
CREATE POLICY "Managers can delete suppliers" ON suppliers FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can update suppliers" ON suppliers;
CREATE POLICY "Managers can update suppliers" ON suppliers FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Managers can create suppliers" ON suppliers;
CREATE POLICY "Managers can create suppliers" ON suppliers FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

-- support_ticket_replies
DROP POLICY IF EXISTS "Users can add replies" ON support_ticket_replies;
CREATE POLICY "Users can add replies" ON support_ticket_replies FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- tenants remaining write policies
DROP POLICY IF EXISTS "Managers can update their tenant" ON tenants;
CREATE POLICY "Managers can update their tenant" ON tenants FOR UPDATE TO authenticated
USING (id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));

DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;
CREATE POLICY "Admins can delete tenants" ON tenants FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- transactions remaining
DROP POLICY IF EXISTS "Accounting staff can create transactions" ON transactions;
CREATE POLICY "Accounting staff can create transactions" ON transactions FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Managers can manage transactions" ON transactions;
CREATE POLICY "Managers can manage transactions" ON transactions FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant','comptable']));

DROP POLICY IF EXISTS "Managers can delete transactions" ON transactions;
CREATE POLICY "Managers can delete transactions" ON transactions FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND get_user_role(auth.uid()) = ANY(ARRAY['admin','gerant']));
