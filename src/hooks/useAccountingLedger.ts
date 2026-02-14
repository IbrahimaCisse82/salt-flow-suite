import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./useTenantId";

export interface JournalEntryWithTransaction {
  id: string;
  transaction_id: string;
  transaction_date: string;
  transaction_type: string;
  account_number: string;
  account_name: string | null;
  debit: number;
  credit: number;
  description: string | null;
  reference: string | null;
  tenant_id: string;
  running_balance?: number;
}

export interface TrialBalanceRow {
  account_number: string;
  account_name: string;
  account_type: string;
  opening_balance: number;
  period_debit: number;
  period_credit: number;
  closing_balance: number;
}

export const useAccountingLedger = (startDate?: string, endDate?: string) => {
  const tenant_id = useTenantId();

  // Récupérer les écritures du journal
  const { data: journalEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["accounting-ledger", tenant_id, startDate, endDate],
    queryFn: async () => {
      if (!tenant_id) return [];

      let query = supabase
        .from("journal_entries")
        .select(`
          id,
          transaction_id,
          account_number,
          account_name,
          debit,
          credit,
          description,
          transactions!inner (
            transaction_date,
            transaction_type,
            reference,
            tenant_id
          )
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error loading journal entries:", error);
        return [];
      }

      // Transformer les données avec type assertion
      type JournalEntryRaw = {
        id: string;
        transaction_id: string | null;
        account_number: string | null;
        account_name: string | null;
        debit: number | null;
        credit: number | null;
        description: string | null;
        transactions: {
          transaction_date: string | null;
          transaction_type: string | null;
          reference: string | null;
          tenant_id: string;
        } | null;
      };

      return ((data || []) as JournalEntryRaw[])
        .filter((entry) => entry.transactions?.tenant_id === tenant_id)
        .filter((entry) => {
          if (!startDate && !endDate) return true;
          const txDate = entry.transactions?.transaction_date;
          if (!txDate) return true;
          if (startDate && txDate < startDate) return false;
          if (endDate && txDate > endDate) return false;
          return true;
        })
        .map((entry) => ({
          id: entry.id,
          transaction_id: entry.transaction_id,
          transaction_date: entry.transactions?.transaction_date,
          transaction_type: entry.transactions?.transaction_type,
          account_number: entry.account_number,
          account_name: entry.account_name,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          description: entry.description,
          reference: entry.transactions?.reference,
          tenant_id: entry.transactions?.tenant_id,
        })) as JournalEntryWithTransaction[];
    },
    enabled: !!tenant_id,
  });

  // Récupérer la balance des comptes via RPC
  const { data: trialBalance = [], isLoading: balanceLoading } = useQuery({
    queryKey: ["trial-balance", tenant_id, startDate, endDate],
    queryFn: async () => {
      if (!tenant_id || !startDate || !endDate) return [];

      const { data, error } = await supabase.rpc("generate_trial_balance", {
        p_tenant_id: tenant_id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error("Error generating trial balance:", error);
        return [];
      }

      return (data || []) as TrialBalanceRow[];
    },
    enabled: !!tenant_id && !!startDate && !!endDate,
  });

  // Statistiques calculées
  const totalDebit = journalEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = journalEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Grouper par type de transaction
  const entriesByType = journalEntries.reduce((acc, entry) => {
    const type = entry.transaction_type || "autre";
    if (!acc[type]) acc[type] = [];
    acc[type].push(entry);
    return acc;
  }, {} as Record<string, JournalEntryWithTransaction[]>);

  return {
    journalEntries,
    trialBalance,
    isLoading: entriesLoading || balanceLoading,
    totalDebit,
    totalCredit,
    isBalanced,
    entriesByType,
  };
};

// Hook pour le solde d'un compte spécifique
export const useAccountBalance = (accountNumber: string, asOfDate?: string) => {
  const tenant_id = useTenantId();

  return useQuery({
    queryKey: ["account-balance", tenant_id, accountNumber, asOfDate],
    queryFn: async () => {
      if (!tenant_id || !accountNumber) return 0;

      const { data, error } = await supabase.rpc("get_account_balance", {
        p_tenant_id: tenant_id,
        p_account_number: accountNumber,
        p_as_of_date: asOfDate || new Date().toISOString().split("T")[0],
      });

      if (error) {
        console.error("Error getting account balance:", error);
        return 0;
      }

      return data as number;
    },
    enabled: !!tenant_id && !!accountNumber,
  });
};
