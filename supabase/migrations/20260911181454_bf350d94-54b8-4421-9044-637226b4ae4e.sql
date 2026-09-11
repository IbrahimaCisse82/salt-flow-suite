DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (
        p.proname LIKE 'trg_acc_%'
        OR p.proname IN ('post_accounting_entry','resolve_account','seed_chart_of_accounts','next_document_number','emit_domain_event','log_ledger_change','set_journal_entry_reference','set_payment_reference','set_po_order_number','set_sales_invoice_number','apply_po_item_reception','set_team_member_tenant')
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;