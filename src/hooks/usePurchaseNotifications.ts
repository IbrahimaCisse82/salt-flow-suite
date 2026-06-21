// @ts-nocheck
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useTenantId } from "./useTenantId";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface PurchaseNotification {
   id: string;
   tenant_id: string;
   purchase_order_id: string;
   notification_type: string;
   target_role: string;
   target_user_id: string | null;
   title: string;
   message: string | null;
   amount: number | null;
   is_read: boolean;
   is_actioned: boolean;
   created_at: string;
   purchase_order?: {
     order_number: string;
     supplier?: { name: string } | null;
   };
 }
 
 export const usePurchaseNotifications = () => {
   const queryClient = useQueryClient();
   const tenant_id = useTenantId();
   const { profile } = useAuth();
 
   const { data = [], isLoading, error } = useQuery({
     queryKey: ["purchase-notifications", tenant_id, profile?.role],
     queryFn: async () => {
       if (!tenant_id) return [];
 
       const { data, error } = await supabase
         .from("purchase_notifications")
         .select(`
           *,
           purchase_order:purchase_order_id (
             order_number,
             supplier:supplier_id (name)
           )
         `)
         .eq("tenant_id", tenant_id)
         .eq("is_actioned", false)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return (data ?? []) as PurchaseNotification[];
     },
     enabled: !!tenant_id && !!profile,
   });
 
   const unreadCount = data.filter(n => !n.is_read).length;
 
   const markAsRead = useMutation({
     mutationFn: async (notificationId: string) => {
       const { error } = await supabase
         .from("purchase_notifications")
         .update({ is_read: true, read_at: new Date().toISOString() })
         .eq("id", notificationId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
     },
   });
 
   const markAsActioned = useMutation({
     mutationFn: async (notificationId: string) => {
       const { data: { user } } = await supabase.auth.getUser();
       const { error } = await supabase
         .from("purchase_notifications")
         .update({ 
           is_actioned: true, 
           actioned_at: new Date().toISOString(),
           actioned_by: user?.id
         })
         .eq("id", notificationId);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["purchase-notifications"] });
     },
   });
 
   return {
     notifications: data,
     unreadCount,
     isLoading,
     error,
     markAsRead,
     markAsActioned,
   };
 };