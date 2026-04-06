CREATE POLICY "Authenticated users without tenant can create one"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_tenant_id(auth.uid()) IS NULL
);