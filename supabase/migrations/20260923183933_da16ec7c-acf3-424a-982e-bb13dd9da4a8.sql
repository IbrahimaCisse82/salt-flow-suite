CREATE OR REPLACE FUNCTION public.next_document_number_for(p_tenant_id uuid, p_doc_type text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _year INT; _next INT; _prefix TEXT;
BEGIN
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant introuvable' USING ERRCODE = '42501';
  END IF;
  _prefix := CASE p_doc_type
    WHEN 'invoice' THEN 'FAC' WHEN 'purchase_order' THEN 'BC' WHEN 'journal_entry' THEN 'JRN'
    WHEN 'payment' THEN 'PMT' WHEN 'delivery_note' THEN 'BL' ELSE 'DOC' END;
  _year := EXTRACT(YEAR FROM CURRENT_DATE);
  INSERT INTO public.document_sequences (tenant_id, doc_type, year, last_number)
  VALUES (p_tenant_id, p_doc_type, _year, 1)
  ON CONFLICT (tenant_id, doc_type, year) DO UPDATE
    SET last_number = public.document_sequences.last_number + 1, updated_at = now()
  RETURNING last_number INTO _next;
  RETURN _prefix || '-' || _year::TEXT || '-' || LPAD(_next::TEXT, 5, '0');
END $function$;
REVOKE EXECUTE ON FUNCTION public.next_document_number_for(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_document_number_for(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.next_document_number(p_doc_type text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.next_document_number_for(public.get_user_tenant_id(auth.uid()), p_doc_type);
END $function$;

CREATE OR REPLACE FUNCTION public.set_journal_entry_reference()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.next_document_number_for(NEW.tenant_id, 'journal_entry');
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.set_payment_reference()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.next_document_number_for(NEW.tenant_id, 'payment');
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.set_po_order_number()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.next_document_number_for(NEW.tenant_id, 'purchase_order');
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.set_sales_invoice_number()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.next_document_number_for(NEW.tenant_id, 'invoice');
  END IF;
  RETURN NEW;
END $function$;