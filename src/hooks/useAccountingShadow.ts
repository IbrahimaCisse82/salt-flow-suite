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
        .eq("status" as any, "pending")
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
      const { error } = await (supabase as any).rpc("set_posting_mode", { _mode: mode });
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

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["accounting-shadow-entries"] });
    queryClient.invalidateQueries({ queryKey: ["liasse"] });
    queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
  };
  const validate = useMutation({
    mutationFn: async (ids: string[] | null) => {
      const { data, error } = await (supabase as any).rpc("validate_shadow_entries", { _ids: ids });
      if (error) throw error;
      return data as { validated: number };
    },
    onSuccess: (d) => { refresh(); toast.success(`${d.validated} écriture(s) validée(s) et passée(s) au Grand Livre`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      const { data, error } = await (supabase as any).rpc("reject_shadow_entries", { _ids: ids, _reason: reason });
      if (error) throw error;
      return data as { rejected: number };
    },
    onSuccess: (d) => { refresh(); toast.success(`${d.rejected} écriture(s) rejetée(s)`); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    validate,
    reject,
    mode: (config?.posting_mode as PostingMode) ?? "shadow",
    config,
    entries,
    isLoading,
    setMode,
  };
};