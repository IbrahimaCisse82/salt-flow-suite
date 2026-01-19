// hooks/useSuppliers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Supplier {
  name: string;
  supplier_type: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  // Lecture
  const { data = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await supabase.from("suppliers").select("*").order("name");
      if (res.error) throw res.error;
      return res.data ?? [];
    },
  });

  // Création
  const createSupplier = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      // upprimer l'id si jamais il existe pour éviter conflit avec la base//
      const { id, ...safeSupplier } = supplier as any;

      const res = await supabase.from("suppliers").insert([safeSupplier]);
      if (res.error) throw res.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  return { suppliers: data, isLoading, createSupplier };
};
