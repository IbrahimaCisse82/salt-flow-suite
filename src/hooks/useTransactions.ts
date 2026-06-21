import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { TransactionRow, TransactionInsert, TransactionUpdate } from "@/types/database.types";
import { cleanString, ensureNumber, dateToYYYYMMDD } from "@/utils/dataTransformers";

export type TransactionType = 'recette' | 'depense' | 'vente_locale' | 'vente_export' | 'achat' | 'salaire' | 'autre';

export interface TransactionFormData {
  transaction_date: string;
  transaction_type: TransactionType;
  amount: number | string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  account_id?: string;
  category?: string;
}

export const useTransactions = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', profile?.tenant_id],
    queryFn: async (): Promise<TransactionRow[]> => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(account_name, account_number)
        `)
        .order('transaction_date', { ascending: false })
        .limit(500);
      
      if (error) {
        console.error('Error loading transactions:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createTransaction = useMutation({
    mutationFn: async (formData: TransactionFormData): Promise<TransactionRow> => {
      if (!profile?.tenant_id) throw new Error("Tenant ID manquant");

      const insertData: TransactionInsert = {
        tenant_id: profile.tenant_id,
        transaction_date: dateToYYYYMMDD(formData.transaction_date) || new Date().toISOString().split('T')[0],
        transaction_type: formData.transaction_type,
        amount: ensureNumber(formData.amount) || 0,
        description: cleanString(formData.description),
        reference: cleanString(formData.reference_type),
        notes: formData.reference_id ? `Ref: ${formData.reference_id}` : null
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success("Transaction enregistrée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TransactionFormData>): Promise<TransactionRow> => {
      const updateData: TransactionUpdate = {
        transaction_date: updates.transaction_date ? dateToYYYYMMDD(updates.transaction_date) : undefined,
        transaction_type: updates.transaction_type,
        amount: updates.amount !== undefined ? ensureNumber(updates.amount) : undefined,
        description: updates.description !== undefined ? cleanString(updates.description) : undefined,
        updated_at: new Date().toISOString()
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof TransactionUpdate] === undefined) {
          delete updateData[key as keyof TransactionUpdate];
        }
      });

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success("Transaction mise à jour");
    }
  });

  // Validate a single transaction (locks it permanently)
  const validateTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase.rpc("validate_transaction", {
        _id: transactionId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-ledger'] });
      toast.success("Transaction validée — verrouillée définitivement");
    },
    onError: (error: Error) => {
      toast.error(`Erreur validation: ${error.message}`);
    },
  });

  // Bulk validate
  const validateTransactionsBulk = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const { data, error } = await supabase.rpc("validate_transactions_bulk", {
        _ids: transactionIds,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-ledger'] });
      toast.success(`${data?.validated_count || 0} transactions validées`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur validation groupée: ${error.message}`);
    },
  });

  // KPIs financiers
  const totalRecettes = transactions
    .filter(t => ['recette', 'vente_locale', 'vente_export'].includes(t.transaction_type || ''))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalDepenses = transactions
    .filter(t => ['depense', 'achat', 'salaire'].includes(t.transaction_type || ''))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const resultatNet = totalRecettes - totalDepenses;

  return {
    transactions,
    isLoading,
    createTransaction,
    updateTransaction,
    validateTransaction,
    validateTransactionsBulk,
    // KPIs
    totalRecettes,
    totalDepenses,
    resultatNet
  };
};

// Hook pour les comptes comptables
export const useAccounts = () => {
  const { profile } = useAuth();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('account_number');
      
      if (error) {
        console.error('Error loading accounts:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id
  });

  return { accounts, isLoading };
};