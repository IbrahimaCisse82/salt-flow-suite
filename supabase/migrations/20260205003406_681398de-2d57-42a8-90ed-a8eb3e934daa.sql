-- =====================================================
-- WORKFLOW ACHATS COMPLET
-- =====================================================

-- 1. Créer un enum pour les statuts de commande
DO $$ BEGIN
  CREATE TYPE purchase_order_status AS ENUM (
    'draft',              -- Brouillon
    'pending_approval',   -- En attente d'approbation
    'approved',           -- Approuvée
    'rejected',           -- Rejetée
    'partially_paid',     -- Partiellement payée
    'paid',               -- Payée
    'partially_received', -- Partiellement reçue
    'received',           -- Reçue
    'modified',           -- Modifiée (en attente de revalidation)
    'cancelled'           -- Annulée
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Ajouter les nouvelles colonnes à purchase_orders
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS total_paid numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_reapproval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS previous_total numeric,
ADD COLUMN IF NOT EXISTS modification_reason text,
ADD COLUMN IF NOT EXISTS received_at timestamptz,
ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES public.profiles(id);

-- 3. Ajouter les colonnes de réception aux articles
ALTER TABLE public.purchase_order_items
ADD COLUMN IF NOT EXISTS is_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS received_at timestamptz,
ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS received_notes text;

-- 4. Créer la table des notifications d'achat
CREATE TABLE IF NOT EXISTS public.purchase_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'approval_request',      -- Demande d'approbation au gérant
    'advance_request',       -- Demande d'avance au comptable
    'payment_recorded',      -- Paiement enregistré
    'order_approved',        -- Commande approuvée
    'order_rejected',        -- Commande rejetée
    'order_received',        -- Commande reçue
    'order_modified',        -- Commande modifiée, revalidation nécessaire
    'refund_required',       -- Retour d'argent à enregistrer
    'additional_payment'     -- Paiement supplémentaire requis
  )),
  target_role text NOT NULL CHECK (target_role IN ('gerant', 'comptable', 'initiator')),
  target_user_id uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  message text,
  amount numeric,
  is_read boolean DEFAULT false,
  is_actioned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  actioned_at timestamptz,
  actioned_by uuid REFERENCES public.profiles(id)
);

-- 5. Créer la table d'historique des actions sur commandes
CREATE TABLE IF NOT EXISTS public.purchase_order_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_by uuid NOT NULL REFERENCES public.profiles(id),
  action_at timestamptz DEFAULT now(),
  previous_status text,
  new_status text,
  previous_amount numeric,
  new_amount numeric,
  notes text,
  metadata jsonb DEFAULT '{}'
);

-- 6. Créer la table des paiements d'achat
CREATE TABLE IF NOT EXISTS public.purchase_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('advance', 'payment', 'refund')),
  amount numeric NOT NULL,
  payment_method text DEFAULT 'especes',
  payment_date date NOT NULL,
  account_id uuid REFERENCES public.accounts(id),
  processed_by uuid REFERENCES public.profiles(id),
  notes text,
  transaction_id uuid REFERENCES public.transactions(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Activer RLS sur les nouvelles tables
ALTER TABLE public.purchase_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS pour purchase_notifications
CREATE POLICY "Users can view their notifications" ON public.purchase_notifications
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND (
      target_user_id = auth.uid() OR
      (target_role = 'gerant' AND get_user_role(auth.uid()) IN ('admin', 'gerant')) OR
      (target_role = 'comptable' AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')) OR
      (target_role = 'initiator' AND EXISTS (
        SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_id AND po.created_by = auth.uid()
      ))
    )
  );

CREATE POLICY "System can insert notifications" ON public.purchase_notifications
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update their notifications" ON public.purchase_notifications
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND (
      target_user_id = auth.uid() OR
      (target_role = 'gerant' AND get_user_role(auth.uid()) IN ('admin', 'gerant')) OR
      (target_role = 'comptable' AND get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable'))
    )
  );

-- 9. Politiques RLS pour purchase_order_history
CREATE POLICY "Users can view history" ON public.purchase_order_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po 
      WHERE po.id = purchase_order_id 
      AND po.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

CREATE POLICY "Users can insert history" ON public.purchase_order_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders po 
      WHERE po.id = purchase_order_id 
      AND po.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- 10. Politiques RLS pour purchase_payments
CREATE POLICY "Users can view purchase payments" ON public.purchase_payments
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Accountants can create purchase payments" ON public.purchase_payments
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) AND
    get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  );

