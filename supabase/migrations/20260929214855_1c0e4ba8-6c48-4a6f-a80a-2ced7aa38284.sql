CREATE OR REPLACE FUNCTION public.set_posting_mode(_mode text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _t uuid := get_user_tenant_id(auth.uid());
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['gerant','admin']::app_role[]) THEN RAISE EXCEPTION 'Seul le gérant peut changer le mode comptable'; END IF;
  IF _mode NOT IN ('shadow','live') THEN RAISE EXCEPTION 'Mode invalide'; END IF;
  INSERT INTO accounting_config (tenant_id, posting_mode) VALUES (_t, _mode)
    ON CONFLICT (tenant_id) DO UPDATE SET posting_mode = EXCLUDED.posting_mode;
  PERFORM emit_domain_event(_t, 'accounting.mode_changed', 'accounting_config', _t, jsonb_build_object('mode', _mode));
  RETURN _mode;
END $$;

CREATE OR REPLACE FUNCTION public.reject_shadow_entries(_ids uuid[], _reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _t uuid := get_user_tenant_id(auth.uid()); _id uuid; _n int := 0;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['gerant','comptable','admin']::app_role[]) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF coalesce(trim(_reason),'') = '' THEN RAISE EXCEPTION 'Le motif du rejet est obligatoire'; END IF;
  FOR _id IN UPDATE accounting_shadow_entries SET status='rejected', reviewed_by=auth.uid(), reviewed_at=now(), reject_reason=_reason
      WHERE tenant_id=_t AND status='pending' AND id = ANY(_ids) RETURNING id LOOP
    PERFORM emit_domain_event(_t, 'accounting.shadow_rejected', 'shadow_entry', _id, jsonb_build_object('reason', _reason));
    _n := _n + 1;
  END LOOP;
  RETURN jsonb_build_object('rejected', _n);
END $$;