import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useCampagneBudgets = (campagneId?: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: phaseBudgets = [], isLoading } = useQuery({
    queryKey: ['phase-budgets', campagneId, profile?.tenant_id],
    enabled: !!campagneId && !!profile?.tenant_id,
    queryFn: async () => {
      if (!campagneId || !profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('campagne_phase_budgets')
        .select('*')
        .eq('campagne_id', campagneId)
        .order('phase');
      
      if (error) {
        console.error('Error loading phase budgets:', error);
        return [];
      }
      return data || [];
    },
    retry: 1
  });

  const upsertPhaseBudgetMutation = useMutation({
    mutationFn: async (budgetData: {
      campagne_id: string;
      phase: string;
      budgeted_amount: number;
    }) => {
      const { error } = await supabase
        .from('campagne_phase_budgets')
        .upsert(budgetData, {
          onConflict: 'campagne_id,phase'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-budgets'] });
      toast({
        title: "Budget mis à jour",
        description: "Le budget de phase a été enregistré",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le budget",
        variant: "destructive"
      });
    }
  });

  return {
    phaseBudgets,
    isLoading,
    upsertPhaseBudget: upsertPhaseBudgetMutation.mutateAsync,
    isUpdating: upsertPhaseBudgetMutation.isPending
  };
};
