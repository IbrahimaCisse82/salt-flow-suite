import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("order_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // ✅ Ici on crée la fonction pour créer une commande
  const createPurchaseOrder = useMutation({
    mutationFn: async (order: any) => {
      const { error } = await supabase
        .from("purchase_orders")
        .insert([order]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  return {
    purchaseOrders: data,
    isLoading,
    createPurchaseOrder, // 🔹 Bien le retourner ici
  };
};
