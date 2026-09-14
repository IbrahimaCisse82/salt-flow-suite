import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./useTenantId";
import { useToast } from "./use-toast";
import type { Json } from "@/integrations/supabase/types";

// financial_reports / RPC états financiers pas encore typés dans Supabase
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

export interface TafireLine {
  label: string;
  amount: number;
}

export interface TafireData {
  caf?: number;
  flux_activite?: TafireLine[];
  flux_investissement?: TafireLine[];
  flux_financement?: TafireLine[];
  variation_tresorerie?: number;
  tresorerie_ouverture?: number;
  tresorerie_cloture?: number;
  generated_at?: string;
  [key: string]: unknown;
}

export interface AccountLine {
  account_number: string;
  account_name: string;
  balance: number;
}

export type FinancialReportType = "bilan" | "compte_resultat" | "tafire";

export interface FinancialReport {
  id: string;
  tenant_id: string;
  report_type: FinancialReportType;
  period_start: string;
  period_end: string;
  data: BalanceSheetData | IncomeStatementData | TafireData;
  status: "draft" | "validated" | "closed";
  generated_by?: string;
  created_at: string;
  updated_at: string;
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
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as FinancialReport[];
    },
    enabled: !!tenant_id,
  });

  const runReport = async (
    rpcName: string,
    reportType: FinancialReportType,
    params: GenerateReportParams
  ) => {
    if (!tenant_id) throw new Error("Tenant ID requis");

    const { data: reportData, error: rpcError } = await supabase.rpc(rpcName, {
      p_tenant_id: tenant_id,
      p_period_start: params.period_start,
      p_period_end: params.period_end,
      p_campagne_id: params.campagne_id || null,
    });

    if (rpcError) throw rpcError;

    const { data, error } = await supabase
      .from("financial_reports")
      .insert([{
        tenant_id,
        report_type: reportType,
        period_start: params.period_start,
        period_end: params.period_end,
        data: (reportData ?? {}) as unknown as Json,
        status: "draft" as const,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const makeMutation = (
    rpcName: string,
    reportType: FinancialReportType,
    successTitle: string,
    errorTitle: string
  ) =>
    useMutation({
      mutationFn: (params: GenerateReportParams) => runReport(rpcName, reportType, params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
        toast({ title: successTitle, description: "Le rapport a été généré et enregistré avec succès" });
      },
      onError: (err: Error) => {
        toast({ title: errorTitle, description: err.message, variant: "destructive" });
        console.error(errorTitle, err);
      },
    });

  const generateBalanceSheet = makeMutation(
    "generate_balance_sheet",
    "bilan",
    "Bilan généré",
    "Impossible de générer le bilan"
  );

  const generateIncomeStatement = makeMutation(
    "generate_income_statement",
    "compte_resultat",
    "Compte de résultat généré",
    "Impossible de générer le compte de résultat"
  );

  const generateTafire = makeMutation(
    "generate_tafire",
    "tafire",
    "TAFIRE généré",
    "Impossible de générer le TAFIRE"
  );

  // Valider un rapport
  const validateReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("financial_reports")
        .update({ status: "validated" })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast({ title: "Rapport validé", description: "Le rapport a été validé avec succès" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  // Supprimer un rapport
  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("financial_reports")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast({ title: "Rapport supprimé", description: "Le rapport a été supprimé" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  return {
    reports,
    isLoading,
    error,
    generateBalanceSheet,
    generateIncomeStatement,
    generateTafire,
    validateReport,
    deleteReport,
  };
};