CREATE POLICY "Accountants can update purchase payments" ON public.purchase_payments
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND
    get_user_role(auth.uid()) IN ('admin', 'gerant', 'comptable')
  );

-- 11. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_purchase_notifications_tenant ON public.purchase_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_notifications_unread ON public.purchase_notifications(tenant_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_purchase_notifications_target ON public.purchase_notifications(target_role, is_read);
CREATE INDEX IF NOT EXISTS idx_purchase_order_history_order ON public.purchase_order_history(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_order ON public.purchase_payments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON public.purchase_orders(created_by);

-- 12. Fonction pour créer une notification d'approbation
CREATE OR REPLACE FUNCTION create_approval_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la commande passe en pending_approval, notifier le gérant
  IF NEW.status = 'pending_approval' AND (OLD.status IS NULL OR OLD.status != 'pending_approval') THEN
    INSERT INTO public.purchase_notifications (
      tenant_id,
      purchase_order_id,
      notification_type,
      target_role,
      title,
      message,
      amount
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      'approval_request',
      'gerant',
      'Demande d''approbation de commande',
      'La commande ' || NEW.order_number || ' nécessite votre approbation',
      NEW.total_amount
    );
  END IF;
  
  -- Si approuvée, notifier le comptable pour la demande d'avance
  IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
    INSERT INTO public.purchase_notifications (
      tenant_id,
      purchase_order_id,
      notification_type,
      target_role,
      title,
      message,
      amount
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      'advance_request',
      'comptable',
      'Demande d''avance pour achat',
      'La commande ' || NEW.order_number || ' a été approuvée et nécessite un décaissement',
      NEW.total_amount
    );
    
    -- Notifier aussi l'initiateur
    INSERT INTO public.purchase_notifications (
      tenant_id,
      purchase_order_id,
      notification_type,
      target_role,
      target_user_id,
      title,
      message,
      amount
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      'order_approved',
      'initiator',
      NEW.created_by,
      'Commande approuvée',
      'Votre commande ' || NEW.order_number || ' a été approuvée',
      NEW.total_amount
    );
  END IF;
  
  -- Si rejetée, notifier l'initiateur
  IF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
    INSERT INTO public.purchase_notifications (
      tenant_id,
      purchase_order_id,
      notification_type,
      target_role,
      target_user_id,
      title,
      message
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      'order_rejected',
      'initiator',
      NEW.created_by,
      'Commande rejetée',
      'Votre commande ' || NEW.order_number || ' a été rejetée. Raison: ' || COALESCE(NEW.rejection_reason, 'Non spécifiée')
    );
  END IF;
  
  -- Si modifiée et requires_reapproval, notifier le gérant
  IF NEW.requires_reapproval = true AND (OLD.requires_reapproval IS NULL OR OLD.requires_reapproval = false) THEN
    INSERT INTO public.purchase_notifications (
      tenant_id,
      purchase_order_id,
      notification_type,
      target_role,
      title,
      message,
      amount
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      'order_modified',
      'gerant',
      'Commande modifiée - Revalidation requise',
      'La commande ' || NEW.order_number || ' a été modifiée et nécessite une nouvelle approbation. Ancien montant: ' || COALESCE(NEW.previous_total, 0)::text || ' FCFA, Nouveau montant: ' || NEW.total_amount::text || ' FCFA',
      NEW.total_amount
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger pour les notifications automatiques
DROP TRIGGER IF EXISTS trigger_purchase_notifications ON public.purchase_orders;
CREATE TRIGGER trigger_purchase_notifications
  AFTER INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_notification();

-- 14. Mettre à jour created_by pour les commandes existantes sans cette info
-- (Les commandes existantes seront attribuées au premier gérant du tenant)
UPDATE public.purchase_orders po
SET created_by = (
  SELECT p.id FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.tenant_id = po.tenant_id AND ur.role = 'gerant'
  LIMIT 1
)
WHERE created_by IS NULL;