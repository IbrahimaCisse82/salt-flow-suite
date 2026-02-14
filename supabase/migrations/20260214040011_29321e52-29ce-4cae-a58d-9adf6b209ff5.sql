-- Add received_quantity to track partial receptions
ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS received_quantity numeric DEFAULT 0;

-- Update existing received items to set received_quantity = quantity
UPDATE public.purchase_order_items 
SET received_quantity = quantity 
WHERE is_received = true AND received_quantity = 0;