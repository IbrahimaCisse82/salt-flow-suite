ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_warehouse_id_fkey;
ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_warehouse_id_fkey;
ALTER TABLE public.sales ADD CONSTRAINT sales_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.inventory_items(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.inventory_items(id) ON DELETE SET NULL NOT VALID;