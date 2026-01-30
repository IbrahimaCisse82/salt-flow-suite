import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PurchaseOrderItemRow = Database["public"]["Tables"]["purchase_order_items"]["Row"];
type PurchaseOrderItemInsert = Database["public"]["Tables"]["purchase_order_items"]["Insert"];

export interface PurchaseOrderItem extends PurchaseOrderItemRow {}

export interface CreateOrderItemInput {
  purchase_order_id: string;
  item_name: string;
  item_description?: string;
  item_category?: string;
  quantity: number;
  unit_price: number;
  unit_of_measure?: string;
  notes?: string;
}

export const usePurchaseOrderItems = (orderId?: string) => {
  const queryClient = useQueryClient();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["purchase-order-items", orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("purchase_order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PurchaseOrderItem[];
    },
    enabled: !!orderId,
  });

  const createItem = useMutation({
    mutationFn: async (input: CreateOrderItemInput) => {
      const lineTotal = input.quantity * input.unit_price;

      const itemData: PurchaseOrderItemInsert = {
        purchase_order_id: input.purchase_order_id,
        item_name: input.item_name,
        item_description: input.item_description,
        item_category: input.item_category,
        quantity: input.quantity,
        unit_price: input.unit_price,
        unit_of_measure: input.unit_of_measure,
        line_total: lineTotal,
        notes: input.notes,
      };

      const { data, error } = await supabase
        .from("purchase_order_items")
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le total de la commande
      await updateOrderTotal(input.purchase_order_id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items", variables.purchase_order_id] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, orderId, ...updates }: Partial<PurchaseOrderItem> & { id: string; orderId: string }) => {
      const lineTotal = (updates.quantity || 0) * (updates.unit_price || 0);

      const { error } = await supabase
        .from("purchase_order_items")
        .update({ ...updates, line_total: lineTotal })
        .eq("id", id);

      if (error) throw error;

      await updateOrderTotal(orderId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async ({ id, orderId }: { id: string; orderId: string }) => {
      const { error } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await updateOrderTotal(orderId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  return {
    items: data,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
  };
};

// Fonction utilitaire pour recalculer le total de la commande
async function updateOrderTotal(orderId: string) {
  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("line_total")
    .eq("purchase_order_id", orderId);

  const subtotal = items?.reduce((sum, item) => sum + (item.line_total || 0), 0) || 0;

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("tax_amount, discount_amount")
    .eq("id", orderId)
    .single();

  const taxAmount = order?.tax_amount || 0;
  const discountAmount = order?.discount_amount || 0;
  const totalAmount = subtotal + taxAmount - discountAmount;

  await supabase
    .from("purchase_orders")
    .update({ subtotal, total_amount: totalAmount })
    .eq("id", orderId);
}
