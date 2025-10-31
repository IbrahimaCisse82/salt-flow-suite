import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useQualityTests = (productionRecordId?: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: qualityTests, isLoading } = useQuery({
    queryKey: ['quality-tests', profile?.tenant_id, productionRecordId],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('quality_tests')
        .select(`
          *,
          production_record:production_records(id, production_date, quantity, salt_type),
          tested_by_profile:profiles!quality_tests_tested_by_fkey(id, full_name)
        `)
        .order('test_date', { ascending: false });

      if (productionRecordId) {
        query = query.eq('production_record_id', productionRecordId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading quality tests:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createTest = useMutation({
    mutationFn: async (testData: any) => {
      if (!profile?.tenant_id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('quality_tests')
        .insert({
          ...testData,
          tenant_id: profile.tenant_id,
          tested_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-tests'] });
      toast.success('Test qualité créé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création du test');
      console.error('Error creating quality test:', error);
    }
  });

  const updateTest = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('quality_tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-tests'] });
      toast.success('Test qualité mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating quality test:', error);
    }
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quality_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-tests'] });
      toast.success('Test qualité supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression');
      console.error('Error deleting quality test:', error);
    }
  });

  return {
    qualityTests,
    isLoading,
    createTest: createTest.mutate,
    updateTest: updateTest.mutate,
    deleteTest: deleteTest.mutate,
    isCreating: createTest.isPending,
    isUpdating: updateTest.isPending,
    isDeleting: deleteTest.isPending
  };
};
