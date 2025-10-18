import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useDailyWorkers = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['daily-workers', userRole, profile?.tenant_id],
    queryFn: async () => {
      // Only managers and accountants can view daily workers
      const canViewWorkers = userRole === 'admin' || userRole === 'gerant' || userRole === 'comptable';

      if (!canViewWorkers || !profile?.tenant_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('daily_workers')
        .select('*')
        .order('full_name');
      
      if (error) {
        console.error('Error loading daily workers:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};
