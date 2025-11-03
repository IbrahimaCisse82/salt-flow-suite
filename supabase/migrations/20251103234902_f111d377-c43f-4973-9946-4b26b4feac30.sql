-- Fix RLS Performance Issues: Optimize auth.uid() calls
-- This migration wraps auth.uid() and auth function calls with (select ...) 
-- to prevent re-evaluation for each row, significantly improving query performance

-- ========================================
-- SCHEDULED_REPORTS
-- ========================================
DROP POLICY IF EXISTS "Users can view scheduled reports from their tenant" ON public.scheduled_reports;
DROP POLICY IF EXISTS "Managers can create scheduled reports" ON public.scheduled_reports;
DROP POLICY IF EXISTS "Managers can update scheduled reports" ON public.scheduled_reports;
DROP POLICY IF EXISTS "Managers can delete scheduled reports" ON public.scheduled_reports;

CREATE POLICY "Users can view scheduled reports from their tenant" ON public.scheduled_reports
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Managers can create scheduled reports" ON public.scheduled_reports
FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can update scheduled reports" ON public.scheduled_reports
FOR UPDATE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can delete scheduled reports" ON public.scheduled_reports
FOR DELETE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- ========================================
-- QUALITY_TESTS
-- ========================================
DROP POLICY IF EXISTS "Users can view quality tests" ON public.quality_tests;
DROP POLICY IF EXISTS "Production staff can create quality tests" ON public.quality_tests;
DROP POLICY IF EXISTS "Managers can update quality tests" ON public.quality_tests;
DROP POLICY IF EXISTS "Managers can delete quality tests" ON public.quality_tests;

CREATE POLICY "Users can view quality tests" ON public.quality_tests
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Production staff can create quality tests" ON public.quality_tests
FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text])
);

CREATE POLICY "Managers can update quality tests" ON public.quality_tests
FOR UPDATE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can delete quality tests" ON public.quality_tests
FOR DELETE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- ========================================
-- QUALITY_CERTIFICATES
-- ========================================
DROP POLICY IF EXISTS "Users can view quality certificates" ON public.quality_certificates;
DROP POLICY IF EXISTS "Managers can create quality certificates" ON public.quality_certificates;
DROP POLICY IF EXISTS "Managers can update quality certificates" ON public.quality_certificates;
DROP POLICY IF EXISTS "Managers can delete quality certificates" ON public.quality_certificates;

CREATE POLICY "Users can view quality certificates" ON public.quality_certificates
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Managers can create quality certificates" ON public.quality_certificates
FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can update quality certificates" ON public.quality_certificates
FOR UPDATE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

CREATE POLICY "Managers can delete quality certificates" ON public.quality_certificates
FOR DELETE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- ========================================
-- SUPPLIERS
-- ========================================
DROP POLICY IF EXISTS "Users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Managers can create suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Managers can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Managers can delete suppliers" ON public.suppliers;

CREATE POLICY "Users can view suppliers" ON public.suppliers
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Managers can create suppliers" ON public.suppliers
FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Managers can update suppliers" ON public.suppliers
FOR UPDATE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Managers can delete suppliers" ON public.suppliers
FOR DELETE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- ========================================
-- PURCHASE_ORDERS
-- ========================================
DROP POLICY IF EXISTS "Users can view purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Managers can create purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Managers can update purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Managers can delete purchase orders" ON public.purchase_orders;

CREATE POLICY "Users can view purchase orders" ON public.purchase_orders
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Managers can create purchase orders" ON public.purchase_orders
FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Managers can update purchase orders" ON public.purchase_orders
FOR UPDATE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

CREATE POLICY "Managers can delete purchase orders" ON public.purchase_orders
FOR DELETE USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- ========================================
-- PURCHASE_ORDER_ITEMS
-- ========================================
DROP POLICY IF EXISTS "Users can view purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Managers can create purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Managers can update purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Managers can delete purchase order items" ON public.purchase_order_items;

CREATE POLICY "Users can view purchase order items" ON public.purchase_order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM purchase_orders 
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
    AND purchase_orders.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
);

CREATE POLICY "Managers can create purchase order items" ON public.purchase_order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM purchase_orders 
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
    AND purchase_orders.tenant_id = get_user_tenant_id((SELECT auth.uid()))
    AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
  )
);

CREATE POLICY "Managers can update purchase order items" ON public.purchase_order_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM purchase_orders 
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
    AND purchase_orders.tenant_id = get_user_tenant_id((SELECT auth.uid()))
    AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
  )
);

