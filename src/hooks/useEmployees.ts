import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useEmployees = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['employees', userRole],
    queryFn: async () => {
      // Managers and accountants can see full employee info including salaries
      const canViewSalary = userRole === 'admin' || userRole === 'gerant' || userRole === 'comptable';

      if (canViewSalary) {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('full_name');
        
        if (error) throw error;
        return data || [];
      } else {
        // Other users see public view without salaries
        const { data, error } = await supabase
          .from('employees_public')
          .select('*')
          .order('full_name');
        
        if (error) throw error;
        return data || [];
      }
    }
  });
};

