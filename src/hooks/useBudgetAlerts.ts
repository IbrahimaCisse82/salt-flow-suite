import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BudgetAlert {
  id: string;
  phase: string;
  expense_category: string;
  budgeted_amount: number;
  committed_amount: number;
  engagement_rate: number;
  alert_level: number; // 0=ok, 1=warning (≥80%), 2=danger (≥100%)
  remaining: number;
  campagne_id: string;
}

/**
 * Hook qui interroge la vue budget_commitment_summary
 * et retourne les alertes budgétaires actives.
 */
export const useBudgetAlerts = () => {
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ["budget-alerts", profile?.tenant_id],
    queryFn: async (): Promise<BudgetAlert[]> => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from("budget_commitment_summary")
        .select("*")
        .gt("alert_level", 0)
        .order("alert_level", { ascending: false });

      if (error) {
        console.error("Budget alerts error:", error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: `${row.campagne_id}-${row.phase}-${row.expense_category}`,
        phase: row.phase,
        expense_category: row.expense_category,
        budgeted_amount: Number(row.budgeted_amount) || 0,
        committed_amount: Number(row.committed_amount) || 0,
        engagement_rate: Number(row.engagement_rate) || 0,
        alert_level: Number(row.alert_level) || 0,
        remaining: Number(row.remaining_to_commit) || 0,
        campagne_id: row.campagne_id,
      }));
    },
    enabled: !!profile?.tenant_id,
    refetchInterval: 60_000, // Refresh every minute
  });

  const criticalAlerts = (query.data || []).filter((a) => a.alert_level >= 2);
  const warningAlerts = (query.data || []).filter((a) => a.alert_level === 1);

  return {
    ...query,
    alerts: query.data || [],
    criticalAlerts,
    warningAlerts,
    hasCritical: criticalAlerts.length > 0,
    hasWarning: warningAlerts.length > 0,
  };
};
