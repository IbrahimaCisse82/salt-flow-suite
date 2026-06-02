// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotificationHistoryItem {
  id: string;
  tenant_id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id: string | null;
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
}

export const useNotificationHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as NotificationHistoryItem[];
    },
    enabled: !!user?.id,
  });
};

export const useTestNotification = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id || !profile?.tenant_id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          tenant_id: profile.tenant_id,
          title: 'Test de notification',
          message: 'Ceci est une notification de test pour vérifier que le système fonctionne correctement.',
          notification_type: 'test',
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Notification envoyée',
        description: 'Une notification de test a été envoyée avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible d'envoyer la notification: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
