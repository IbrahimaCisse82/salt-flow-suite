import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrderRow, PurchaseOrderInsert, PurchaseOrderUpdate } from "@/types/database.types";
import { cleanString, ensureNumber, dateToYYYYMMDD } from "@/utils/dataTransformers";
import { useTenantId } from "@/hooks/useTenantId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Interface pour le formulaire
export interface PurchaseOrderFormData {
  order_number?: string;
  supplier_id?: string;
  order_date?: string;
  expected_delivery_date?: string;
  delivery_date?: string; // Alias pour expected_delivery_date
  status?: string;
  subtotal?: number | string;
  tax_amount?: number | string;
  discount_amount?: number | string;
  total_amount?: number | string;
  notes?: string;
  items?: string;
  quantity?: number | string;
  unit_price?: number | string;
}

// Génère un numéro de commande unique
const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${year}${month}-${random}`;
};

// Transforme les données du formulaire vers le format DB
const transformFormToInsert = (
  form: PurchaseOrderFormData, 
  tenantId: string,
  createdBy?: string
): PurchaseOrderInsert => {
  // Calcul du total si non fourni
  const quantity = ensureNumber(form.quantity) || 0;
  const unitPrice = ensureNumber(form.unit_price) || 0;
  const calculatedTotal = quantity * unitPrice;
  
  return {
    tenant_id: tenantId,
    order_number: form.order_number?.trim() || generateOrderNumber(),
    supplier_id: form.supplier_id || null,
    order_date: dateToYYYYMMDD(form.order_date) || new Date().toISOString().split('T')[0],
    expected_delivery_date: dateToYYYYMMDD(form.expected_delivery_date || form.delivery_date),
    status: form.status || 'draft',
    subtotal: ensureNumber(form.subtotal) ?? calculatedTotal,
    tax_amount: ensureNumber(form.tax_amount),
    discount_amount: ensureNumber(form.discount_amount),
    total_amount: ensureNumber(form.total_amount) ?? calculatedTotal,
    notes: cleanString(form.notes),
    created_by: createdBy || null,
  };
};

export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { profile } = useAuth();

  const { data = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders", tenantId],
    queryFn: async (): Promise<PurchaseOrderRow[]> => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("order_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const createPurchaseOrder = useMutation({
    mutationFn: async (formData: PurchaseOrderFormData): Promise<PurchaseOrderRow> => {
      if (!tenantId) throw new Error("Tenant ID manquant");
      
      const insertData = transformFormToInsert(formData, tenantId, profile?.id);
      
      const { data, error } = await supabase
        .from("purchase_orders")
        .insert(insertData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast.success("Commande créée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error("Erreur création commande:", error);
    },
  });

  const updatePurchaseOrder = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PurchaseOrderFormData>): Promise<PurchaseOrderRow> => {
      const updateData: PurchaseOrderUpdate = {
        supplier_id: updates.supplier_id,
        expected_delivery_date: updates.expected_delivery_date !== undefined 
          ? dateToYYYYMMDD(updates.expected_delivery_date) 
          : undefined,
        status: updates.status,
        subtotal: updates.subtotal !== undefined ? ensureNumber(updates.subtotal) : undefined,
        tax_amount: updates.tax_amount !== undefined ? ensureNumber(updates.tax_amount) : undefined,
        discount_amount: updates.discount_amount !== undefined ? ensureNumber(updates.discount_amount) : undefined,
        total_amount: updates.total_amount !== undefined ? ensureNumber(updates.total_amount) : undefined,
        notes: updates.notes !== undefined ? cleanString(updates.notes) : undefined,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof PurchaseOrderUpdate] === undefined) {
          delete updateData[key as keyof PurchaseOrderUpdate];
        }
      });
      
      const { data, error } = await supabase
        .from("purchase_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast.success("Commande mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deletePurchaseOrder = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ deleted_at: new Date().toISOString() } as PurchaseOrderUpdate)
        .eq("id", id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast.success("Commande supprimée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    purchaseOrders: data,
    isLoading,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
  };
};
