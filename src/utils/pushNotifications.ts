import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

// Clé publique VAPID (à générer et stocker en tant que secret)
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Iy-4_Ohd8ZhZAkF1_qCxO5kMxbxZ3Qq6Cb2qh42VIpiFwPnFaHPKLmLXW8M";

/**
 * Convertit une clé publique VAPID base64 en Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Demande la permission pour les notifications push
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    logger.warn('Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    logger.warn('Permission pour les notifications refusée');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * S'abonne aux notifications push
 */
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    // Vérifier la permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    // Vérifier si le service worker est disponible
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker non supporté');
      return false;
    }

    // Obtenir le service worker enregistré
    const registration = await navigator.serviceWorker.ready;

    // S'abonner aux notifications push
    const subscription = await (registration as any).pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
    });

    // Sauvegarder l'abonnement dans la base de données
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert([{
        user_id: userId,
        subscription: subscription.toJSON() as any,
        endpoint: subscription.endpoint
      }], {
        onConflict: 'endpoint'
      });

    if (error) {
      logger.error('Erreur lors de la sauvegarde de l\'abonnement:', error);
      return false;
    }

    logger.info('Abonnement aux notifications push réussi');
    return true;
  } catch (error) {
    logger.error('Erreur lors de l\'abonnement aux notifications push:', error);
    return false;
  }
}

/**
 * Se désabonne des notifications push
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await (registration as any).pushManager.getSubscription();

    if (!subscription) {
      return true;
    }

    // Supprimer de la base de données
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', subscription.endpoint);

    if (error) {
      logger.error('Erreur lors de la suppression de l\'abonnement:', error);
    }

    // Se désabonner
    await subscription.unsubscribe();
    logger.info('Désabonnement des notifications push réussi');
    return true;
  } catch (error) {
    logger.error('Erreur lors du désabonnement:', error);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur est abonné aux notifications push
 */
export async function isPushNotificationSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await (registration as any).pushManager.getSubscription();

    return subscription !== null;
  } catch (error) {
    logger.error('Erreur lors de la vérification de l\'abonnement:', error);
    return false;
  }
}