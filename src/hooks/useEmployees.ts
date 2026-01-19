import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { EmployeeRow, EmployeeInsert, EmployeeUpdate } from "@/types/database.types";
import { cleanString, ensureNumber, dateToYYYYMMDD, ensureBoolean } from "@/utils/dataTransformers";

export interface EmployeeFormData {
  full_name: string;
  email?: string;
  phone?: string;
  position?: string;
  employee_type?: 'permanent' | 'saisonnier' | 'journalier';
  employee_number?: string;
  hire_date?: string;
  salary?: number | string;
  is_active?: boolean;
}

// Hook pour récupérer les employés avec le nom de leur équipe
export const useEmployees = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['employees', userRole, profile?.tenant_id],
    queryFn: async (): Promise<EmployeeRow[]> => {
      // Seuls les admins et gérants peuvent voir les employés
      const canViewEmployees = userRole === 'admin' || userRole === 'gerant';
      if (!canViewEmployees || !profile?.tenant_id) return [];

      // Requête Supabase pour récupérer les employés avec l'équipe associée
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (error) {
        console.error('Error loading employees:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};

// Hook pour les mutations sur les employés
export const useEmployeeMutations = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const createEmployee = useMutation({
    mutationFn: async (formData: EmployeeFormData): Promise<EmployeeRow> => {
      if (!profile?.tenant_id) throw new Error("Tenant ID manquant");

      const insertData: EmployeeInsert = {
        tenant_id: profile.tenant_id,
        full_name: formData.full_name.trim(),
        email: cleanString(formData.email),
        phone: cleanString(formData.phone),
        position: cleanString(formData.position),
        employee_type: formData.employee_type || 'permanent',
        employee_number: cleanString(formData.employee_number),
        hire_date: dateToYYYYMMDD(formData.hire_date),
        salary: ensureNumber(formData.salary),
        is_active: ensureBoolean(formData.is_active ?? true)
      };

      const { data, error } = await supabase
        .from('employees')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Employé créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<EmployeeFormData>): Promise<EmployeeRow> => {
      const updateData: EmployeeUpdate = {
        full_name: updates.full_name?.trim(),
        email: updates.email !== undefined ? cleanString(updates.email) : undefined,
        phone: updates.phone !== undefined ? cleanString(updates.phone) : undefined,
        position: updates.position !== undefined ? cleanString(updates.position) : undefined,
        employee_type: updates.employee_type,
        employee_number: updates.employee_number !== undefined ? cleanString(updates.employee_number) : undefined,
        hire_date: updates.hire_date !== undefined ? dateToYYYYMMDD(updates.hire_date) : undefined,
        salary: updates.salary !== undefined ? ensureNumber(updates.salary) : undefined,
        is_active: updates.is_active !== undefined ? ensureBoolean(updates.is_active) : undefined,
        updated_at: new Date().toISOString()
      };

      // Remove undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof EmployeeUpdate] === undefined) {
          delete updateData[key as keyof EmployeeUpdate];
        }
      });

      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Employé mis à jour");
    }
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Soft delete
      const { error } = await supabase
        .from('employees')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Employé désactivé");
    }
  });

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee
  };
};

// Hook pour les journaliers
export const useDailyWorkerMutations = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const createDailyWorker = useMutation({
    mutationFn: async (workerData: { full_name: string; phone?: string; daily_rate?: number }) => {
      if (!profile?.tenant_id) throw new Error("Tenant ID manquant");

      const { data, error } = await supabase
        .from('daily_workers')
        .insert({
          tenant_id: profile.tenant_id,
          full_name: workerData.full_name.trim(),
          phone: cleanString(workerData.phone),
          daily_rate: ensureNumber(workerData.daily_rate)
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-workers'] });
      toast.success("Journalier ajouté");
    }
  });

  const updateDailyWorker = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; full_name?: string; phone?: string; daily_rate?: number }) => {
      const { data, error } = await supabase
        .from('daily_workers')
        .update({
          full_name: updates.full_name?.trim(),
          phone: updates.phone !== undefined ? cleanString(updates.phone) : undefined,
          daily_rate: updates.daily_rate !== undefined ? ensureNumber(updates.daily_rate) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-workers'] });
      toast.success("Journalier mis à jour");
    }
  });

  return {
    createDailyWorker,
    updateDailyWorker
  };
};
