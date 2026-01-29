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
          employees:paid_to (full_name, employee_number),
          accounts:payment_account_id (account_name, account_number)
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

      if (!profile?.tenant_id) throw new Error("Tenant non trouvé");

      // 1. Créer le paiement
      const { data: paymentData, error: paymentError } = await supabase
        .from('payroll_payments')
        .insert({
          ...payment,
          tenant_id: profile.tenant_id,
          processed_by: userData.user?.id
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Récupérer les infos du compte et de l'employé pour la description
      const { data: account } = await supabase
        .from('accounts')
        .select('account_name, account_number, balance')
        .eq('id', payment.payment_account_id)
        .single();

      const { data: employee } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', payment.paid_to)
        .single();

      // 3. Créer la transaction comptable (dépense salaire)
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          transaction_date: payment.payment_date,
          transaction_type: 'salaire',
          amount: payment.paid_amount,
          description: `Paiement salaire - ${employee?.full_name || 'Employé'}`,
          reference: `PAY-${paymentData.id.substring(0, 8)}`,
          notes: payment.notes || null
        });

      if (txError) {
        console.error("Erreur création transaction:", txError);
      }

      // 4. Mettre à jour le solde du compte de paiement
      const newBalance = (account?.balance || 0) - payment.paid_amount;
      const { error: accountError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', payment.payment_account_id);

      if (accountError) {
        console.error("Erreur mise à jour solde compte:", accountError);
      }

      // 5. Mettre à jour le statut du pointage à "paid"
      if (payment.attendance_id) {
        const { error: attendanceError } = await supabase
          .from('team_attendance')
          .update({ status: 'paid' })
          .eq('id', payment.attendance_id);

        if (attendanceError) {
          console.error("Erreur mise à jour pointage:", attendanceError);
        }
      }

      return paymentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-payments'] });
      queryClient.invalidateQueries({ queryKey: ['team-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payroll-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['accountant-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-accounts'] });
      toast({
        title: "Paiement enregistré",
        description: navigator.onLine
          ? "Le paiement RH a été enregistré et la trésorerie mise à jour"
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
