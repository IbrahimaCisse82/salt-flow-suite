import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useStockStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['stock-stats', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;

      // Calculer le stock = production - ventes
      const [productionResult, salesResult] = await Promise.all([
        supabase
          .from('production_records')
          .select('quantity'),
        supabase
          .from('sales')
          .select('quantity')
      ]);

      if (productionResult.error) {
        console.error('Error loading production:', productionResult.error);
      }
      if (salesResult.error) {
        console.error('Error loading sales:', salesResult.error);
      }

      const totalProduction = productionResult.data?.reduce(
        (sum, record) => sum + (Number(record.quantity) || 0), 
        0
      ) || 0;

      const totalSales = salesResult.data?.reduce(
        (sum, sale) => sum + (Number(sale.quantity) || 0), 
        0
      ) || 0;

      const availableStock = totalProduction - totalSales;

      return {
        available: availableStock,
        production: totalProduction,
        sales: totalSales
      };
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};
