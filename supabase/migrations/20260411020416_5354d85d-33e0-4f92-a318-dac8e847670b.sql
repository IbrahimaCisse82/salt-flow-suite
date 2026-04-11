
-- FAILLE 1: Verrouiller user_roles côté client
CREATE POLICY "No client insert on user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No client update on user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "No client delete on user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (false);

-- FAILLE 2: Retirer user_roles du Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- FAILLE 3: Isolation storage company-logos par tenant
DROP POLICY IF EXISTS "Authenticated users can upload their company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company logo" ON storage.objects;

CREATE POLICY "Tenant-scoped upload company logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Tenant-scoped update company logo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Tenant-scoped delete company logo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
  )
);
