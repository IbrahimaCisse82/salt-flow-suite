import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Listens to real-time changes on user_roles for the current user
 * and invalidates the profile cache + reloads when the role changes.
 */
export const useRoleListener = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-role-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          logger.info('Role changed, invalidating cache and refetching profile');
          queryClient.invalidateQueries({ queryKey: ['profile-with-tenant-role'] });
          toast.info('Votre rôle a été modifié', {
            description: 'Rechargement de la page pour appliquer les changements...',
            duration: 3000,
          });
          setTimeout(() => window.location.reload(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
