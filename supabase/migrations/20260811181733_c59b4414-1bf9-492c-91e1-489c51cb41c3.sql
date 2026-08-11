CREATE OR REPLACE FUNCTION public.process_stock_movement(
  p_item_id uuid,
  p_quantity numeric,
  p_movement_type text,
  p_unit_cost numeric DEFAULT 0,
  p_warehouse_from uuid DEFAULT NULL,
  p_warehouse_to uuid DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.inventory_items%ROWTYPE;
  v_tenant uuid;
  v_prev numeric;
  v_new numeric;
  v_available numeric;
  v_new_cmp numeric;
  v_movement_id uuid;
BEGIN
  IF p_movement_type NOT IN ('entry','exit','adjustment','transfer') THEN
    RAISE EXCEPTION 'Type de mouvement invalide: %', p_movement_type;
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'La quantité doit être strictement positive';
  END IF;

  v_tenant := public.get_user_tenant_id(auth.uid());
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Utilisateur sans organisation';
  END IF;

  -- Verrou de ligne pour éviter les conditions de concurrence
  SELECT * INTO v_item
  FROM public.inventory_items
  WHERE id = p_item_id AND tenant_id = v_tenant
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article introuvable';
  END IF;

  v_prev := COALESCE(v_item.quantity, 0);
  v_new_cmp := COALESCE(v_item.cmp, v_item.unit_cost, 0);

  IF p_movement_type = 'entry' THEN
    v_new := v_prev + p_quantity;
    IF v_new > 0 THEN
      v_new_cmp := ROUND(((v_prev * v_new_cmp) + (p_quantity * COALESCE(p_unit_cost, 0))) / v_new, 6);
    END IF;
  ELSIF p_movement_type = 'exit' THEN
    v_available := v_prev - COALESCE(v_item.reserved_quantity, 0);
    IF p_quantity > v_available THEN
      RAISE EXCEPTION 'Stock disponible insuffisant (disponible: %, demandé: %)', v_available, p_quantity;
    END IF;
    v_new := v_prev - p_quantity;
  ELSIF p_movement_type = 'adjustment' THEN
    v_new := p_quantity;
  ELSE -- transfer
    v_new := v_prev;
  END IF;

  UPDATE public.inventory_items
  SET quantity = v_new,
      quantity_on_hand = v_new,
      cmp = v_new_cmp,
      unit_cost = CASE WHEN p_movement_type = 'entry' THEN v_new_cmp ELSE unit_cost END,
      updated_at = now()
  WHERE id = p_item_id;

  INSERT INTO public.stock_movements (
    tenant_id, inventory_item_id, item_name, movement_type, quantity,
    previous_quantity, new_quantity, unit_cost, unit_of_measure,
    warehouse_from, warehouse_to, reference_type, reference_id, notes, created_by
  ) VALUES (
    v_tenant, p_item_id, COALESCE(v_item.item_name, v_item.name), p_movement_type::stock_movement_type, p_quantity,
    v_prev, v_new, COALESCE(p_unit_cost, v_new_cmp), v_item.unit_of_measure,
    p_warehouse_from, p_warehouse_to, p_reference_type, p_reference_id, p_notes, auth.uid()
  ) RETURNING id INTO v_movement_id;

  IF p_movement_type = 'entry' THEN
    INSERT INTO public.inventory_valuation_layers (
      tenant_id, inventory_item_id, movement_type, source_type, reference_id,
      quantity, remaining_quantity, unit_cost, total_cost, total_value, layer_date, notes
    ) VALUES (
      v_tenant, p_item_id, 'entry', p_reference_type, p_reference_id,
      p_quantity, p_quantity, COALESCE(p_unit_cost, 0), ROUND(p_quantity * COALESCE(p_unit_cost, 0), 2),
      ROUND(p_quantity * COALESCE(p_unit_cost, 0), 2), CURRENT_DATE, p_notes
    );
  END IF;

  PERFORM public.emit_domain_event(
    v_tenant,
    'stock.movement.processed',
    'inventory_item',
    p_item_id,
    jsonb_build_object(
      'movement_id', v_movement_id,
      'movement_type', p_movement_type,
      'quantity', p_quantity,
      'previous_quantity', v_prev,
      'new_quantity', v_new,
      'cmp', v_new_cmp
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'previous_quantity', v_prev,
    'new_quantity', v_new,
    'cmp', v_new_cmp
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_stock_movement(uuid, numeric, text, numeric, uuid, uuid, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_stock_movement(uuid, numeric, text, numeric, uuid, uuid, text, uuid, text) TO authenticated;