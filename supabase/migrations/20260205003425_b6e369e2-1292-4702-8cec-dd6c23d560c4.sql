-- Corriger le search_path de la fonction
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;