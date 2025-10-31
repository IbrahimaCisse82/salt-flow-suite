import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const usePurchaseOrders = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ['purchase-orders', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name),
          items:purchase_order_items(*)
        `)
        .order('order_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id
  });

  const createOrder = useMutation({
    mutationFn: async (orderData: any) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({ ...orderData, tenant_id: profile?.tenant_id, created_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Commande créée');
    }
  });

  return { purchaseOrders, isLoading, createOrder: createOrder.mutate, isCreating: createOrder.isPending };
};
