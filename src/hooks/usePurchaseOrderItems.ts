 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { PurchaseOrderItemRow, PurchaseOrderItemInsert } from "@/types/database.types";
 
 export type PurchaseOrderItem = PurchaseOrderItemRow;
 
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
 
   // Statistiques de réception
   const receivedCount = data.filter(item => item.is_received).length;
   const totalCount = data.length;
   const allReceived = totalCount > 0 && receivedCount === totalCount;
   const partiallyReceived = receivedCount > 0 && receivedCount < totalCount;
 
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
 
   // Marquer un article comme reçu
   const receiveItem = useMutation({
     mutationFn: async ({ itemId, orderId, notes }: { itemId: string; orderId: string; notes?: string }) => {
       const { data: { user } } = await supabase.auth.getUser();
       
       const { error } = await supabase
         .from("purchase_order_items")
         .update({ 
           is_received: true,
           received_at: new Date().toISOString(),
           received_by: user?.id,
           received_notes: notes
         })
         .eq("id", itemId);
 
       if (error) throw error;
 
       // Vérifier si tous les articles sont reçus
       const { data: items } = await supabase
         .from("purchase_order_items")
         .select("is_received")
         .eq("purchase_order_id", orderId);
 
       const allReceived = items?.every(i => i.is_received);
       const someReceived = items?.some(i => i.is_received);
 
       // Mettre à jour le statut de la commande
       const newStatus = allReceived ? "received" : (someReceived ? "partially_received" : undefined);
       if (newStatus) {
         await supabase
           .from("purchase_orders")
           .update({ 
             status: newStatus,
             received_at: allReceived ? new Date().toISOString() : null,
             received_by: allReceived ? user?.id : null
           })
           .eq("id", orderId);
 
         // Historique
         await supabase.from("purchase_order_history").insert({
           purchase_order_id: orderId,
           action_type: allReceived ? "fully_received" : "partially_received",
           action_by: user?.id,
           new_status: newStatus,
         });
       }
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
     receivedCount,
     totalCount,
     allReceived,
     partiallyReceived,
     createItem,
     updateItem,
     deleteItem,
     receiveItem,
   };
 };
 
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
