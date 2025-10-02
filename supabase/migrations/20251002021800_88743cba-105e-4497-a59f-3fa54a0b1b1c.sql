-- Enable RLS on clients_safe view
ALTER VIEW public.clients_safe SET (security_invoker = on);

-- Add RLS policy to restrict access to same tenant only
CREATE POLICY "Users can view clients from their tenant only"
ON public.clients
FOR SELECT
USING (
  -- Allow managers/admins to see all fields in their tenant
  (is_manager_or_admin(auth.uid()) AND tenant_id = get_user_tenant_id(auth.uid()))
  OR
  -- Allow other users to see only non-PII fields in their tenant (handled by the view)
  (tenant_id = get_user_tenant_id(auth.uid()))
);