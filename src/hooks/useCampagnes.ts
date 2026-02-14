import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";

export const useCampagnes = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: campagnes = [], isLoading } = useQuery({
    queryKey: ['campagnes', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('campagnes')
        .select('*')
        .order('year', { ascending: false });
      
      if (error) {
        console.error('Error loading campagnes:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const { data: activeCampagne } = useQuery({
    queryKey: ['active-campagne', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;

      // Chercher d'abord une campagne avec status 'active' pour ce tenant
      const { data: activeCamp, error: activeError } = await supabase
        .from('campagnes')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeError) {
        console.error('Error loading active campagne:', activeError);
      }
      
      if (activeCamp) return activeCamp;

      // Sinon, prendre la campagne la plus récente pour ce tenant
      const { data: latestCamp, error: latestError } = await supabase
        .from('campagnes')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('year', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestError) {
        console.error('Error loading latest campagne:', latestError);
        return null;
      }
      
      return latestCamp;
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createCampagneMutation = useOfflineMutation({
    tableName: 'campagnes',
    operation: 'insert',
    mutationFn: async (campagneData: {
      name: string;
      year: number;
      start_date: string;
      end_date: string;
      target_production: number;
      budget_total: number;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const { data, error } = await supabase
        .from('campagnes')
        .insert({
          ...campagneData,
          tenant_id: profile.tenant_id,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campagnes'] });
      queryClient.invalidateQueries({ queryKey: ['active-campagne'] });
      toast({
        title: "Campagne créée",
        description: navigator.onLine
          ? "La nouvelle campagne a été créée avec succès"
          : "La campagne sera synchronisée quand vous serez en ligne",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la campagne",
        variant: "destructive"
      });
    }
  });

  const updateCampagneMutation = useOfflineMutation({
    tableName: 'campagnes',
    operation: 'update',
    getRecordId: (data: { id: string; [key: string]: any }) => data.id,
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('campagnes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campagnes'] });
      queryClient.invalidateQueries({ queryKey: ['active-campagne'] });
      toast({
        title: "Campagne mise à jour",
        description: navigator.onLine
          ? "La campagne a été mise à jour avec succès"
          : "La mise à jour sera synchronisée quand vous serez en ligne",
      });
    }
  });

  return {
    campagnes,
    activeCampagne,
    isLoading,
    createCampagne: createCampagneMutation.mutateAsync,
    updateCampagne: updateCampagneMutation.mutateAsync,
    isCreating: createCampagneMutation.isPending
  };
};
