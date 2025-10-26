-- Optimisation des politiques RLS pour améliorer les performances
-- Remplacement de auth.uid() par (select auth.uid()) pour éviter la réévaluation

-- ============================================
-- 1. TABLE push_subscriptions
-- ============================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;

-- Créer les nouvelles politiques optimisées
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING ((select auth.uid()) = user_id);

-- ============================================
-- 2. TABLE notification_history
-- ============================================

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notification_history;

CREATE POLICY "Users can view their notifications"
ON public.notification_history
FOR SELECT
USING (user_id = (select auth.uid()));

-- ============================================
-- 3. TABLE leaves - Fusion et optimisation des politiques
-- ============================================

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Employees can view their own leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can view all leaves" ON public.leaves;
DROP POLICY IF EXISTS "Employees can create leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Employees can cancel pending leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can process leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can delete leaves" ON public.leaves;

-- Créer une seule politique optimisée pour SELECT
CREATE POLICY "Users can view leaves"
ON public.leaves
FOR SELECT
USING (
  tenant_id = get_user_tenant_id((select auth.uid()))
  AND (
    -- Managers et admins voient tout
    get_user_role((select auth.uid())) = ANY(ARRAY['admin', 'gerant'])
    OR
    -- Employés voient leurs propres congés
    employee_id = (select auth.uid())
  )
);

-- INSERT : Tout employé peut créer une demande
CREATE POLICY "Employees can create leave requests"
ON public.leaves
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id((select auth.uid())));

-- UPDATE : Fusion des deux politiques (annulation + traitement)
CREATE POLICY "Users can update leaves"
ON public.leaves
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id((select auth.uid()))
  AND (
    -- Managers peuvent traiter les demandes
    get_user_role((select auth.uid())) = ANY(ARRAY['admin', 'gerant'])
    OR
    -- Employés peuvent annuler leurs demandes en attente
    (employee_id = (select auth.uid()) AND status = 'pending')
  )
)
WITH CHECK (
  -- Employés peuvent seulement passer à 'cancelled'
  (employee_id = (select auth.uid()) AND status = 'cancelled')
  OR
  -- Managers peuvent tout modifier
  get_user_role((select auth.uid())) = ANY(ARRAY['admin', 'gerant'])
);

-- DELETE : Seuls les managers
CREATE POLICY "Managers can delete leaves"
ON public.leaves
FOR DELETE
USING (
  tenant_id = get_user_tenant_id((select auth.uid()))
  AND get_user_role((select auth.uid())) = ANY(ARRAY['admin', 'gerant'])
);