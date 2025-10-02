import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useDailyWorkers = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['daily-workers', userRole],
    queryFn: async () => {
      // Only managers and accountants can view daily workers
      const canViewWorkers = userRole === 'admin' || userRole === 'gerant' || userRole === 'comptable';

      if (!canViewWorkers) {
        return [];
      }

      const { data, error } = await supabase
        .from('daily_workers')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });
};
