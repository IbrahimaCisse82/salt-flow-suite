import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useBassins = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: bassins = [], isLoading } = useQuery({
    queryKey: ['bassins', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('bassins')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading bassins:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createBassinMutation = useMutation({
    mutationFn: async (bassinData: {
      name: string;
      code?: string;
      area?: number;
      location?: string;
      is_active?: boolean;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const { data, error } = await supabase
        .from('bassins')
        .insert({
          ...bassinData,
          tenant_id: profile.tenant_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bassins'] });
      toast({
        title: "Bassin créé",
        description: "Le nouveau bassin a été créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le bassin",
        variant: "destructive"
      });
    }
  });

  return {
    bassins,
    isLoading,
    createBassin: createBassinMutation.mutateAsync,
    isCreating: createBassinMutation.isPending
  };
};
