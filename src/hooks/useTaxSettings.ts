import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Clients hors pays (zone OHADA, hors zone, ancien « export ») : exonérés de TVA, compte 7022. */
export const isForeignClientType = (t?: string | null) =>
  ["export", "zone_ohada", "hors_ohada"].includes((t || "").toLowerCase());

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  local: "Local",
  zone_ohada: "Zone OHADA hors pays",
  hors_ohada: "Hors zone OHADA",
  export: "Export",
  particulier: "Particulier",
};

/** Paramètres fiscaux de l'entreprise (taux de TVA en %, IS, minimum forfaitaire). */
export const useTaxSettings = () =>
  useQuery({
    queryKey: ["tax-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounting_config")
        .select("vat_rate, corporate_tax_rate, minimum_tax_rate, country_code")
        .maybeSingle();
      return {
        vatRate: Number(data?.vat_rate ?? 18),
        corporateTaxRate: Number(data?.corporate_tax_rate ?? 0.3),
        minimumTaxRate: Number(data?.minimum_tax_rate ?? 0.005),
        countryCode: data?.country_code ?? "SN",
      };
    },
    staleTime: 5 * 60 * 1000,
  });
