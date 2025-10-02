import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useClients = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['clients', userRole],
    queryFn: async () => {
      // Only commercial staff, managers, and admins can view clients
      const canViewClients = 
        userRole === 'admin' || 
        userRole === 'gerant' || 
        userRole === 'commercial';

      if (!canViewClients) {
        return [];
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};
