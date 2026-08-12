import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PostingMode = "off" | "shadow" | "live";

export interface ShadowEntryLine {
  account: string;
  label?: string;
  debit: number;
  credit: number;
}

export interface ShadowEntry {
  id: string;
  event_type: string;
  entry_date: string;
  journal_code: string;
  description: string | null;
  source_table: string | null;
  source_id: string | null;
  total_amount: number;
  lines: ShadowEntryLine[];
  created_at: string;
}

export const useAccountingShadow = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: config } = useQuery({
    queryKey: ["accounting-config", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_config")
        .select("*")
        .eq("tenant_id", tenantId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["accounting-shadow-entries", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<ShadowEntry[]> => {
      const { data, error } = await supabase
        .from("accounting_shadow_entries")
        .select("*")
        .order("entry_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((e) => ({
        id: e.id,
        event_type: e.event_type,
        entry_date: e.entry_date,
        journal_code: e.journal_code,
        description: e.description,
        source_table: e.source_table,
        source_id: e.source_id,
        total_amount: Number(e.total_amount ?? 0),
        lines: (e.lines as unknown as ShadowEntryLine[]) ?? [],
        created_at: e.created_at,
      }));
    },
  });

  const setMode = useMutation({
    mutationFn: async (mode: PostingMode) => {
      if (!tenantId) throw new Error("Tenant manquant");
      const { error } = await supabase
        .from("accounting_config")
        .upsert(
          {
            tenant_id: tenantId,
            posting_mode: mode,
            activated_at: mode === "live" ? new Date().toISOString() : null,
          },
          { onConflict: "tenant_id" },
        );
      if (error) throw error;
      return mode;
    },
    onSuccess: (mode) => {
      queryClient.invalidateQueries({ queryKey: ["accounting-config"] });
      toast.success(
        mode === "live"
          ? "Comptabilisation automatique activée en réel"
          : mode === "shadow"
            ? "Mode simulation activé"
            : "Comptabilisation automatique désactivée",
      );
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  return {
    mode: (config?.posting_mode as PostingMode) ?? "shadow",
    config,
    entries,
    isLoading,
    setMode,
  };
};