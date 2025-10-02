import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useCampagnes = () => {
  const queryClient = useQueryClient();

  const { data: campagnes = [], isLoading } = useQuery({
    queryKey: ['campagnes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campagnes')
        .select('*')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: activeCampagne } = useQuery({
    queryKey: ['active-campagne'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campagnes')
        .select('*')
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
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
      const { data, error } = await supabase
        .from('campagnes')
        .insert({
          ...campagneData,
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
