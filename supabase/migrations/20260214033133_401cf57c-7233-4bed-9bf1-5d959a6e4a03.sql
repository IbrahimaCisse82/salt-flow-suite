-- Allow managers/owners to save invoice style settings
CREATE POLICY "Managers can upsert invoice style settings"
ON public.admin_settings
FOR ALL
USING (setting_key LIKE 'invoice_style_%')
WITH CHECK (setting_key LIKE 'invoice_style_%');
