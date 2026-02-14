 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useTenantId } from "./useTenantId";
 import { useAuth } from "@/contexts/AuthContext";
 import { PurchaseOrderRow, PurchaseOrderInsert, SupplierRow } from "@/types/database.types";
 
 export const ORDER_STATUS = {
   draft: { label: "Brouillon", variant: "secondary" as const, color: "bg-gray-500" },
   pending_approval: { label: "En attente d'approbation", variant: "outline" as const, color: "bg-yellow-500" },
   approved: { label: "Approuvée", variant: "default" as const, color: "bg-blue-500" },
   rejected: { label: "Rejetée", variant: "destructive" as const, color: "bg-red-500" },
   partially_paid: { label: "Partiellement payée", variant: "outline" as const, color: "bg-orange-500" },
   paid: { label: "Payée", variant: "default" as const, color: "bg-green-500" },
   partially_received: { label: "Partiellement reçue", variant: "outline" as const, color: "bg-purple-500" },
   received: { label: "Reçue", variant: "default" as const, color: "bg-green-600" },
   modified: { label: "Modifiée", variant: "outline" as const, color: "bg-amber-500" },
   cancelled: { label: "Annulée", variant: "destructive" as const, color: "bg-red-600" },
 } as const;
 
 export interface PurchaseOrderWithSupplier extends PurchaseOrderRow {
   supplier: Pick<SupplierRow, "id" | "name"> | null;
   creator?: { full_name: string | null } | null;
   approver?: { full_name: string | null } | null;
 }
 
