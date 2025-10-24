-- Enable pg_net extension for HTTP requests from SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Table pour stocker l'historique des notifications
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Enable RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their notifications"
  ON public.notification_history
  FOR SELECT
  USING (user_id = auth.uid());

-- Fonction pour envoyer une notification push via l'edge function
CREATE OR REPLACE FUNCTION public.send_push_notification(
  p_user_id UUID,
  p_tenant_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT DEFAULT 'general',
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
  request_id BIGINT;
  service_role_key TEXT;
BEGIN
  -- Insérer dans l'historique
  INSERT INTO public.notification_history (
    user_id,
    tenant_id,
    notification_type,
    title,
    message,
    reference_id,
    status
  ) VALUES (
    p_user_id,
    p_tenant_id,
    p_notification_type,
    p_title,
    p_message,
    p_reference_id,
    'pending'
  ) RETURNING id INTO notification_id;

  -- Note: En production, vous devez stocker SUPABASE_SERVICE_ROLE_KEY dans vault
  -- Pour cet exemple, on utilise directement la clé
  service_role_key := current_setting('app.settings.service_role_key', TRUE);
  
  -- Envoyer la notification via pg_net (asynchrone)
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', TRUE) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, current_setting('app.settings.anon_key', TRUE))
    ),
    body := jsonb_build_object(
      'user_id', p_user_id::TEXT,
      'tenant_id', p_tenant_id::TEXT,
      'title', p_title,
      'message', p_message,
      'notification_type', p_notification_type,
      'tag', p_notification_type
    )
  ) INTO request_id;

  -- Mettre à jour le statut
  UPDATE public.notification_history
  SET status = 'sent'
  WHERE id = notification_id;

  RETURN notification_id;
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, marquer comme échoué
  UPDATE public.notification_history
  SET status = 'failed'
  WHERE id = notification_id;
  
  RAISE WARNING 'Failed to send notification: %', SQLERRM;
  RETURN notification_id;
END;
$$;

-- Trigger pour les congés approuvés/rejetés
CREATE OR REPLACE FUNCTION public.notify_on_leave_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Notifier uniquement lors de changement de statut
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    IF NEW.status = 'approved' THEN
      notification_title := 'Congé approuvé';
      notification_message := 'Votre demande de congé du ' || to_char(NEW.start_date, 'DD/MM/YYYY') || 
                             ' au ' || to_char(NEW.end_date, 'DD/MM/YYYY') || ' a été approuvée.';
    ELSE
      notification_title := 'Congé refusé';
      notification_message := 'Votre demande de congé du ' || to_char(NEW.start_date, 'DD/MM/YYYY') || 
                             ' au ' || to_char(NEW.end_date, 'DD/MM/YYYY') || ' a été refusée.';
      IF NEW.rejection_reason IS NOT NULL THEN
        notification_message := notification_message || ' Raison: ' || NEW.rejection_reason;
      END IF;
    END IF;

    -- Envoyer la notification à l'employé
    PERFORM public.send_push_notification(
      NEW.employee_id,
      NEW.tenant_id,
      notification_title,
      notification_message,
      'leave_' || NEW.status,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_leave_status_change
  AFTER UPDATE ON public.leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_leave_status_change();

-- Trigger pour les validations de pointage
CREATE OR REPLACE FUNCTION public.notify_on_attendance_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  manager_ids UUID[];
  manager_id UUID;
BEGIN
  -- Notifier uniquement lors de la validation
  IF OLD.status = 'pending' AND NEW.status = 'validated' THEN
    -- Récupérer les gérants et admins du tenant
    SELECT ARRAY_AGG(DISTINCT p.id)
    INTO manager_ids
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.tenant_id = NEW.tenant_id
      AND ur.role IN ('admin', 'gerant', 'comptable');

    -- Envoyer une notification à chaque gestionnaire
    IF manager_ids IS NOT NULL THEN
      FOREACH manager_id IN ARRAY manager_ids
      LOOP
        PERFORM public.send_push_notification(
          manager_id,
          NEW.tenant_id,
          'Pointage validé',
          'Un pointage d''équipe a été validé. Montant: ' || NEW.calculated_amount || ' FCFA',
          'attendance_validated',
          NEW.id
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_attendance_validation
  AFTER UPDATE ON public.team_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_attendance_validation();

-- Trigger pour les paiements RH effectués
CREATE OR REPLACE FUNCTION public.notify_on_payroll_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notifier l'employé du paiement
  IF NEW.paid_to IS NOT NULL THEN
    PERFORM public.send_push_notification(
      NEW.paid_to,
      NEW.tenant_id,
      'Paiement reçu',
      'Votre paiement de ' || NEW.paid_amount || ' FCFA a été effectué le ' || 
      to_char(NEW.payment_date, 'DD/MM/YYYY'),
      'payroll_payment',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_payroll_payment_created
  AFTER INSERT ON public.payroll_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_payroll_payment();

-- Fonction pour envoyer des rappels de validation de pointage (à appeler via cron)
CREATE OR REPLACE FUNCTION public.send_attendance_validation_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_count INTEGER;
  manager_ids UUID[];
  manager_id UUID;
  tenant_rec RECORD;
BEGIN
  -- Pour chaque tenant, vérifier les pointages en attente
  FOR tenant_rec IN 
    SELECT DISTINCT tenant_id 
    FROM public.team_attendance 
    WHERE status = 'pending'
      AND attendance_date < CURRENT_DATE - INTERVAL '2 days'
  LOOP
    -- Compter les pointages en attente
    SELECT COUNT(*)
    INTO pending_count
    FROM public.team_attendance
    WHERE tenant_id = tenant_rec.tenant_id
      AND status = 'pending'
      AND attendance_date < CURRENT_DATE - INTERVAL '2 days';

    IF pending_count > 0 THEN
      -- Récupérer les gérants du tenant
      SELECT ARRAY_AGG(DISTINCT p.id)
      INTO manager_ids
      FROM public.profiles p
      JOIN public.user_roles ur ON p.id = ur.user_id
      WHERE p.tenant_id = tenant_rec.tenant_id
        AND ur.role IN ('admin', 'gerant');

      -- Envoyer un rappel à chaque gestionnaire
      IF manager_ids IS NOT NULL THEN
        FOREACH manager_id IN ARRAY manager_ids
        LOOP
          PERFORM public.send_push_notification(
            manager_id,
            tenant_rec.tenant_id,
            'Rappel: Pointages en attente',
            'Vous avez ' || pending_count || ' pointage(s) en attente de validation depuis plus de 2 jours.',
            'attendance_reminder',
            NULL
          );
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_tenant_id ON public.notification_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON public.notification_history(sent_at DESC);