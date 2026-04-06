ALTER TABLE public.quality_tests
ADD CONSTRAINT quality_tests_tested_by_fkey
FOREIGN KEY (tested_by) REFERENCES public.profiles(id);