
-- ============================================================
-- FIX: Tenant isolation gaps in RLS policies
-- Tables where INSERT/UPDATE/DELETE don't check tenant_id
-- ============================================================

-- 1. ACCOUNTS: INSERT, UPDATE, DELETE missing tenant check
DROP POLICY IF EXISTS "Managers can insert accounts" ON public.accounts;
CREATE POLICY "Managers can insert accounts" ON public.accounts
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

DROP POLICY IF EXISTS "Managers can update accounts" ON public.accounts;
CREATE POLICY "Managers can update accounts" ON public.accounts
FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

DROP POLICY IF EXISTS "Managers can delete accounts" ON public.accounts;
CREATE POLICY "Managers can delete accounts" ON public.accounts
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id((SELECT auth.uid()))
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- 2. CAMPAGNE_PHASE_BUDGETS: INSERT, UPDATE, DELETE missing tenant check
DROP POLICY IF EXISTS "Managers can insert phase budgets" ON public.campagne_phase_budgets;
CREATE POLICY "Managers can insert phase budgets" ON public.campagne_phase_budgets
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campagnes 
    WHERE campagnes.id = campagne_phase_budgets.campagne_id 
    AND campagnes.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

DROP POLICY IF EXISTS "Managers can update phase budgets" ON public.campagne_phase_budgets;
CREATE POLICY "Managers can update phase budgets" ON public.campagne_phase_budgets
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campagnes 
    WHERE campagnes.id = campagne_phase_budgets.campagne_id 
    AND campagnes.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

DROP POLICY IF EXISTS "Managers can delete phase budgets" ON public.campagne_phase_budgets;
CREATE POLICY "Managers can delete phase budgets" ON public.campagne_phase_budgets
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campagnes 
    WHERE campagnes.id = campagne_phase_budgets.campagne_id 
    AND campagnes.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text])
);

-- 3. JOURNAL_ENTRIES: INSERT missing tenant check
DROP POLICY IF EXISTS "Users can create journal entries" ON public.journal_entries;
CREATE POLICY "Users can create journal entries" ON public.journal_entries
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = journal_entries.transaction_id 
    AND transactions.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
);

-- 4. PURCHASE_ORDER_HISTORY: INSERT missing tenant check
DROP POLICY IF EXISTS "Users can insert history" ON public.purchase_order_history;
CREATE POLICY "Users can insert history" ON public.purchase_order_history
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM purchase_orders po 
    WHERE po.id = purchase_order_history.purchase_order_id 
    AND po.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
);

-- 5. PURCHASE_ORDER_ITEMS: INSERT missing tenant check
DROP POLICY IF EXISTS "Managers can create purchase order items" ON public.purchase_order_items;
CREATE POLICY "Managers can create purchase order items" ON public.purchase_order_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM purchase_orders 
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
    AND purchase_orders.tenant_id = get_user_tenant_id((SELECT auth.uid()))
  )
  AND get_user_role((SELECT auth.uid())) = ANY (ARRAY['admin'::text, 'gerant'::text, 'comptable'::text])
);

-- 6. TEAM_MEMBERS: INSERT missing tenant check
DROP POLICY IF EXISTS "Managers can insert team members" ON public.team_members;
CREATE POLICY "Managers can insert team members" ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND t.tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = (SELECT auth.uid()))
  )
  AND has_role((SELECT auth.uid()), 'gerant'::app_role)
);
