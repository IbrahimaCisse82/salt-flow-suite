import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenantRow, TenantInsert, TenantUpdate } from "@/types/database.types";
import { cleanString, ensureBoolean } from "@/utils/dataTransformers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Interface pour le formulaire
export interface TenantFormData {
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  manager_name?: string;
  ninea?: string;
  rccm?: string;
  subdomain?: string;
  logo_url?: string;
  is_active?: boolean;
}

// Transforme les données du formulaire vers le format DB
const transformFormToInsert = (form: TenantFormData): TenantInsert => ({
  name: form.name.trim(),
  contact_email: cleanString(form.contact_email),
  contact_phone: cleanString(form.contact_phone),
  address: cleanString(form.address),
  manager_name: cleanString(form.manager_name),
  ninea: cleanString(form.ninea),
  rccm: cleanString(form.rccm),
  subdomain: cleanString(form.subdomain),
  logo_url: cleanString(form.logo_url),
  is_active: form.is_active ?? true,
});

export const useTenants = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all tenants (admin only)
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async (): Promise<TenantRow[]> => {
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
    queryFn: async (): Promise<TenantRow | null> => {
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
    mutationFn: async (formData: TenantFormData): Promise<TenantRow> => {
      const insertData = transformFormToInsert(formData);
      
      const { data, error } = await supabase
        .from('tenants')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Entreprise créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error(error);
    }
  });

  // Update tenant
  const updateTenant = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TenantFormData>): Promise<TenantRow> => {
      const updateData: TenantUpdate = {
        name: updates.name?.trim(),
        contact_email: updates.contact_email !== undefined ? cleanString(updates.contact_email) : undefined,
        contact_phone: updates.contact_phone !== undefined ? cleanString(updates.contact_phone) : undefined,
        address: updates.address !== undefined ? cleanString(updates.address) : undefined,
        manager_name: updates.manager_name !== undefined ? cleanString(updates.manager_name) : undefined,
        ninea: updates.ninea !== undefined ? cleanString(updates.ninea) : undefined,
        rccm: updates.rccm !== undefined ? cleanString(updates.rccm) : undefined,
        subdomain: updates.subdomain !== undefined ? cleanString(updates.subdomain) : undefined,
        logo_url: updates.logo_url !== undefined ? cleanString(updates.logo_url) : undefined,
        is_active: updates.is_active !== undefined ? ensureBoolean(updates.is_active) : undefined,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof TenantUpdate] === undefined) {
          delete updateData[key as keyof TenantUpdate];
        }
      });
      
      const { data, error } = await supabase
        .from('tenants')
        .update(updateData)
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
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error(error);
    }
  });

  // Delete tenant
  const deleteTenant = useMutation({
    mutationFn: async (id: string): Promise<void> => {
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
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
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
