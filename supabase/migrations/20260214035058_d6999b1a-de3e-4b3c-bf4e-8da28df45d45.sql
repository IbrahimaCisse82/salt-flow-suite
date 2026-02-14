-- Drop old constraint and add updated one with all workflow statuses
ALTER TABLE public.purchase_orders DROP CONSTRAINT purchase_orders_status_check;

ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_status_check 
  CHECK (status = ANY (ARRAY[
    'draft', 
    'pending_approval', 
    'approved', 
    'sent', 
    'confirmed', 
    'partially_received', 
    'partially_paid',
    'received', 
    'rejected',
    'cancelled'
  ]));
