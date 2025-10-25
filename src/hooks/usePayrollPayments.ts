import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";

export interface PayrollPayment {
  id: string;
  tenant_id: string;
  attendance_id: string;
  paid_amount: number;
  balance_due: number;
  paid_to: string;
  payment_account_id: string;
  payment_date: string;
  payment_method?: string;
  receiver_signature?: string;
  processed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    full_name: string;
    employee_number: string;
  };
  accounts?: {
    account_name: string;
    account_number: string;
  };
}

export const usePayrollPayments = () => {
  return useQuery({
    queryKey: ['payroll-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_payments')
        .select(`
          *,
          employees (full_name, employee_number),
          accounts (account_name, account_number)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as PayrollPayment[];
    }
  });
};

export const useCreatePayrollPayment = () => {
  const queryClient = useQueryClient();
  
  return useOfflineMutation({
    tableName: 'payroll_payments',
    operation: 'insert',
    mutationFn: async (payment: Omit<PayrollPayment, 'id' | 'created_at' | 'updated_at' | 'processed_by'>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userData.user?.id)
        .single();

      const { data, error } = await supabase
        .from('payroll_payments')
        .insert({
          ...payment,
          tenant_id: profile?.tenant_id,
          processed_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-payments'] });
      queryClient.invalidateQueries({ queryKey: ['team-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['accountant-notifications'] });
      toast({
        title: "Paiement enregistré",
        description: navigator.onLine
          ? "Le paiement RH a été enregistré avec succès"
          : "Le paiement sera synchronisé quand vous serez en ligne",
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
