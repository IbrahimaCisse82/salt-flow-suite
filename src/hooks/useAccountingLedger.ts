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

      // Fetch transactions for the tenant first, then get their journal entries
      let txQuery = supabase
        .from("transactions")
        .select("id, transaction_date, transaction_type, reference, tenant_id")
        .eq("tenant_id", tenant_id);

      if (startDate) txQuery = txQuery.gte("transaction_date", startDate);
      if (endDate) txQuery = txQuery.lte("transaction_date", endDate);

      const { data: transactions, error: txError } = await txQuery;
      if (txError || !transactions?.length) {
        if (txError) console.error("Error loading transactions:", txError);
        return [];
      }

      const txIds = transactions.map((t) => t.id);
      const txMap = new Map(transactions.map((t) => [t.id, t]));

      // Fetch journal entries for those transactions
      const { data: entries, error: jeError } = await supabase
        .from("journal_entries")
        .select("id, transaction_id, account_number, account_name, debit, credit, description")
        .in("transaction_id", txIds)
        .order("created_at", { ascending: false });

      if (jeError) {
        console.error("Error loading journal entries:", jeError);
        return [];
      }

      return (entries || []).map((entry) => {
        const tx = txMap.get(entry.transaction_id!);
        return {
          id: entry.id,
          transaction_id: entry.transaction_id,
          transaction_date: tx?.transaction_date,
          transaction_type: tx?.transaction_type,
          account_number: entry.account_number,
          account_name: entry.account_name,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          description: entry.description,
          reference: tx?.reference,
          tenant_id: tx?.tenant_id,
        };
      }) as JournalEntryWithTransaction[];
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
