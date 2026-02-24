import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FixedAsset {
  id: string;
  tenant_id: string;
  asset_name: string;
  asset_category: string;
  account_number: string;
  acquisition_date: string;
  commissioning_date: string | null;
  acquisition_cost: number;
  residual_value: number;
  useful_life_years: number;
  depreciation_method: string;
  total_depreciated: number;
  net_book_value: number;
  status: string;
  notes: string | null;
  purchase_order_id: string | null;
  disposal_date: string | null;
  disposal_type: string | null;
  disposal_price: number | null;
  disposal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisposalParams {
  asset_id: string;
  disposal_type: "vente" | "rebut" | "don";
  disposal_price?: number;
  disposal_date?: string;
  payment_account_id?: string;
  notes?: string;
}

export const useFixedAssets = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["fixed-assets", profile?.tenant_id],
    queryFn: async (): Promise<FixedAsset[]> => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from("fixed_assets")
        .select("*")
        .order("acquisition_date", { ascending: false });

      if (error) {
        console.error("Error loading fixed assets:", error);
        return [];
      }
      return (data as FixedAsset[]) || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const disposeAsset = useMutation({
    mutationFn: async (params: DisposalParams) => {
      const { data, error } = await supabase.rpc("dispose_fixed_asset", {
        p_asset_id: params.asset_id,
        p_disposal_type: params.disposal_type,
        p_disposal_price: params.disposal_price || 0,
        p_disposal_date: params.disposal_date || new Date().toISOString().split("T")[0],
        p_payment_account_id: params.payment_account_id || null,
        p_notes: params.notes || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      const resultLabel = data.result_type === "plus_value" ? "Plus-value" : "Moins-value";
      toast.success(
        `Cession enregistrée: ${data.asset_name} — ${resultLabel}: ${Number(data.result_amount).toLocaleString()} FCFA`
      );
    },
    onError: (error: Error) => {
      toast.error(`Erreur cession: ${error.message}`);
    },
  });

  const activeAssets = assets.filter((a) => a.status === "active");
  const disposedAssets = assets.filter((a) => a.status === "disposed");

  const totalAcquisition = activeAssets.reduce((s, a) => s + a.acquisition_cost, 0);
  const totalVNC = activeAssets.reduce((s, a) => s + (a.net_book_value || 0), 0);
  const totalAmort = activeAssets.reduce((s, a) => s + (a.total_depreciated || 0), 0);

  return {
    assets,
    activeAssets,
    disposedAssets,
    isLoading,
    disposeAsset,
    totalAcquisition,
    totalVNC,
    totalAmort,
  };
};
