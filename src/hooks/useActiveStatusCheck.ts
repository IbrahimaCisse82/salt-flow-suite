import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Checks whether the current user or their tenant is deactivated
 * and forces sign-out if so.
 */
export const useActiveStatusCheck = (userId: string | undefined, hasProfile: boolean) => {
  useEffect(() => {
    if (!userId || !hasProfile) return;

    const checkActiveStatus = async () => {
      const { data, error } = await supabase.rpc('check_user_active', { p_user_id: userId });

      if (error || !data || data.length === 0) return;

      const status = data[0];

      if (!status.user_active) {
        logger.warn('User account is deactivated, signing out');
        toast.error('Compte désactivé', {
          description: 'Votre compte utilisateur a été désactivé. Contactez votre administrateur.',
          duration: 8000,
        });
        await supabase.auth.signOut();
        return;
      }

      if (!status.tenant_active) {
        logger.warn('Tenant is deactivated, signing out');
        toast.error('Entreprise désactivée', {
          description: `L'entreprise "${status.tenant_name}" a été désactivée. Contactez l'administrateur.`,
          duration: 8000,
        });
        await supabase.auth.signOut();
      }
    };

    checkActiveStatus();
  }, [userId, hasProfile]);
};
