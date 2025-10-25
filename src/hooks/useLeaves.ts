import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'conge_annuel' | 'conge_maladie' | 'conge_maternite' | 'conge_sans_solde' | 'autre';

export interface Leave {
  id: string;
  tenant_id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  status: LeaveStatus;
  requested_at: string;
  processed_by?: string;
  processed_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useLeaves = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (error) {
        console.error('Error loading leaves:', error);
        return [];
      }
      return data as Leave[];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createLeaveMutation = useOfflineMutation({
    tableName: 'leaves',
    operation: 'insert',
    mutationFn: async (leaveData: {
      employee_id: string;
      leave_type: LeaveType;
      start_date: string;
      end_date: string;
      reason?: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const { data, error } = await supabase
        .from('leaves')
        .insert({
          ...leaveData,
          tenant_id: profile.tenant_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({
        title: "Demande créée",
        description: navigator.onLine
          ? "Votre demande de congé a été soumise avec succès"
          : "Votre demande sera synchronisée quand vous serez en ligne",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la demande",
        variant: "destructive"
      });
    }
  });

  const updateLeaveStatusMutation = useOfflineMutation({
    tableName: 'leaves',
    operation: 'update',
    getRecordId: (vars: { id: string; status: LeaveStatus; rejection_reason?: string }) => vars.id,
    mutationFn: async ({
      id,
      status,
      rejection_reason
    }: {
      id: string;
      status: LeaveStatus;
      rejection_reason?: string;
    }) => {
      const updateData: any = {
        status,
        processed_at: new Date().toISOString(),
        processed_by: profile?.id
      };

      if (rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }

      const { data, error } = await supabase
        .from('leaves')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      const statusText = variables.status === 'approved' ? 'approuvée' : 
                        variables.status === 'rejected' ? 'rejetée' : 'annulée';
      toast({
        title: "Statut mis à jour",
        description: navigator.onLine
          ? `La demande a été ${statusText}`
          : `La mise à jour sera synchronisée quand vous serez en ligne`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  });

  const deleteLeaveM = useOfflineMutation({
    tableName: 'leaves',
    operation: 'delete',
    getRecordId: (id: string) => id,
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leaves')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({
        title: "Demande supprimée",
        description: navigator.onLine
          ? "La demande de congé a été supprimée"
          : "La suppression sera synchronisée quand vous serez en ligne",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la demande",
        variant: "destructive"
      });
    }
  });

  return {
    leaves,
    isLoading,
    createLeave: createLeaveMutation.mutateAsync,
    updateLeaveStatus: updateLeaveStatusMutation.mutateAsync,
    deleteLeave: deleteLeaveM.mutateAsync,
    isCreating: createLeaveMutation.isPending,
    isUpdating: updateLeaveStatusMutation.isPending,
    isDeleting: deleteLeaveM.isPending
  };
};
