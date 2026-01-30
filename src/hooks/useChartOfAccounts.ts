import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ChartAccount {
  id: string;
  tenant_id: string;
  account_number: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChartAccountInput {
  account_number: string;
  account_name: string;
  account_type: string;
  is_active?: boolean;
}

// Classes SYSCOHADA
export const SYSCOHADA_CLASSES = [
  { value: "1", label: "Classe 1 - Capitaux", description: "Capitaux propres et emprunts" },
  { value: "2", label: "Classe 2 - Immobilisations", description: "Actifs immobilisés" },
  { value: "3", label: "Classe 3 - Stocks", description: "Stocks et en-cours" },
  { value: "4", label: "Classe 4 - Tiers", description: "Créances et dettes" },
  { value: "5", label: "Classe 5 - Trésorerie", description: "Banques et caisses" },
  { value: "6", label: "Classe 6 - Charges", description: "Charges d'exploitation" },
  { value: "7", label: "Classe 7 - Produits", description: "Produits d'exploitation" },
  { value: "8", label: "Classe 8 - Autres", description: "Comptes spéciaux" },
];

export const useChartOfAccounts = () => {
  const queryClient = useQueryClient();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_number");

      if (error) throw error;
      return data as ChartAccount[];
    },
  });

  const createAccount = useMutation({
    mutationFn: async (input: CreateChartAccountInput) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant non trouvé");

      const { data, error } = await supabase
        .from("chart_of_accounts")
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
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast({ title: "Compte créé", description: "Le compte comptable a été ajouté avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChartAccount> & { id: string }) => {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast({ title: "Compte modifié", description: "Les modifications ont été enregistrées" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const toggleAccountStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Filtrer par classe
  const getAccountsByClass = (classNumber: string) => {
    return data.filter(acc => acc.account_number.startsWith(classNumber));
  };

  // Comptes de charges (classe 6)
  const chargeAccounts = data.filter(acc => acc.account_number.startsWith("6") && acc.is_active);

  // Comptes de produits (classe 7)
  const productAccounts = data.filter(acc => acc.account_number.startsWith("7") && acc.is_active);

  // Comptes de trésorerie (classe 5)
  const treasuryAccounts = data.filter(acc => acc.account_number.startsWith("5") && acc.is_active);

  return {
    accounts: data,
    activeAccounts: data.filter(acc => acc.is_active),
    chargeAccounts,
    productAccounts,
    treasuryAccounts,
    isLoading,
    error,
    createAccount,
    updateAccount,
    toggleAccountStatus,
    getAccountsByClass,
    SYSCOHADA_CLASSES,
  };
};
