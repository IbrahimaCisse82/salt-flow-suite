import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";

export interface Client {
  id: string;
  name: string;
  client_type: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tenant_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export const useClients = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;
  const queryClient = useQueryClient();

  const canViewClients = 
    userRole === 'admin' || 
    userRole === 'super_admin' ||
    userRole === 'gerant' || 
    userRole === 'commercial';

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients', profile?.tenant_id],
    queryFn: async () => {
      if (!canViewClients || !profile?.tenant_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: canViewClients && !!profile?.tenant_id
  });

  const createClientMutation = useOfflineMutation({
    tableName: 'clients',
    operation: 'insert',
    mutationFn: async (clientData: {
      name: string;
      client_type?: string;
      email?: string;
      phone?: string;
      address?: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          tenant_id: profile.tenant_id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Client créé",
        description: navigator.onLine 
          ? "Le client a été enregistré avec succès"
          : "Le client sera synchronisé quand vous serez en ligne",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le client",
        variant: "destructive"
      });
    }
  });

  const updateClientMutation = useOfflineMutation({
    tableName: 'clients',
    operation: 'update',
    getRecordId: (data: { id: string }) => data.id,
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Client mis à jour",
        description: "Les modifications ont été enregistrées",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le client",
        variant: "destructive"
      });
    }
  });

  const deleteClientMutation = useOfflineMutation({
    tableName: 'clients',
    operation: 'update',
    getRecordId: (id: string) => id,
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le client",
        variant: "destructive"
      });
    }
  });

  return {
    clients,
    isLoading,
    error,
    canViewClients,
    createClient: createClientMutation.mutateAsync,
    updateClient: updateClientMutation.mutateAsync,
    deleteClient: deleteClientMutation.mutateAsync,
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending
  };
};
