import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ValuationLayer {
  id: string;
  tenant_id: string;
  inventory_item_id: string;
  movement_type: "entry" | "exit";
  source_type: string;
  reference_id: string | null;
  quantity: number;
  unit_cost: number;
  total_value: number;
  remaining_quantity: number;
  layer_date: string;
  notes: string | null;
  created_at: string;
}

export interface ValuationSnapshot {
  id: string;
  tenant_id: string;
  snapshot_date: string;
  inventory_item_id: string;
  quantity_on_hand: number;
  cmp: number;
  total_value: number;
  created_at: string;
}

export const useInventoryValuation = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: layers = [], isLoading: layersLoading } = useQuery({
    queryKey: ["inventory-valuation-layers", profile?.tenant_id],
    queryFn: async (): Promise<ValuationLayer[]> => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from("inventory_valuation_layers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Error loading valuation layers:", error);
        return [];
      }
      return (data as ValuationLayer[]) || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ["inventory-valuation-snapshots", profile?.tenant_id],
    queryFn: async (): Promise<ValuationSnapshot[]> => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from("inventory_valuation_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(50);
      if (error) {
        console.error("Error loading valuation snapshots:", error);
        return [];
      }
      return (data as ValuationSnapshot[]) || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const createSnapshot = useMutation({
    mutationFn: async (snapshotDate?: string) => {
      if (!profile?.tenant_id) throw new Error("Tenant ID manquant");
      const { data, error } = await supabase.rpc("create_valuation_snapshot", {
        p_tenant_id: profile.tenant_id,
        p_snapshot_date: snapshotDate || new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-valuation-snapshots"] });
      toast.success(`Snapshot créé: ${count} articles valorisés`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const addValuationEntry = useMutation({
    mutationFn: async (entry: {
      inventory_item_id: string;
      movement_type: "entry" | "exit";
      source_type: string;
      quantity: number;
      unit_cost: number;
      layer_date?: string;
      reference_id?: string;
      notes?: string;
    }) => {
      if (!profile?.tenant_id) throw new Error("Tenant ID manquant");
      const { data, error } = await supabase
        .from("inventory_valuation_layers")
        .insert({
          tenant_id: profile.tenant_id,
          ...entry,
          layer_date: entry.layer_date || new Date().toISOString().split("T")[0],
          remaining_quantity: entry.movement_type === "entry" ? entry.quantity : 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-valuation-layers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur valorisation: ${error.message}`);
    },
  });

  return {
    layers,
    snapshots,
    isLoading: layersLoading || snapshotsLoading,
    createSnapshot,
    addValuationEntry,
  };
};
