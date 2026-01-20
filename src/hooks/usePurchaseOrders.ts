import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./useTenantId";
import type { Database } from "@/integrations/supabase/types";

// Types alignés sur la base de données
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type PurchaseOrderInsert = Database["public"]["Tables"]["purchase_orders"]["Insert"];
type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];

// Type pour les commandes avec relation fournisseur
export interface PurchaseOrderWithSupplier extends PurchaseOrderRow {
  supplier: Pick<SupplierRow, "id" | "name"> | null;
}

// Interface pour la création de commande (simplifié pour le frontend)
export interface CreatePurchaseOrderInput {
  supplier_id: string;
  order_date?: string;
  expected_delivery_date?: string;
  notes?: string;
  status?: string;
}

// Génère un numéro de commande unique
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

  // Lecture des commandes
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["purchaseOrders", tenant_id],
    queryFn: async () => {
      if (!tenant_id) return [];

      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          supplier:supplier_id (
            id,
            name
          )
        `)
        .eq("tenant_id", tenant_id)
        .is("deleted_at", null)
        .order("order_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PurchaseOrderWithSupplier[];
    },
    enabled: !!tenant_id,
  });

  // Création de commande
  const createPurchaseOrder = useMutation({
    mutationFn: async (input: CreatePurchaseOrderInput) => {
      if (!tenant_id) throw new Error("Tenant ID requis");

      const orderData: PurchaseOrderInsert = {
        tenant_id,
        order_number: generateOrderNumber(),
        supplier_id: input.supplier_id,
        order_date: input.order_date || new Date().toISOString().split("T")[0],
        expected_delivery_date: input.expected_delivery_date,
        notes: input.notes,
        status: input.status || "draft",
      };

      const { data, error } = await supabase
        .from("purchase_orders")
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  // Mise à jour de commande
  const updatePurchaseOrder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrderRow> & { id: string }) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  // Suppression (soft delete)
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
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
  };
};
