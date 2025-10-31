import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useSuppliers = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id
  });

  const createSupplier = useMutation({
    mutationFn: async (supplierData: any) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ ...supplierData, tenant_id: profile?.tenant_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur créé');
    }
  });

  return { suppliers, isLoading, createSupplier: createSupplier.mutate, isCreating: createSupplier.isPending };
};
