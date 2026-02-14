import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useStockStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['stock-stats', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;

      // Use inventory_items as the single source of truth
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('quantity_on_hand, reserved_quantity, item_category')
        .eq('item_category', 'production')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading stock stats:', error);
        return null;
      }

      const totalStock = items?.reduce(
        (sum, item) => sum + (Number(item.quantity_on_hand) || 0),
        0
      ) || 0;

      const totalReserved = items?.reduce(
        (sum, item) => sum + (Number(item.reserved_quantity) || 0),
        0
      ) || 0;

      const availableStock = totalStock - totalReserved;

      return {
        available: availableStock,
        total: totalStock,
        reserved: totalReserved,
        // Backward compatibility
        production: totalStock,
        sales: totalReserved
      };
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};
