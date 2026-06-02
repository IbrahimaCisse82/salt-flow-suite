// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AccountantNotification {
  id: string;
  tenant_id: string;
  notification_type: 'payroll_validated' | 'payment_required';
  reference_id: string;
  amount: number;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

export const useAccountantNotifications = () => {
  return useQuery({
    queryKey: ['accountant-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accountant_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountantNotification[];
    }
  });
};

export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('accountant_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    }
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('accountant_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountant-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });
};
