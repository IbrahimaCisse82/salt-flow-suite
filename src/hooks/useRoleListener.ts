import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Polls user_roles periodically to detect role changes.
 * (Realtime on user_roles is disabled for security — no cross-tenant leak.)
 */
export const useRoleListener = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const lastRoleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Seed the ref with current role
    const fetchRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const currentRole = data?.role ?? null;

      if (lastRoleRef.current !== null && currentRole !== lastRoleRef.current) {
        logger.info('Role changed detected via polling, refetching profile');
        queryClient.invalidateQueries({ queryKey: ['profile-with-tenant-role'] });
        toast.info('Votre rôle a été modifié', {
          description: 'Rechargement de la page pour appliquer les changements...',
          duration: 3000,
        });
        setTimeout(() => window.location.reload(), 1500);
      }

      lastRoleRef.current = currentRole;
    };

    fetchRole();
    const interval = setInterval(fetchRole, 30_000); // Poll every 30s

    return () => clearInterval(interval);
  }, [userId, queryClient]);
};
