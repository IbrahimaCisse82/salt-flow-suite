import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cleanString, dateToYYYYMMDD, ensureNumber } from "@/utils/dataTransformers";

export interface CreateProductionRecordInput {
  production_date: string;
  bassin_id: string;
  quantity: number | string | null;
  salt_type: string;
  quality_grade?: string | null;
  traceability_code?: string | null;
  campagne_id?: string | null;
}

export const useProductionRecords = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["production-records", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from("production_records")
        .select("*")
        .order("production_date", { ascending: false });

      if (error) {
        console.error("Error loading production records:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
  });
};

export const useCreateProductionRecord = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductionRecordInput) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const { data, error } = await supabase
        .from("production_records")
        .insert({
          tenant_id: profile.tenant_id,
          salt_type: input.salt_type,
          production_date: dateToYYYYMMDD(input.production_date),
          bassin_id: input.bassin_id,
          quantity: ensureNumber(input.quantity),
          quality_grade: cleanString(input.quality_grade ?? undefined),
          traceability_code: cleanString(input.traceability_code ?? undefined),
          campagne_id: input.campagne_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-records"] });
      toast({
        title: "Récolte enregistrée",
        description: "La récolte a été enregistrée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la récolte",
        variant: "destructive",
      });
    },
  });
};

export const useProductionStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["production-stats", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;

      const { data, error } = await supabase
        .from("production_records")
        .select("quantity");

      if (error) {
        console.error("Error loading production stats:", error);
        return null;
      }

      const totalProduction = data?.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0) || 0;

      return { total: totalProduction, records: data?.length || 0 };
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
  });
};

export const useMonthlyProductionData = (year?: number) => {
  const { profile } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ["monthly-production", profile?.tenant_id, currentYear],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from("production_records")
        .select("production_date, quantity")
        .gte("production_date", `${currentYear}-01-01`)
        .lte("production_date", `${currentYear}-12-31`)
        .order("production_date");

      if (error) return [];

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(currentYear, i).toLocaleDateString("fr-FR", { month: "short" }),
        production: 0,
      }));

      data?.forEach((record) => {
        if (record.production_date) {
          const monthIndex = new Date(record.production_date).getMonth();
          monthlyData[monthIndex].production += Number(record.quantity) || 0;
        }
      });

      return monthlyData;
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
  });
};
