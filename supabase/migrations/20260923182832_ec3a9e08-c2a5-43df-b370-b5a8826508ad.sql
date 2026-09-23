ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
ALTER TABLE public.quality_certificates ADD CONSTRAINT quality_certificates_production_record_id_fkey FOREIGN KEY (production_record_id) REFERENCES public.production_records(id) ON DELETE SET NULL;
ALTER TABLE public.quality_certificates ADD CONSTRAINT quality_certificates_quality_test_id_fkey FOREIGN KEY (quality_test_id) REFERENCES public.quality_tests(id) ON DELETE SET NULL;
ALTER TABLE public.quality_certificates ADD CONSTRAINT quality_certificates_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
NOTIFY pgrst, 'reload schema';