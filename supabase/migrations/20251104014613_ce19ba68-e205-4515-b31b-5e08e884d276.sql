-- Drop duplicate index on sales table
-- Keep idx_sales_batch and remove idx_sales_batch_number
DROP INDEX IF EXISTS public.idx_sales_batch_number;