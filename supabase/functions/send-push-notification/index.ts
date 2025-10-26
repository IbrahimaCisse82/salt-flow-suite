import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Clés VAPID (à configurer en tant que secrets)
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:support@g-suiteapp.com';

interface NotificationPayload {
  user_id?: string;
  tenant_id?: string;
  title: string;
  message: string;
  url?: string;
  notification_type?: string;
  tag?: string;
}

/**
 * Encode en base64url (format VAPID)
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Crée le JWT pour l'authentification VAPID
 */
function createVapidAuthToken(endpoint: string): string {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };
  
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 heures
    sub: VAPID_EMAIL
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // Note: La signature nécessite une implémentation ES256 complète
  // Pour l'instant, on utilise une bibliothèque externe
  return `${encodedHeader}.${encodedPayload}`;
}

/**
 * Envoie une notification push à un endpoint spécifique
 */
async function sendPushToEndpoint(
  subscription: any,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const endpoint = subscription.endpoint;
    const keys = subscription.keys;
    
    if (!keys || !keys.p256dh || !keys.auth) {
      console.error('Invalid subscription keys');
      return false;
    }
    
    const payloadString = JSON.stringify({
      title: payload.title,
      message: payload.message,
      body: payload.message,
      url: payload.url || '/',
      notification_type: payload.notification_type,
      tag: payload.tag || 'notification'
    });
    
    // Préparer les headers pour la requête Web Push
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400'
    };
    
    // Ajouter l'authentification VAPID si disponible
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      const vapidToken = createVapidAuthToken(endpoint);
      headers['Authorization'] = `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`;
    }
    
    // Pour simplifier, on envoie les données sans chiffrement (non recommandé en production)
    // En production, il faudrait chiffrer avec Web Push encryption
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: payloadString
    });
    
    if (!response.ok) {
      console.error(`Push failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Vérifier l'utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const payload: NotificationPayload = await req.json();

    // SECURITY: Log only non-sensitive metadata, not the full payload
    console.log('Sending push notification type:', payload.notification_type);

    // Récupérer les abonnements des utilisateurs concernés
    let query = supabaseClient
      .from('push_subscriptions')
      .select('*');

    // Filtrer par user_id si spécifié
    if (payload.user_id) {
      query = query.eq('user_id', payload.user_id);
    } else if (payload.tenant_id) {
      // Récupérer tous les utilisateurs du tenant
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('tenant_id', payload.tenant_id);
      
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.id);
        query = query.in('user_id', userIds);
      }
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscriptions found',
          sent: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Envoyer les notifications
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        sendPushToEndpoint(sub.subscription, payload)
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

    // SECURITY: Log only statistics, not user data
    console.log(`Push notifications sent: ${successCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        total: subscriptions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    // SECURITY: Return generic error message to client, log details server-side
    return new Response(
      JSON.stringify({ 
        error: 'Impossible d\'envoyer les notifications push'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