export interface CreatePurchaseOrderInput {
  supplier_id: string;
  order_date?: string;
  expected_delivery_date?: string;
  notes?: string;
  submit_for_approval?: boolean;
  campagne_id?: string;
  campagne_phase?: string;
  expense_category?: string;
  purchase_type?: "charge" | "immobilisation";
  charge_account_number?: string;
  tva_rate?: number;
  invoice_number?: string;
}
 
 const generateOrderNumber = (): string => {
   const date = new Date();
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const day = String(date.getDate()).padStart(2, "0");
   const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
   return `PO-${year}${month}${day}-${random}`;
 };
 
 export const usePurchaseOrders = () => {
   const queryClient = useQueryClient();
   const tenant_id = useTenantId();
   const { profile } = useAuth();
   const userRole = profile?.role;
   const isManager = userRole === "admin" || userRole === "gerant";
 
   const { data = [], isLoading, error } = useQuery({
     queryKey: ["purchaseOrders", tenant_id],
     queryFn: async () => {
       if (!tenant_id) return [];
 
       const { data, error } = await supabase
         .from("purchase_orders")
         .select(`
           *,
           supplier:supplier_id (id, name)
         `)
         .eq("tenant_id", tenant_id)
         .is("deleted_at", null)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return (data ?? []) as PurchaseOrderWithSupplier[];
     },
     enabled: !!tenant_id,
   });
 
   const createPurchaseOrder = useMutation({
     mutationFn: async (input: CreatePurchaseOrderInput) => {
       if (!tenant_id) throw new Error("Tenant ID requis");
 
       const { data: { user } } = await supabase.auth.getUser();
       
       // Si c'est le gérant, la commande est automatiquement approuvée
       const status = isManager 
         ? (input.submit_for_approval ? "approved" : "draft")
         : (input.submit_for_approval ? "pending_approval" : "draft");
 
      const orderData: any = {
        tenant_id,
        order_number: generateOrderNumber(),
        supplier_id: input.supplier_id,
        order_date: input.order_date || new Date().toISOString().split("T")[0],
        expected_delivery_date: input.expected_delivery_date,
        notes: input.notes,
        status,
        created_by: user?.id,
        approved_by: isManager && input.submit_for_approval ? user?.id : null,
        approved_at: isManager && input.submit_for_approval ? new Date().toISOString() : null,
        campagne_id: input.campagne_id || null,
        campagne_phase: input.campagne_phase || null,
        expense_category: input.expense_category || null,
        purchase_type: input.purchase_type || 'charge',
        charge_account_number: input.charge_account_number || null,
        tva_rate: input.tva_rate ?? 18,
        invoice_number: input.invoice_number || null,
      };
 
        // Calculer les montants HT/TVA/TTC après insertion des items
        // (sera mis à jour via updatePurchaseOrder quand les items sont ajoutés)
        const { data, error } = await supabase
          .from("purchase_orders")
          .insert([orderData])
          .select()
          .single();
 
       if (error) throw error;
 
       // Enregistrer dans l'historique
       await supabase.from("purchase_order_history").insert({
         purchase_order_id: data.id,
         action_type: "created",
         action_by: user?.id,
         new_status: status,
         notes: "Commande créée",
       });
 
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
       queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
     },
   });
 
   // Soumettre pour approbation
   const submitForApproval = useMutation({
     mutationFn: async (orderId: string) => {
       const { data: { user } } = await supabase.auth.getUser();
       
       // Si c'est le gérant, approuver directement
       if (isManager) {
         const { error } = await supabase
           .from("purchase_orders")
           .update({ 
             status: "approved",
             approved_by: user?.id,
             approved_at: new Date().toISOString()
           })
           .eq("id", orderId);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from("purchase_orders")
           .update({ status: "pending_approval" })
           .eq("id", orderId);
         if (error) throw error;
       }
 
       await supabase.from("purchase_order_history").insert({
         purchase_order_id: orderId,
         action_type: isManager ? "approved" : "submitted_for_approval",
         action_by: user?.id,
         new_status: isManager ? "approved" : "pending_approval",
       });
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
       queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
     },
   });
 
   // Approuver (gérant uniquement)
   const approveOrder = useMutation({
     mutationFn: async (orderId: string) => {
       const { data: { user } } = await supabase.auth.getUser();
       
       const { data: order } = await supabase
         .from("purchase_orders")
         .select("status, requires_reapproval")
         .eq("id", orderId)
         .single();
 
       const { error } = await supabase
         .from("purchase_orders")
         .update({ 
           status: "approved",
           approved_by: user?.id,
           approved_at: new Date().toISOString(),
           requires_reapproval: false
         })
         .eq("id", orderId);
 
       if (error) throw error;
 
       await supabase.from("purchase_order_history").insert({
         purchase_order_id: orderId,
         action_type: order?.requires_reapproval ? "reapproved" : "approved",
         action_by: user?.id,
         previous_status: order?.status,
         new_status: "approved",
       });
 
       // Marquer notifications comme actionnées
       await supabase
         .from("purchase_notifications")
         .update({ is_actioned: true, actioned_at: new Date().toISOString(), actioned_by: user?.id })
         .eq("purchase_order_id", orderId)
         .in("notification_type", ["approval_request", "order_modified"]);
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
       queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
     },
   });
 
   // Rejeter (gérant uniquement)
   const rejectOrder = useMutation({
     mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
       const { data: { user } } = await supabase.auth.getUser();
       
       const { error } = await supabase
         .from("purchase_orders")
         .update({ 
           status: "rejected",
           rejected_by: user?.id,
           rejected_at: new Date().toISOString(),
           rejection_reason: reason
         })
         .eq("id", orderId);
 
       if (error) throw error;
 
       await supabase.from("purchase_order_history").insert({
         purchase_order_id: orderId,
         action_type: "rejected",
         action_by: user?.id,
         new_status: "rejected",
         notes: reason,
       });
 
       await supabase
         .from("purchase_notifications")
         .update({ is_actioned: true, actioned_at: new Date().toISOString(), actioned_by: user?.id })
         .eq("purchase_order_id", orderId)
         .eq("notification_type", "approval_request");
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
       queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
     },
   });
 
   // Mettre à jour une commande (avec gestion de revalidation si montant change)
   const updatePurchaseOrder = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<PurchaseOrderRow> & { id: string }) => {
       const { data: { user } } = await supabase.auth.getUser();
       
       // Récupérer l'ancienne commande
       const { data: oldOrder } = await supabase
         .from("purchase_orders")
         .select("total_amount, status")
         .eq("id", id)
         .single();
 
       // Si le montant a changé sur une commande approuvée/payée, demander revalidation
       const needsReapproval = oldOrder && 
         updates.total_amount !== undefined &&
         updates.total_amount !== oldOrder.total_amount &&
         ["approved", "partially_paid", "paid"].includes(oldOrder.status);
 
       const finalUpdates = needsReapproval ? {
         ...updates,
         requires_reapproval: true,
         previous_total: oldOrder.total_amount,
         status: "modified"
       } : updates;
 
       const { error } = await supabase
         .from("purchase_orders")
         .update(finalUpdates)
         .eq("id", id);
 
       if (error) throw error;
 
       if (needsReapproval) {
         await supabase.from("purchase_order_history").insert({
           purchase_order_id: id,
           action_type: "modified",
           action_by: user?.id,
           previous_status: oldOrder.status,
           new_status: "modified",
           previous_amount: oldOrder.total_amount,
           new_amount: updates.total_amount,
         });
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
       queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
     },
   });
 
   // Annuler une commande
   const cancelOrder = useMutation({
     mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
       const { data: { user } } = await supabase.auth.getUser();
       
       const { error } = await supabase
         .from("purchase_orders")
         .update({ status: "cancelled" })
         .eq("id", orderId);
 
       if (error) throw error;
 
       await supabase.from("purchase_order_history").insert({
         purchase_order_id: orderId,
         action_type: "cancelled",
         action_by: user?.id,
         new_status: "cancelled",
         notes: reason,
       });
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
     },
   });
 
   // Soft delete
   const deletePurchaseOrder = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("purchase_orders")
         .update({ deleted_at: new Date().toISOString() })
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
     },
   });
 
   return {
     purchaseOrders: data,
     isLoading,
     error,
     isManager,
     userRole,
     createPurchaseOrder,
     submitForApproval,
     approveOrder,
     rejectOrder,
     updatePurchaseOrder,
     cancelOrder,
     deletePurchaseOrder,
   };
 };
