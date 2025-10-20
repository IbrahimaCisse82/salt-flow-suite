import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

      const { data, error } = await supabase
        .from('campagnes')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.error('Error loading active campagne:', error);
        return null;
      }
      return data;
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createCampagneMutation = useMutation({
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
        description: "La nouvelle campagne a été créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la campagne",
        variant: "destructive"
      });
    }
  });

  const updateCampagneMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('campagnes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campagnes'] });
      queryClient.invalidateQueries({ queryKey: ['active-campagne'] });
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
