import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'campagne';

interface PeriodStats {
  period: string;
  production: number;
  sales: number;
  revenue: number;
  efficiency: number; // Production / Surface des bassins actifs
}

interface ComparisonResult {
  current: PeriodStats;
  previous: PeriodStats;
  change: {
    production: number; // Pourcentage
    sales: number;
    revenue: number;
    efficiency: number;
  };
}

/**
 * Hook pour comparer les performances entre différentes périodes
 */
export const usePeriodComparison = (periodType: PeriodType = 'month') => {
  const { profile } = useAuth();

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['period-comparison', periodType, profile?.tenant_id],
    queryFn: async (): Promise<ComparisonResult | null> => {
      if (!profile?.tenant_id) return null;

      const now = new Date();
      let currentStart: Date;
      let currentEnd: Date;
      let previousStart: Date;
      let previousEnd: Date;

      // Définir les périodes selon le type
      switch (periodType) {
        case 'week':
          currentEnd = now;
          currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousEnd = new Date(currentStart);
          previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        
        case 'month':
          currentEnd = now;
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          previousEnd = new Date(currentStart);
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
          currentEnd = now;
          previousStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
          previousEnd = new Date(currentStart);
          break;
        
        case 'year':
          currentStart = new Date(now.getFullYear(), 0, 1);
          currentEnd = now;
          previousStart = new Date(now.getFullYear() - 1, 0, 1);
          previousEnd = new Date(now.getFullYear() - 1, 11, 31);
          break;
        
        case 'campagne':
          // Récupérer la campagne active
          const { data: activeCampagne } = await supabase
            .from('campagnes')
            .select('start_date, end_date')
            .eq('status', 'active')
            .maybeSingle();
          
          if (!activeCampagne) return null;
          
          currentStart = new Date(activeCampagne.start_date);
          currentEnd = now;
          
          // Période précédente = durée équivalente avant la campagne
          const duration = currentEnd.getTime() - currentStart.getTime();
          previousEnd = new Date(currentStart);
          previousStart = new Date(previousEnd.getTime() - duration);
          break;
      }

      // Récupérer les données de production
      const [currentProduction, previousProduction] = await Promise.all([
        supabase
          .from('production_records')
          .select('quantity')
          .gte('production_date', currentStart.toISOString())
          .lte('production_date', currentEnd.toISOString()),
        supabase
          .from('production_records')
          .select('quantity')
          .gte('production_date', previousStart.toISOString())
          .lte('production_date', previousEnd.toISOString())
      ]);

      // Récupérer les données de ventes
      const [currentSales, previousSales] = await Promise.all([
        supabase
          .from('sales')
          .select('quantity, unit_price')
          .gte('sale_date', currentStart.toISOString())
          .lte('sale_date', currentEnd.toISOString()),
        supabase
          .from('sales')
          .select('quantity, unit_price')
          .gte('sale_date', previousStart.toISOString())
          .lte('sale_date', previousEnd.toISOString())
      ]);

      // Calculer les stats
      const currentProd = currentProduction.data?.reduce((sum, r) => sum + Number(r.quantity || 0), 0) || 0;
      const previousProd = previousProduction.data?.reduce((sum, r) => sum + Number(r.quantity || 0), 0) || 0;
      
      const currentSalesQty = currentSales.data?.reduce((sum, s) => sum + Number(s.quantity || 0), 0) || 0;
      const previousSalesQty = previousSales.data?.reduce((sum, s) => sum + Number(s.quantity || 0), 0) || 0;
      
      const currentRev = currentSales.data?.reduce((sum, s) => 
        sum + (Number(s.quantity || 0) * Number(s.unit_price || 0)), 0
      ) || 0;
      const previousRev = previousSales.data?.reduce((sum, s) => 
        sum + (Number(s.quantity || 0) * Number(s.unit_price || 0)), 0
      ) || 0;

      // Calculer les changements (%)
      const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        current: {
          period: `${currentStart.toLocaleDateString('fr-FR')} - ${currentEnd.toLocaleDateString('fr-FR')}`,
          production: currentProd,
          sales: currentSalesQty,
          revenue: currentRev,
          efficiency: currentProd
        },
        previous: {
          period: `${previousStart.toLocaleDateString('fr-FR')} - ${previousEnd.toLocaleDateString('fr-FR')}`,
          production: previousProd,
          sales: previousSalesQty,
          revenue: previousRev,
          efficiency: previousProd
        },
        change: {
          production: calcChange(currentProd, previousProd),
          sales: calcChange(currentSalesQty, previousSalesQty),
          revenue: calcChange(currentRev, previousRev),
          efficiency: calcChange(currentProd, previousProd)
        }
      };
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
    staleTime: 1000 * 60 * 15 // 15 minutes
  });

  return {
    comparison,
    isLoading
  };
};