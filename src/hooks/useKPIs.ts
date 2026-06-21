// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface KPIData {
  // Production
  totalProduction: number;
  productionObjectif: number;
  productionProgress: number;
  productionByType: Record<string, number>;
  avgYield: number;
  
  // Stocks
  totalStock: number;
  stockByType: Record<string, number>;
  stockRotation: number;
  
  // RH
  totalEmployees: number;
  permanentEmployees: number;
  seasonalEmployees: number;
  dailyWorkers: number;
  totalPayroll: number;
  avgProductivity: number;
  
  // Commercial
  totalSales: number;
  totalRevenue: number;
  avgMargin: number;
  clientCount: number;
  pendingOrders: number;
  deliveredOrders: number;
  
  // Financier
  totalRecettes: number;
  totalDepenses: number;
  resultatNet: number;
  margeNette: number;
  
  // Campagne
  activeCampagne: string | null;
  campagneProgress: number;
  daysRemaining: number;
}

export const useKPIs = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['kpis', profile?.tenant_id],
    queryFn: async (): Promise<KPIData> => {
      if (!profile?.tenant_id) {
        return getEmptyKPIs();
      }

      // Fetch all data in parallel
      const [
        productionResult,
        salesResult,
        employeesResult,
        dailyWorkersResult,
        transactionsResult,
        campagneResult,
        clientsResult
      ] = await Promise.all([
        supabase.from('production_records').select('quantity, salt_type'),
        supabase.from('sales').select('quantity, total_amount, salt_type, sale_status, payment_status'),
        supabase.from('employees').select('id, employee_type, salary, is_active'),
        supabase.from('daily_workers').select('id, daily_rate'),
        supabase.from('transactions').select('amount, transaction_type'),
        supabase.from('campagnes').select('*').eq('status', 'active').limit(1),
        supabase.from('clients').select('id')
      ]);

      // Production
      const production = productionResult.data || [];
      const totalProduction = production.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
      const productionByType = production.reduce((acc, p) => {
        const type = p.salt_type || 'autre';
        acc[type] = (acc[type] || 0) + (Number(p.quantity) || 0);
        return acc;
      }, {} as Record<string, number>);

      // Sales
      const sales = salesResult.data || [];
      const totalSalesQty = sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
      const pendingOrders = sales.filter(s => s.sale_status === 'pending' || s.payment_status === 'pending').length;
      const deliveredOrders = sales.filter(s => s.sale_status === 'delivered' || s.sale_status === 'completed').length;

      // Stock = Production - Ventes
      const totalStock = totalProduction - totalSalesQty;
      const stockByType = Object.keys(productionByType).reduce((acc, type) => {
        const sold = sales.filter(s => s.salt_type === type).reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
        acc[type] = Math.max(0, (productionByType[type] || 0) - sold);
        return acc;
      }, {} as Record<string, number>);

      // Employees
      const employees = employeesResult.data || [];
      const activeEmployees = employees.filter(e => e.is_active);
      const permanentEmployees = activeEmployees.filter(e => e.employee_type === 'permanent').length;
      const seasonalEmployees = activeEmployees.filter(e => e.employee_type === 'saisonnier').length;
      const totalPayroll = activeEmployees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

      // Daily workers
      const dailyWorkers = (dailyWorkersResult.data || []).length;

      // Transactions (financier)
      const transactions = transactionsResult.data || [];
      const totalRecettes = transactions
        .filter(t => ['recette', 'vente_locale', 'vente_export'].includes(t.transaction_type || ''))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalDepenses = transactions
        .filter(t => ['depense', 'achat', 'salaire'].includes(t.transaction_type || ''))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const resultatNet = totalRecettes - totalDepenses;

      // Campagne
      const activeCampagne = campagneResult.data?.[0];
      const productionObjectif = activeCampagne?.target_production || 0;
      const campagneProgress = productionObjectif > 0 
        ? Math.min(100, (totalProduction / productionObjectif) * 100) 
        : 0;

      // Calculate days remaining
      let daysRemaining = 0;
      if (activeCampagne?.end_date) {
        const endDate = new Date(activeCampagne.end_date);
        const today = new Date();
        daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Clients
      const clientCount = (clientsResult.data || []).length;

      return {
        // Production
        totalProduction,
        productionObjectif,
        productionProgress: campagneProgress,
        productionByType,
        avgYield: production.length > 0 ? totalProduction / production.length : 0,
        
        // Stocks
        totalStock: Math.max(0, totalStock),
        stockByType,
        stockRotation: totalStock > 0 ? totalSalesQty / totalStock : 0,
        
        // RH
        totalEmployees: permanentEmployees + seasonalEmployees,
        permanentEmployees,
        seasonalEmployees,
        dailyWorkers,
        totalPayroll,
        avgProductivity: activeEmployees.length > 0 ? totalProduction / activeEmployees.length : 0,
        
        // Commercial
        totalSales: sales.length,
        totalRevenue,
        avgMargin: totalRevenue > 0 ? (resultatNet / totalRevenue) * 100 : 0,
        clientCount,
        pendingOrders,
        deliveredOrders,
        
        // Financier
        totalRecettes,
        totalDepenses,
        resultatNet,
        margeNette: totalRecettes > 0 ? (resultatNet / totalRecettes) * 100 : 0,
        
        // Campagne
        activeCampagne: activeCampagne?.name || null,
        campagneProgress,
        daysRemaining
      };
    },
    enabled: !!profile?.tenant_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
};

function getEmptyKPIs(): KPIData {
  return {
    totalProduction: 0,
    productionObjectif: 0,
    productionProgress: 0,
    productionByType: {},
    avgYield: 0,
    totalStock: 0,
    stockByType: {},
    stockRotation: 0,
    totalEmployees: 0,
    permanentEmployees: 0,
    seasonalEmployees: 0,
    dailyWorkers: 0,
    totalPayroll: 0,
    avgProductivity: 0,
    totalSales: 0,
    totalRevenue: 0,
    avgMargin: 0,
    clientCount: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRecettes: 0,
    totalDepenses: 0,
    resultatNet: 0,
    margeNette: 0,
    activeCampagne: null,
    campagneProgress: 0,
    daysRemaining: 0
  };
}
