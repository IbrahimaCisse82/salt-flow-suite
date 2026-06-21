import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StockMovement {
  id: string;
  item_name: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_of_measure: string;
  reference_type: string | null;
  warehouse: string | null;
  notes: string | null;
  created_at: string;
}

export const useStockMovementsHistory = () => {
  const { profile } = useAuth();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['stock-movements', profile?.tenant_id],
    queryFn: async (): Promise<StockMovement[]> => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading stock movements:', error);
        return [];
      }
      return (data as StockMovement[]) || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  return { movements, isLoading };
};
