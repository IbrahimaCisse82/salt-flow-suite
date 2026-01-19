import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cleanString } from "@/utils/dataTransformers";
import { useTenantId } from "@/hooks/useTenantId";
import { toast } from "sonner";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierInsert = Database["public"]["Tables"]["suppliers"]["Insert"];
type SupplierUpdate = Database["public"]["Tables"]["suppliers"]["Update"];

// Interface pour le formulaire (ce que l'utilisateur saisit)
export interface SupplierFormData {
  name: string;
  supplier_type: string;
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

// Transforme les données du formulaire vers le format DB
const transformFormToInsert = (form: SupplierFormData, tenantId: string): SupplierInsert => ({
  tenant_id: tenantId,
  name: form.name.trim(),
  supplier_type: form.supplier_type || 'fournisseur',
  contact_person: cleanString(form.contact_person),
  phone: cleanString(form.phone),
  email: cleanString(form.email),
  address: cleanString(form.address),
  notes: cleanString(form.notes),
  is_active: form.is_active ?? true,
  payment_terms: cleanString(form.payment_terms),
  tax_id: cleanString(form.tax_id),
  registration_number: cleanString(form.registration_number),
  rating: form.rating ?? null,
});

export const useSuppliers = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  // Lecture avec typage strict
  const { data = [], isLoading } = useQuery({
    queryKey: ["suppliers", tenantId],
    queryFn: async (): Promise<SupplierRow[]> => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");
        
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // Création avec typage strict
  const createSupplier = useMutation({
    mutationFn: async (formData: SupplierFormData): Promise<SupplierRow> => {
      if (!tenantId) throw new Error("Tenant ID manquant");
      
      const insertData = transformFormToInsert(formData, tenantId);
      
      const { data, error } = await supabase
        .from("suppliers")
        .insert(insertData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fournisseur créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error("Erreur création fournisseur:", error);
    },
  });

  // Mise à jour avec typage strict
  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<SupplierFormData>): Promise<SupplierRow> => {
      const updateData: SupplierUpdate = {
        name: updates.name?.trim(),
        supplier_type: updates.supplier_type,
        contact_person: updates.contact_person !== undefined ? cleanString(updates.contact_person) : undefined,
        phone: updates.phone !== undefined ? cleanString(updates.phone) : undefined,
        email: updates.email !== undefined ? cleanString(updates.email) : undefined,
        address: updates.address !== undefined ? cleanString(updates.address) : undefined,
        notes: updates.notes !== undefined ? cleanString(updates.notes) : undefined,
        is_active: updates.is_active,
        payment_terms: updates.payment_terms !== undefined ? cleanString(updates.payment_terms) : undefined,
        tax_id: updates.tax_id !== undefined ? cleanString(updates.tax_id) : undefined,
        registration_number: updates.registration_number !== undefined ? cleanString(updates.registration_number) : undefined,
        rating: updates.rating,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([, v]) => v !== undefined)
      ) as SupplierUpdate;
      
      const { data, error } = await supabase
        .from("suppliers")
        .update(cleanedData)
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fournisseur mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Suppression (soft delete via is_active = false car deleted_at n'existe pas)
  const deleteSupplier = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("suppliers")
        .update({ is_active: false })
        .eq("id", id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fournisseur supprimé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { 
    suppliers: data, 
    isLoading, 
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
};
