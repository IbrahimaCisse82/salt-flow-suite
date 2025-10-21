import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotification } from "./usePushNotification";
import { logger } from "@/utils/logger";

/**
 * Hook pour écouter les nouvelles notifications et envoyer des push notifications
 */
export const usePushNotificationListener = () => {
  const { profile } = useAuth();
  const { sendPushNotification } = usePushNotification();

  useEffect(() => {
    if (!profile?.tenant_id) return;

    logger.info('Setting up push notification listener for tenant:', profile.tenant_id);

    // Écouter les nouvelles notifications comptables
    const channel = supabase
      .channel('accountant_notifications_push')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'accountant_notifications',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        async (payload) => {
          logger.info('New accountant notification received:', payload);

          const notification = payload.new as any;

          // Envoyer une notification push à tous les comptables du tenant
          await sendPushNotification({
            tenant_id: profile.tenant_id!,
            title: notification.title,
            message: notification.message,
            url: '/comptabilite',
            notification_type: notification.notification_type,
            tag: notification.id
          });
        }
      )
      .subscribe();

    return () => {
      logger.info('Removing push notification listener');
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, sendPushNotification]);
};
