-- Rendre le plan comptable lisible par tous (read-only)
DROP POLICY IF EXISTS "tenant can select chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "anyone can select active chart of accounts"
ON public.chart_of_accounts
FOR SELECT
USING (is_active = true);

-- Conserver la gestion limitée au tenant pour mutations
DROP POLICY IF EXISTS "tenant can manage chart of accounts" ON public.chart_of_accounts;
CREATE POLICY "tenant can manage chart of accounts"
ON public.chart_of_accounts
FOR ALL
USING (tenant_id = public.current_tenant_id())
WITH CHECK (tenant_id = public.current_tenant_id());