
CREATE TABLE IF NOT EXISTS public.document_sequences (
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  year INT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, doc_type, year)
);

GRANT SELECT ON public.document_sequences TO authenticated;
GRANT ALL ON public.document_sequences TO service_role;

ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_sequences" ON public.document_sequences
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.next_document_number(p_doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant UUID; _year INT; _next INT; _prefix TEXT;
BEGIN
  _tenant := public.get_user_tenant_id(auth.uid());
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant introuvable' USING ERRCODE = '42501';
  END IF;
  _prefix := CASE p_doc_type
    WHEN 'invoice'         THEN 'FAC'
    WHEN 'purchase_order'  THEN 'BC'
    WHEN 'journal_entry'   THEN 'JRN'
    WHEN 'payment'         THEN 'PMT'
    WHEN 'delivery_note'   THEN 'BL'
    ELSE 'DOC'
  END;
  _year := EXTRACT(YEAR FROM CURRENT_DATE);
  INSERT INTO public.document_sequences (tenant_id, doc_type, year, last_number)
  VALUES (_tenant, p_doc_type, _year, 1)
  ON CONFLICT (tenant_id, doc_type, year) DO UPDATE
    SET last_number = public.document_sequences.last_number + 1,
        updated_at = now()
  RETURNING last_number INTO _next;
  RETURN _prefix || '-' || _year::TEXT || '-' || LPAD(_next::TEXT, 5, '0');
END $$;

REVOKE ALL ON FUNCTION public.next_document_number(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_document_number(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_sales_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.next_document_number('invoice');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_po_order_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.next_document_number('purchase_order');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_journal_entry_reference()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.next_document_number('journal_entry');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_payment_reference()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.next_document_number('payment');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_invoice_number ON public.sales;
CREATE TRIGGER trg_set_invoice_number BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_sales_invoice_number();

DROP TRIGGER IF EXISTS trg_set_order_number ON public.purchase_orders;
CREATE TRIGGER trg_set_order_number BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_po_order_number();

DROP TRIGGER IF EXISTS trg_set_je_reference ON public.journal_entries;
CREATE TRIGGER trg_set_je_reference BEFORE INSERT ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_journal_entry_reference();

DROP TRIGGER IF EXISTS trg_set_payment_reference ON public.payments;
CREATE TRIGGER trg_set_payment_reference BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_reference();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date        ON public.sales (tenant_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date ON public.transactions (tenant_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_je_tenant_date           ON public.journal_entries (tenant_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_tenant_date_status    ON public.purchase_orders (tenant_id, order_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_stock_mov_tenant_date    ON public.stock_movements (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date     ON public.payments (tenant_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date   ON public.team_attendance (tenant_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_prod_tenant_date         ON public.production_records (tenant_id, production_date DESC);
