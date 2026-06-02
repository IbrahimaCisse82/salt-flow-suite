import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./useTenantId";
import { useToast } from "./use-toast";

// cost_per_ton table & calculate_cost_per_ton RPC are not in generated Supabase types yet
const supabase = _supabase as any;

// Types pour le coût de revient
export interface CostPerTonData {
  total_production_kg: number;
  total_production_tons: number;
  cout_main_oeuvre: number;
  cout_matieres_premieres: number;
  cout_energie: number;
  cout_transport: number;
  cout_maintenance: number;
  cout_amortissement: number;
  autres_couts: number;
  cout_total: number;
  cout_par_tonne: number;
  stock_value: number;
  stock_cmp_moyen: number;
  details_par_type: Record<string, {
    production_kg: number;
    production_tons: number;
    cout_estime: number;
    cmp_unitaire: number;
  }>;
  period_start: string;
  period_end: string;
  generated_at: string;
}

export interface CostPerTonRecord {
  id: string;
  tenant_id: string;
  campagne_id?: string;
  calculation_date: string;
  period_start: string;
  period_end: string;
  total_production_kg: number;
  total_production_tons: number;
  cout_main_oeuvre: number;
  cout_matieres_premieres: number;
  cout_energie: number;
  cout_transport: number;
  cout_maintenance: number;
  cout_amortissement: number;
  autres_couts: number;
  cout_total: number;
  cout_par_tonne: number;
  details_par_type: Record<string, any>;
  status: "calculated" | "validated" | "archived";
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CalculateCostParams {
  period_start: string;
  period_end: string;
  campagne_id?: string;
}

export const useCostPerTon = () => {
  const queryClient = useQueryClient();
  const tenant_id = useTenantId();
  const { toast } = useToast();

  // Récupérer les calculs existants
  const { data: costRecords = [], isLoading, error } = useQuery({
    queryKey: ["cost-per-ton", tenant_id],
    queryFn: async () => {
      if (!tenant_id) return [];

      const { data, error } = await supabase
        .from("cost_per_ton")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CostPerTonRecord[];
    },
    enabled: !!tenant_id,
  });

  // Calculer le coût de revient (preview sans sauvegarde)
  const calculateCost = useMutation({
    mutationFn: async (params: CalculateCostParams): Promise<CostPerTonData> => {
      if (!tenant_id) throw new Error("Tenant ID requis");

      const { data, error } = await supabase.rpc("calculate_cost_per_ton", {
        p_tenant_id: tenant_id,
        p_period_start: params.period_start,
        p_period_end: params.period_end,
        p_campagne_id: params.campagne_id || null,
      });

      if (error) throw error;
      return data as unknown as CostPerTonData;
    },
  });

  // Calculer et sauvegarder le coût de revient
  const saveCalculation = useMutation({
    mutationFn: async (params: CalculateCostParams & { notes?: string }) => {
      if (!tenant_id) throw new Error("Tenant ID requis");

      // D'abord calculer
      const { data: costData, error: rpcError } = await supabase.rpc(
        "calculate_cost_per_ton",
        {
          p_tenant_id: tenant_id,
          p_period_start: params.period_start,
          p_period_end: params.period_end,
          p_campagne_id: params.campagne_id || null,
        }
      );

      if (rpcError) throw rpcError;

      const data = costData as unknown as CostPerTonData;

      // Puis sauvegarder
      const { data: saved, error } = await supabase
        .from("cost_per_ton")
        .insert({
          tenant_id,
          campagne_id: params.campagne_id || null,
          period_start: params.period_start,
          period_end: params.period_end,
          total_production_kg: data.total_production_kg,
          cout_main_oeuvre: data.cout_main_oeuvre,
          cout_matieres_premieres: data.cout_matieres_premieres,
          cout_energie: data.cout_energie,
          cout_transport: data.cout_transport,
          cout_maintenance: data.cout_maintenance,
          cout_amortissement: data.cout_amortissement,
          autres_couts: data.autres_couts,
          details_par_type: data.details_par_type,
          notes: params.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-per-ton"] });
      toast({
        title: "Coût de revient enregistré",
        description: "Le calcul du coût de revient a été sauvegardé",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le coût de revient",
        variant: "destructive",
      });
      console.error("Erreur sauvegarde coût:", error);
    },
  });

  // Valider un calcul
  const validateCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cost_per_ton")
        .update({ status: "validated" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-per-ton"] });
      toast({
        title: "Coût validé",
        description: "Le calcul a été validé",
      });
    },
  });

  // Supprimer un calcul
  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cost_per_ton")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-per-ton"] });
      toast({
        title: "Calcul supprimé",
      });
    },
  });

  // Obtenir le dernier coût par tonne
  const latestCostPerTon = costRecords.length > 0 ? costRecords[0].cout_par_tonne : null;

  return {
    costRecords,
    isLoading,
    error,
    calculateCost,
    saveCalculation,
    validateCost,
    deleteCost,
    latestCostPerTon,
  };
};
