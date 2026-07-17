import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTraceability = (traceabilityCode?: string, batchNumber?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['traceability', profile?.tenant_id, traceabilityCode, batchNumber],
    queryFn: async () => {
      if (!profile?.tenant_id || (!traceabilityCode && !batchNumber)) return null;

      // Rechercher la production
      let productionQuery = supabase
        .from('production_records')
        .select(`
          *,
          bassin:bassins(id, name, code),
          campagne:campagnes(id, name, year)
        `);

      if (traceabilityCode) {
        productionQuery = productionQuery.eq('traceability_code', traceabilityCode);
      } else if (batchNumber) {
        productionQuery = productionQuery.eq('batch_number', batchNumber);
      }

      const { data: production, error: prodError } = await productionQuery.single();
      
      if (prodError || !production) {
        console.error('Error loading production:', prodError);
        return null;
      }

      // Rechercher les tests qualité
      const { data: qualityTests } = await supabase
        .from('quality_tests')
        .select(`
          *,
          tested_by_profile:profiles!quality_tests_tested_by_fkey(full_name)
        `)
        .eq('production_record_id', production.id)
        .order('test_date', { ascending: false });

      // Rechercher les certificats
      const { data: certificates } = await supabase
        .from('quality_certificates')
        .select(`
          *,
          issued_by_profile:profiles!quality_certificates_issued_by_fkey(full_name)
        `)
        .eq('production_record_id', production.id)
        .order('issue_date', { ascending: false });

      // Rechercher les ventes liées
      let salesQuery = supabase
        .from('sales')
        .select(`
          *,
          client:clients(id, name, client_type)
        `);

      if (traceabilityCode) {
        salesQuery = salesQuery.eq('traceability_code', traceabilityCode);
      } else if (batchNumber) {
        salesQuery = salesQuery.eq('batch_number', batchNumber);
      }

      const { data: sales } = await salesQuery.order('sale_date', { ascending: false });

      return {
        production,
        qualityTests: qualityTests || [],
        certificates: certificates || [],
        sales: sales || []
      };
    },
    enabled: !!profile?.tenant_id && (!!traceabilityCode || !!batchNumber),
    retry: 1
  });
};