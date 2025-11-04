import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";

export interface TeamAttendance {
  id: string;
  tenant_id: string;
  team_id: string;
  employee_id: string;
  attendance_date: string;
  hours_worked: number;
  daily_rate: number;
  calculated_amount: number;
  status: 'pending' | 'validated' | 'paid';
  validated_by?: string;
  validated_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    full_name: string;
    employee_number: string;
  };
  teams?: {
    name: string;
  };
}

export const useTeamAttendance = (filters?: { status?: string; teamId?: string; dateFrom?: string; dateTo?: string }) => {
  return useQuery({
    queryKey: ['team-attendance', filters],
    queryFn: async () => {
      let query = supabase
        .from('team_attendance')
        .select(`
          *,
          employees (full_name, employee_number),
          teams (name)
        `)
        .order('attendance_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.teamId) {
        query = query.eq('team_id', filters.teamId);
      }
      if (filters?.dateFrom) {
        query = query.gte('attendance_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('attendance_date', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TeamAttendance[];
    }
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    tableName: 'team_attendance',
    operation: 'insert',
    mutationFn: async (attendance: Omit<TeamAttendance, 'id' | 'created_at' | 'updated_at' | 'calculated_amount' | 'status'>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userData.user?.id)
        .single();

      const { data, error } = await supabase
        .from('team_attendance')
        .insert({
          ...attendance,
          tenant_id: profile?.tenant_id,
          status: 'pending'
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-attendance'] });
      toast({
        title: "Pointage enregistré",
        description: navigator.onLine 
          ? "Le pointage a été enregistré avec succès"
          : "Le pointage sera synchronisé quand vous serez en ligne",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useValidateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    tableName: 'team_attendance',
    operation: 'update',
    getRecordId: (attendanceId: string) => attendanceId,
    mutationFn: async (attendanceId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('team_attendance')
        .update({
          status: 'validated',
          validated_by: userData.user?.id,
          validated_at: new Date().toISOString()
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-attendance'] });
      toast({
        title: "Pointage validé",
        description: navigator.onLine
          ? "Le pointage a été validé et une notification a été envoyée au comptable"
          : "La validation sera synchronisée quand vous serez en ligne",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};
