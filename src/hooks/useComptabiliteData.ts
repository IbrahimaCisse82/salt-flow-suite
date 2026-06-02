import { useQuery } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";

// Cast to bypass strict typed schema (untyped tables / enum mismatches)
const supabase = _supabase as any;
import { logger } from "@/utils/logger";

export const useComptabiliteData = () => {
  const { data: expenseTypes = [], isLoading: expenseTypesLoading } = useQuery({
    queryKey: ['expense-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) { logger.error('Error fetching expense types:', error); throw error; }
      return data || [];
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('is_active', true).order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: dailyWorkers = [] } = useQuery({
    queryKey: ['daily-workers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_workers').select('*').order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*').order('account_name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: pendingInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['pending-invoices'],
    queryFn: async () => {
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`*, client:clients(name, client_type)`)
        .order('sale_date', { ascending: false });
      if (error) throw error;
      return (salesData || []).map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoice_number || `INV-${sale.id.slice(0, 6)}`,
        clientName: sale.client?.name || 'N/A',
        clientType: sale.client?.client_type || 'local',
        invoiceDate: sale.sale_date,
        totalAmount: Number(sale.total_amount),
        amountPaid: Number(sale.amount_paid || 0),
        balance: Number(sale.total_amount) - Number(sale.amount_paid || 0),
        saltType: sale.salt_type,
        quantity: Number(sale.quantity),
        canBeDelivered: sale.can_be_delivered || false
      })).filter(invoice => invoice.balance > 0);
    }
  });

  const { data: campagnes = [] } = useQuery({
    queryKey: ['campagnes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('campagnes').select('*').order('year', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, campagne:campagnes(name)`)
        .order('transaction_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id, date: t.transaction_date, type: t.transaction_type,
        description: t.description, amount: Number(t.amount),
        account: 'N/A', campagne: t.campagne?.name || null,
        campagnePhase: t.campagne_phase || null
      }));
    }
  });

  const { data: diversEntries = [] } = useQuery({
    queryKey: ['divers-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, journal_entries:journal_entries(*, account:chart_of_accounts(account_number, account_name))`)
        .eq('transaction_type', 'divers' as any)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + Number(acc.balance || 0), 0);

  const { data: monthlyTransactions = [] } = useQuery({
    queryKey: ['monthly-transactions'],
    queryFn: async () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_type, amount')
        .gte('transaction_date', firstDay)
        .lte('transaction_date', lastDay);
      if (error) throw error;
      return data || [];
    }
  });

  const monthlyRevenue = monthlyTransactions
    .filter((t: any) => ['vente_locale', 'vente_export'].includes(t.transaction_type))
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const monthlyExpenses = monthlyTransactions
    .filter((t: any) => ['depense', 'salaire', 'achat'].includes(t.transaction_type))
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const getPaymentMethodsForAccount = (accountId: string) => {
    const account = accounts.find((a: any) => a.id === accountId);
    if (!account) return [];
    if (account.account_type === 'banque') {
      return [
        { value: 'virement', label: 'Virement' },
        { value: 'cheque', label: 'Chèque' },
      ];
    }
    if (account.account_type === 'caisse') {
      return [
        { value: 'especes', label: 'Espèces' },
        { value: 'mobile_money', label: 'Mobile Money' },
      ];
    }
    return [];
  };

  return {
    expenseTypes, expenseTypesLoading,
    employees, dailyWorkers,
    accounts, accountsLoading,
    pendingInvoices, invoicesLoading,
    campagnes,
    recentTransactions, transactionsLoading,
    diversEntries,
    totalBalance,
    monthlyRevenue, monthlyExpenses,
    getPaymentMethodsForAccount,
  };
};
