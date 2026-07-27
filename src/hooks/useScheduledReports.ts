// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ReportType = 'campagne' | 'financier' | 'production' | 'rh' | 'commercial';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ScheduledReport {
  id: string;
  tenant_id: string;
  created_by: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  schedule_time: string;
  start_date: string;
  end_date?: string;
  recipient_emails: string[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledReportInput {
  report_type: ReportType;
  frequency: ReportFrequency;
  schedule_time: string;
  start_date: string;
  end_date?: string;
  recipient_emails: string[];
}

export const useScheduledReports = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer tous les rapports planifiés
  const { data: scheduledReports = [], isLoading } = useQuery({
    queryKey: ['scheduled-reports', profile?.tenant_id],
    queryFn: async (): Promise<ScheduledReport[]> => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ScheduledReport[];
    },
    enabled: !!profile?.tenant_id
  });

  // Créer un rapport planifié
  const createReport = useMutation({
    mutationFn: async (input: CreateScheduledReportInput) => {
      if (!profile?.tenant_id) throw new Error('Tenant ID non trouvé');

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          tenant_id: profile.tenant_id,
          created_by: profile.id,
          ...input
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Rapport planifié créé",
        description: "Le rapport sera généré automatiquement selon le calendrier défini"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le rapport planifié",
        variant: "destructive"
      });
    }
  });

  // Mettre à jour un rapport planifié
  const updateReport = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduledReport> }) => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Rapport mis à jour",
        description: "Les modifications ont été enregistrées"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le rapport",
        variant: "destructive"
      });
    }
  });

  // Supprimer un rapport planifié
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: "Rapport supprimé",
        description: "Le rapport planifié a été supprimé"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le rapport",
        variant: "destructive"
      });
    }
  });

  // Activer/désactiver un rapport
  const toggleReport = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le statut",
        variant: "destructive"
      });
    }
  });

  return {
    scheduledReports,
    isLoading,
    createReport,
    updateReport,
    deleteReport,
    toggleReport
  };
};