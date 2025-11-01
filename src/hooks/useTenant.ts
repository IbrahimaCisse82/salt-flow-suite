import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useTenant = () => {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();

  // Get tenant onboarding status
  const { data: tenantDetails, isLoading } = useQuery({
    queryKey: ['tenant-details', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('onboarding_completed, onboarding_step')
        .eq('id', tenant.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });

  // Update onboarding status
  const updateOnboarding = useMutation({
    mutationFn: async ({ completed, step }: { completed?: boolean; step?: string }) => {
      if (!tenant?.id) throw new Error('No tenant ID');

      const updates: any = {};
      if (completed !== undefined) updates.onboarding_completed = completed;
      if (step !== undefined) updates.onboarding_step = step;

      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenant.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-details'] });
      toast.success('Configuration enregistrée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour', {
        description: error.message,
      });
    },
  });

  const isNewTenant = tenantDetails && !tenantDetails.onboarding_completed;

  return {
    tenantDetails,
    isLoading,
    isNewTenant,
    updateOnboarding: updateOnboarding.mutate,
  };
};
