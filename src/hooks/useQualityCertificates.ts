import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { QualityCertificateInsert, QualityCertificateUpdate } from "@/types/database.types";

export const useQualityCertificates = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['quality-certificates', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('quality_certificates')
        .select(`
          *,
          production_record:production_records(id, production_date, quantity, salt_type, batch_number),
          quality_test:quality_tests(id, quality_score, quality_status),
          issued_by_profile:profiles!quality_certificates_issued_by_fkey(id, full_name)
        `)
        .order('issue_date', { ascending: false });
      
      if (error) {
        console.error('Error loading quality certificates:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createCertificate = useMutation({
    mutationFn: async (certificateData: Omit<QualityCertificateInsert, 'tenant_id' | 'issued_by'>) => {
      if (!profile?.tenant_id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('quality_certificates')
        .insert({
          ...certificateData,
          tenant_id: profile.tenant_id,
          issued_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-certificates'] });
      toast.success('Certificat qualité créé');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création du certificat');
      console.error('Error creating certificate:', error);
    }
  });

  const updateCertificate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QualityCertificateUpdate> & { id: string }) => {
      const { data, error } = await supabase
        .from('quality_certificates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-certificates'] });
      toast.success('Certificat mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating certificate:', error);
    }
  });

  const deleteCertificate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quality_certificates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-certificates'] });
      toast.success('Certificat supprimé');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la suppression');
      console.error('Error deleting certificate:', error);
    }
  });

  return {
    certificates,
    isLoading,
    createCertificate: createCertificate.mutate,
    updateCertificate: updateCertificate.mutate,
    deleteCertificate: deleteCertificate.mutate,
    isCreating: createCertificate.isPending,
    isUpdating: updateCertificate.isPending,
    isDeleting: deleteCertificate.isPending
  };
};
