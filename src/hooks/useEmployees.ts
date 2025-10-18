import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useEmployees = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['employees', userRole, profile?.tenant_id],
    queryFn: async () => {
      // Only managers (gérants) and admins can see employee data
      const canViewEmployees = userRole === 'admin' || userRole === 'gerant';

      if (!canViewEmployees || !profile?.tenant_id) {
        // Users without permission or tenant get empty array
        return [];
      }

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');
      
      if (error) {
        console.error('Error loading employees:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });
};

