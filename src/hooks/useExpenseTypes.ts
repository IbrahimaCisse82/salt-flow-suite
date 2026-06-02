// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";

// Cast to bypass strict typed schema (untyped tables / enum mismatches)
const supabase = _supabase as any;
import { toast } from "@/hooks/use-toast";

export interface ExpenseType {
  id: string;
  tenant_id: string;
  name: string;
  syscohada_category: string;
  account_number: string | null;
  account_id: string | null;
  observations: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseTypeInput {
  name: string;
  syscohada_category: string;
  account_number?: string;
  account_id?: string;
  observations?: string;
  is_active?: boolean;
}

export const useExpenseTypes = () => {
  const queryClient = useQueryClient();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["expense-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_types")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as ExpenseType[];
    },
  });

  const createExpenseType = useMutation({
    mutationFn: async (input: CreateExpenseTypeInput) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant non trouvé");

      const { data, error } = await supabase
        .from("expense_types")
        .insert({
          ...input,
          tenant_id: profile.tenant_id,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      toast({ title: "Type de dépense créé", description: "Le type de dépense a été ajouté avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateExpenseType = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExpenseType> & { id: string }) => {
      const { error } = await supabase
        .from("expense_types")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      toast({ title: "Type de dépense modifié", description: "Les modifications ont été enregistrées" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteExpenseType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      toast({ title: "Type de dépense supprimé" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return {
    expenseTypes: data,
    activeExpenseTypes: data.filter(e => e.is_active),
    isLoading,
    error,
    createExpenseType,
    updateExpenseType,
    deleteExpenseType,
  };
};
