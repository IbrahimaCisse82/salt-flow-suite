import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --------------------
// Interface commande
// --------------------
export interface PurchaseOrder {
  id?: string;
  supplier_id: string;
  order_date: string;
  delivery_date: string;
  items: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  status: string;
}

// --------------------
// Hook
// --------------------
export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();

  // 🔹 Lecture commandes
  const { data = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from<PurchaseOrder>("purchase_orders")
        .select(`
          *,
          supplier:supplier_id (
            id,
            name
          )
        `)
        .order("order_date", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  // 🔹 Création commande
  const createPurchaseOrder = useMutation({
    mutationFn: async (order: PurchaseOrder) => {
      const { error } = await supabase
        .from<PurchaseOrder>("purchase_orders")
        .insert([order]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  return {
    purchaseOrders: (data ?? []) as PurchaseOrder[],
    isLoading,
    createPurchaseOrder,
  };
};
