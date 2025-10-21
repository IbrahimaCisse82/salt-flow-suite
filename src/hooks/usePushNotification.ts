import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface PushNotificationPayload {
  user_id?: string;
  tenant_id?: string;
  title: string;
  message: string;
  url?: string;
  notification_type?: string;
  tag?: string;
}

/**
 * Hook pour envoyer des notifications push
 */
export const usePushNotification = () => {
  const sendPushNotification = async (payload: PushNotificationPayload): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.error('No active session for push notification');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        logger.error('Error sending push notification:', error);
        return false;
      }

      logger.info('Push notification sent:', data);
      return true;
    } catch (error) {
      logger.error('Exception sending push notification:', error);
      return false;
    }
  };

  return { sendPushNotification };
};
