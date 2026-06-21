// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./useTenantId";
import { SupplierRow, SupplierInsert, SupplierUpdate } from "@/types/database.types";

// Export du type Supplier pour utilisation externe
export type Supplier = SupplierRow;

// Interface pour la création de fournisseur
export interface CreateSupplierInput {
  name: string;
  supplier_type?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
  payment_terms?: string;
  tax_id?: string;
  registration_number?: string;
  rating?: number;
}

export const useSuppliers = () => {
  const queryClient = useQueryClient();
  const tenant_id = useTenantId();

  // Lecture des fournisseurs
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["suppliers", tenant_id],
    queryFn: async () => {
      if (!tenant_id) return [];

      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return (data ?? []) as SupplierRow[];
    },
    enabled: !!tenant_id,
  });

  // Création de fournisseur
  const createSupplier = useMutation({
    mutationFn: async (input: CreateSupplierInput) => {
      if (!tenant_id) throw new Error("Tenant ID requis");

      const supplierData: SupplierInsert = {
        tenant_id,
        name: input.name,
        supplier_type: input.supplier_type || "fourniture",
        contact_person: input.contact_person,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes,
        is_active: input.is_active ?? true,
        payment_terms: input.payment_terms,
        tax_id: input.tax_id,
        registration_number: input.registration_number,
        rating: input.rating,
      };

      const { data, error } = await supabase
        .from("suppliers")
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  // Mise à jour de fournisseur
  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: SupplierUpdate & { id: string }) => {
      const { error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  // Désactivation de fournisseur (soft delete)
  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suppliers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  return {
    suppliers: data,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
};
