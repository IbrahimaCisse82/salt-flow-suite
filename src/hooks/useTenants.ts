import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useTenants = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all tenants (admin only)
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch current user's tenant
  const { data: currentTenant, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-tenant', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id
  });

  // Create tenant
  const createTenant = useMutation({
    mutationFn: async (tenantData: any) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Entreprise créée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    }
  });

  // Update tenant
  const updateTenant = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['current-tenant'] });
      toast.success('Entreprise mise à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  });

  // Delete tenant
  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Entreprise supprimée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  });

  return {
    tenants,
    currentTenant,
    isLoading,
    isLoadingCurrent,
    createTenant: createTenant.mutate,
    updateTenant: updateTenant.mutate,
    deleteTenant: deleteTenant.mutate,
    isCreating: createTenant.isPending,
    isUpdating: updateTenant.isPending,
    isDeleting: deleteTenant.isPending
  };
};

// Hook pour les statistiques multi-tenant (admin)
export const useTenantStats = () => {
  return useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      // Récupérer les stats de tous les tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, is_active');
      
      if (tenantsError) throw tenantsError;

      // Pour chaque tenant, récupérer des stats
      const stats = await Promise.all(
        (tenants || []).map(async (tenant) => {
          const [
            { count: usersCount },
            { count: productionCount },
            { count: salesCount }
          ] = await Promise.all([
            supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', tenant.id),
            supabase
              .from('production_records')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', tenant.id),
            supabase
              .from('sales')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', tenant.id)
          ]);

          return {
            ...tenant,
            stats: {
              users: usersCount || 0,
              production: productionCount || 0,
              sales: salesCount || 0
            }
          };
        })
      );

      return stats;
    }
  });
};
