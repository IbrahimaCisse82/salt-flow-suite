ALTER TABLE purchase_orders DROP CONSTRAINT purchase_orders_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check 
  CHECK (status = ANY (ARRAY['draft','pending_approval','approved','sent','confirmed','partially_received','partially_paid','paid','received','rejected','cancelled','modified']));