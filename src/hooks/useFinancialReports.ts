import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./useTenantId";
import { useToast } from "./use-toast";
import type { Json } from "@/integrations/supabase/types";

// financial_reports table / generate_balance_sheet RPC pas encore typés dans Supabase
const supabase = _supabase as any;

// Types pour les rapports financiers
export interface BalanceSheetData {
  actif: {
    actif_immobilise: AccountLine[];
    actif_circulant: AccountLine[];
    total: number;
  };
  passif: {
    capitaux_propres: AccountLine[];
    dettes: AccountLine[];
    total: number;
  };
  equilibre: boolean;
  generated_at: string;
}

export interface IncomeStatementData {
  produits: {
    exploitation: AccountLine[];
    financiers: AccountLine[];
    total: number;
  };
  charges: {
    exploitation: AccountLine[];
    financieres: AccountLine[];
    total: number;
  };
  resultats: {
    exploitation: number;
    financier: number;
    net: number;
  };
  generated_at: string;
}

export interface AccountLine {
  account_number: string;
  account_name: string;
  balance: number;
}

export interface FinancialReport {
  id: string;
  tenant_id: string;
  campagne_id?: string;
  report_type: "bilan" | "compte_resultat";
  report_date: string;
  period_start: string;
  period_end: string;
  report_data: BalanceSheetData | IncomeStatementData;
  total_actif?: number;
  total_passif?: number;
  total_produits?: number;
  total_charges?: number;
  resultat_net?: number;
  status: "draft" | "validated" | "closed";
  validated_by?: string;
  validated_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface GenerateReportParams {
  period_start: string;
  period_end: string;
  campagne_id?: string;
}

export const useFinancialReports = () => {
  const queryClient = useQueryClient();
  const tenant_id = useTenantId();
  const { toast } = useToast();

  // Récupérer les rapports existants
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ["financial-reports", tenant_id],
    queryFn: async () => {
      if (!tenant_id) return [];

      const { data, error } = await supabase
        .from("financial_reports")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as FinancialReport[];
    },
    enabled: !!tenant_id,
  });

  // Générer le Bilan (Balance Sheet)
  const generateBalanceSheet = useMutation({
    mutationFn: async (params: GenerateReportParams) => {
      if (!tenant_id) throw new Error("Tenant ID requis");

      // Appeler la fonction PostgreSQL
      const { data: reportData, error: rpcError } = await supabase.rpc(
        "generate_balance_sheet",
        {
          p_tenant_id: tenant_id,
          p_period_start: params.period_start,
          p_period_end: params.period_end,
          p_campagne_id: params.campagne_id || null,
        }
      );

      if (rpcError) throw rpcError;

      const balanceData = reportData as unknown as BalanceSheetData;

      // Sauvegarder le rapport
      const { data, error } = await supabase
        .from("financial_reports")
        .insert([{
          tenant_id,
          report_type: "bilan" as const,
          period_start: params.period_start,
          period_end: params.period_end,
          campagne_id: params.campagne_id || null,
          // `financial_reports.report_data` est typé `Json` côté DB
          report_data: balanceData as unknown as Json,
          total_actif: balanceData.actif.total,
          total_passif: balanceData.passif.total,
          status: "draft" as const,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast({
        title: "Bilan généré",
        description: "Le bilan a été généré et enregistré avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le bilan",
        variant: "destructive",
      });
      console.error("Erreur génération bilan:", error);
    },
  });

  // Générer le Compte de Résultat (Income Statement)
  const generateIncomeStatement = useMutation({
    mutationFn: async (params: GenerateReportParams) => {
      if (!tenant_id) throw new Error("Tenant ID requis");

      // Appeler la fonction PostgreSQL
      const { data: reportData, error: rpcError } = await supabase.rpc(
        "generate_income_statement",
        {
          p_tenant_id: tenant_id,
          p_period_start: params.period_start,
          p_period_end: params.period_end,
          p_campagne_id: params.campagne_id || null,
        }
      );

      if (rpcError) throw rpcError;

      const incomeData = reportData as unknown as IncomeStatementData;

      // Sauvegarder le rapport
      const { data, error } = await supabase
        .from("financial_reports")
        .insert([{
          tenant_id,
          report_type: "compte_resultat" as const,
          period_start: params.period_start,
          period_end: params.period_end,
          campagne_id: params.campagne_id || null,
          // `financial_reports.report_data` est typé `Json` côté DB
          report_data: incomeData as unknown as Json,
          total_produits: incomeData.produits.total,
          total_charges: incomeData.charges.total,
          resultat_net: incomeData.resultats.net,
          status: "draft" as const,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast({
        title: "Compte de résultat généré",
        description: "Le compte de résultat a été généré et enregistré avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le compte de résultat",
        variant: "destructive",
      });
      console.error("Erreur génération compte de résultat:", error);
    },
  });

  // Valider un rapport
  const validateReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Utilisateur non authentifié");

      const { error } = await supabase
        .from("financial_reports")
        .update({
          status: "validated",
          validated_by: user.user.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast({
        title: "Rapport validé",
        description: "Le rapport a été validé avec succès",
      });
    },
  });

  // Supprimer un rapport
  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("financial_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé",
      });
    },
  });

  return {
    reports,
    isLoading,
    error,
    generateBalanceSheet,
    generateIncomeStatement,
    validateReport,
    deleteReport,
  };
};
