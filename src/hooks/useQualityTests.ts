import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QualityTestRow, QualityTestInsert, QualityTestUpdate } from "@/types/database.types";
import { ensureNumber, cleanString, dateToISOString } from "@/utils/dataTransformers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Interface pour le formulaire
export interface QualityTestFormData {
  production_record_id?: string;
  test_date?: string;
  batch_number?: string;
  salt_purity?: number | string;
  humidity_level?: number | string;
  impurities_level?: number | string;
  color_grade?: string;
  grain_size?: string;
  quality_status?: string;
  notes?: string;
  corrective_actions?: string;
}

// Type étendu avec relations
export interface QualityTestWithRelations extends QualityTestRow {
  production_record?: {
    id: string;
    production_date: string | null;
    quantity: number | null;
    salt_type: string;
  } | null;
  tested_by_profile?: {
    id: string;
    full_name: string | null;
  } | null;
}

// Transforme les données du formulaire vers le format DB
const transformFormToInsert = (
  form: QualityTestFormData, 
  tenantId: string,
  testedBy: string
): QualityTestInsert => ({
  tenant_id: tenantId,
  production_record_id: form.production_record_id || null,
  test_date: form.test_date || new Date().toISOString().split('T')[0],
  batch_number: cleanString(form.batch_number),
  salt_purity: ensureNumber(form.salt_purity),
  humidity_level: ensureNumber(form.humidity_level),
  impurities_level: ensureNumber(form.impurities_level),
  color_grade: cleanString(form.color_grade),
  grain_size: cleanString(form.grain_size),
  quality_status: form.quality_status || 'pending',
  notes: cleanString(form.notes),
  corrective_actions: cleanString(form.corrective_actions),
  tested_by: testedBy,
});

export const useQualityTests = (productionRecordId?: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: qualityTests, isLoading } = useQuery({
    queryKey: ['quality-tests', profile?.tenant_id, productionRecordId],
    queryFn: async (): Promise<QualityTestWithRelations[]> => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('quality_tests')
        .select(`
          *,
          production_record:production_records(id, production_date, quantity, salt_type),
          tested_by_profile:profiles!quality_tests_tested_by_fkey(id, full_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .is('deleted_at', null)
        .order('test_date', { ascending: false });

      if (productionRecordId) {
        query = query.eq('production_record_id', productionRecordId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading quality tests:', error);
        return [];
      }
      return (data || []) as QualityTestWithRelations[];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createTest = useMutation({
    mutationFn: async (formData: QualityTestFormData): Promise<QualityTestRow> => {
      if (!profile?.tenant_id) throw new Error('No tenant');
      if (!profile?.id) throw new Error('No user');

      const insertData = transformFormToInsert(formData, profile.tenant_id, profile.id);

      const { data, error } = await supabase
        .from('quality_tests')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-tests'] });
      toast.success('Test qualité créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error('Error creating quality test:', error);
    }
  });

  const updateTest = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<QualityTestFormData>): Promise<QualityTestRow> => {
      const updateData: QualityTestUpdate = {
        salt_purity: updates.salt_purity !== undefined ? ensureNumber(updates.salt_purity) : undefined,
        humidity_level: updates.humidity_level !== undefined ? ensureNumber(updates.humidity_level) : undefined,
        impurities_level: updates.impurities_level !== undefined ? ensureNumber(updates.impurities_level) : undefined,
        color_grade: updates.color_grade !== undefined ? cleanString(updates.color_grade) : undefined,
        grain_size: updates.grain_size !== undefined ? cleanString(updates.grain_size) : undefined,
        quality_status: updates.quality_status,
        notes: updates.notes !== undefined ? cleanString(updates.notes) : undefined,
        corrective_actions: updates.corrective_actions !== undefined ? cleanString(updates.corrective_actions) : undefined,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof QualityTestUpdate] === undefined) {
          delete updateData[key as keyof QualityTestUpdate];
        }
      });

      const { data, error } = await supabase
        .from('quality_tests')
        .update(updateData)
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
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error('Error updating quality test:', error);
    }
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('quality_tests')
        .update({ deleted_at: new Date().toISOString() } as QualityTestUpdate)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-tests'] });
      toast.success('Test qualité supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
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
