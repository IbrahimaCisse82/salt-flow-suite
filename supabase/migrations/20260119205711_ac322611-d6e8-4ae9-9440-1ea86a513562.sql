-- Ajout des index manquants pour les clés étrangères

-- admin_settings.updated_by
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_by ON public.admin_settings(updated_by);

-- global_announcements.created_by
CREATE INDEX IF NOT EXISTS idx_global_announcements_created_by ON public.global_announcements(created_by);

-- purchase_orders.approved_by et created_by
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approved_by ON public.purchase_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON public.purchase_orders(created_by);

-- quality_certificates.issued_by et quality_test_id
CREATE INDEX IF NOT EXISTS idx_quality_certificates_issued_by ON public.quality_certificates(issued_by);
CREATE INDEX IF NOT EXISTS idx_quality_certificates_quality_test_id ON public.quality_certificates(quality_test_id);

-- quality_tests.tested_by
CREATE INDEX IF NOT EXISTS idx_quality_tests_tested_by ON public.quality_tests(tested_by);

-- sales.transaction_id
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON public.sales(transaction_id);

-- scheduled_reports.created_by
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_created_by ON public.scheduled_reports(created_by);

-- support_ticket_replies.user_id
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_user_id ON public.support_ticket_replies(user_id);

-- support_tickets.assigned_to et created_by
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON public.support_tickets(created_by);