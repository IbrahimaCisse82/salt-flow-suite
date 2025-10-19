import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useProductionRecords = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['production-records', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('production_records')
        .select('*')
        .order('production_date', { ascending: false });
      
      if (error) {
        console.error('Error loading production records:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};

export const useProductionStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['production-stats', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;

      const { data, error } = await supabase
        .from('production_records')
        .select('quantity')
        .order('production_date', { ascending: false });
      
      if (error) {
        console.error('Error loading production stats:', error);
        return null;
      }

      const totalProduction = data?.reduce((sum, record) => sum + (Number(record.quantity) || 0), 0) || 0;
      
      return {
        total: totalProduction,
        records: data?.length || 0
      };
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};

export const useMonthlyProductionData = (year?: number) => {
  const { profile } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['monthly-production', profile?.tenant_id, currentYear],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('production_records')
        .select('production_date, quantity')
        .gte('production_date', `${currentYear}-01-01`)
        .lte('production_date', `${currentYear}-12-31`)
        .order('production_date');
      
      if (error) {
        console.error('Error loading monthly production:', error);
        return [];
      }

      // Grouper par mois
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(currentYear, i).toLocaleDateString('fr-FR', { month: 'short' }),
        production: 0
      }));

      data?.forEach(record => {
        const date = new Date(record.production_date);
        const monthIndex = date.getMonth();
        monthlyData[monthIndex].production += Number(record.quantity) || 0;
      });

      return monthlyData;
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};