CREATE POLICY "Managers can delete purchase order items" ON public.purchase_order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM purchase_orders 
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
    AND purchase_orders.tenant_id = get_user_tenant_id((SELECT auth.uid()))
    AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
  )
);

-- ========================================
-- INVENTORY_ITEMS
-- ========================================
DROP POLICY IF EXISTS "Users can view inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Managers can manage inventory items" ON public.inventory_items;

CREATE POLICY "Users can view inventory items" ON public.inventory_items
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Managers can manage inventory items" ON public.inventory_items
FOR ALL USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text, 'production'::text])
)
WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text, 'production'::text])
);

-- ========================================
-- PRODUCTION_RECORDS
-- ========================================
DROP POLICY IF EXISTS "Production staff can view records" ON public.production_records;

CREATE POLICY "Production staff can view records" ON public.production_records
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'production'::text]) 
  AND deleted_at IS NULL
);

-- ========================================
-- SALES
-- ========================================
DROP POLICY IF EXISTS "Authorized roles can view sales" ON public.sales;

CREATE POLICY "Authorized roles can view sales" ON public.sales
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'commercial'::text, 'comptable'::text])
);

-- ========================================
-- BASSINS
-- ========================================
DROP POLICY IF EXISTS "Tenant users can view bassins" ON public.bassins;

CREATE POLICY "Tenant users can view bassins" ON public.bassins
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND deleted_at IS NULL
);

-- ========================================
-- EMPLOYEES
-- ========================================
DROP POLICY IF EXISTS "Only managers can view and manage employees" ON public.employees;

CREATE POLICY "Only managers can view and manage employees" ON public.employees
FOR ALL USING (
  get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]) 
  AND tenant_id = get_user_tenant_id((SELECT auth.uid())) 
  AND deleted_at IS NULL
)
WITH CHECK (
  get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text]) 
  AND tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

-- ========================================
-- ADMIN_SETTINGS
-- ========================================
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.admin_settings;

CREATE POLICY "Only admins can manage settings" ON public.admin_settings
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ========================================
-- TENANT_QUOTAS
-- ========================================
DROP POLICY IF EXISTS "Admins can manage quotas" ON public.tenant_quotas;
DROP POLICY IF EXISTS "Tenants can view their quotas" ON public.tenant_quotas;

CREATE POLICY "Admins can manage quotas" ON public.tenant_quotas
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "Tenants can view their quotas" ON public.tenant_quotas
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

-- ========================================
-- SUPPORT_TICKETS
-- ========================================
DROP POLICY IF EXISTS "Users can view their tenant tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;

CREATE POLICY "Users can view their tenant tickets" ON public.support_tickets
FOR SELECT USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Users can create tickets" ON public.support_tickets
FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ========================================
-- SUPPORT_TICKET_REPLIES
-- ========================================
DROP POLICY IF EXISTS "Users can view ticket replies" ON public.support_ticket_replies;
DROP POLICY IF EXISTS "Users can add replies" ON public.support_ticket_replies;

CREATE POLICY "Users can view ticket replies" ON public.support_ticket_replies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = support_ticket_replies.ticket_id 
    AND support_tickets.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
);

CREATE POLICY "Users can add replies" ON public.support_ticket_replies
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id = support_ticket_replies.ticket_id 
    AND support_tickets.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
);

-- ========================================
-- SYSTEM_HEALTH_LOGS
-- ========================================
DROP POLICY IF EXISTS "Only admins can view health logs" ON public.system_health_logs;

CREATE POLICY "Only admins can view health logs" ON public.system_health_logs
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ========================================
-- EMAIL_TEMPLATES
-- ========================================
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

CREATE POLICY "Admins can manage email templates" ON public.email_templates
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ========================================
-- ADMIN_ACTIVITY_LOGS
-- ========================================
DROP POLICY IF EXISTS "Only admins can view activity logs" ON public.admin_activity_logs;

CREATE POLICY "Only admins can view activity logs" ON public.admin_activity_logs
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ========================================
-- PERFORMANCE_METRICS
-- ========================================
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.performance_metrics;

CREATE POLICY "Admins can view all metrics" ON public.performance_metrics
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ========================================
-- GLOBAL_ANNOUNCEMENTS - Consolidate Multiple Policies
-- ========================================
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.global_announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON public.global_announcements;

-- Consolidated policy: admins can do everything, users can view active announcements
CREATE POLICY "Admins can manage announcements" ON public.global_announcements
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "Users can view active announcements" ON public.global_announcements
FOR SELECT USING (
  is_active = true 
  AND starts_at <= now() 
  AND (ends_at IS NULL OR ends_at > now())
);