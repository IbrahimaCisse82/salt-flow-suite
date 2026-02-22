 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useTenantId } from "./useTenantId";
 
 export interface PurchasePayment {
   id: string;
   tenant_id: string;
   purchase_order_id: string;
   payment_type: "advance" | "payment" | "refund";
   amount: number;
   payment_method: string;
   payment_date: string;
   account_id: string | null;
   processed_by: string | null;
   notes: string | null;
   transaction_id: string | null;
   created_at: string;
   purchase_order?: {
     order_number: string;
     supplier?: { name: string } | null;
   };
 }
 
 export interface CreatePaymentInput {
   purchase_order_id: string;
   payment_type: "advance" | "payment" | "refund";
   amount: number;
   payment_method: string;
   payment_date: string;
   account_id?: string;
   notes?: string;
 }
 
 export const usePurchasePayments = (orderId?: string) => {
   const queryClient = useQueryClient();
   const tenant_id = useTenantId();
 
   const { data = [], isLoading, error } = useQuery({
     queryKey: ["purchase-payments", orderId],
     queryFn: async () => {
       if (!orderId) return [];
 
       const { data, error } = await supabase
         .from("purchase_payments")
         .select("*")
         .eq("purchase_order_id", orderId)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as PurchasePayment[];
     },
     enabled: !!orderId,
   });
 
    const createPayment = useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      if (!tenant_id) throw new Error("Tenant ID requis");

      const { data: { user } } = await supabase.auth.getUser();

      // 1. Créer le paiement (le trigger DB gère les écritures comptables et le solde)
      const { data: payment, error } = await supabase
        .from("purchase_payments")
        .insert({
          tenant_id,
          purchase_order_id: input.purchase_order_id,
          payment_type: input.payment_type,
          amount: input.amount,
          payment_method: input.payment_method,
          payment_date: input.payment_date,
          account_id: input.account_id,
          notes: input.notes,
          processed_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. total_paid et status sont mis à jour par le trigger DB (trg_handle_purchase_payment)

      // 3. Marquer les notifications comme actionnées
      await supabase
        .from("purchase_notifications")
        .update({ is_actioned: true, actioned_at: new Date().toISOString(), actioned_by: user?.id })
        .eq("purchase_order_id", input.purchase_order_id)
        .in("notification_type", ["advance_request", "additional_payment", "refund_required"]);

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-payments"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
 
   return {
     payments: data,
     isLoading,
     error,
     createPayment,
   };
 };