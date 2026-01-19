import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Hook pour récupérer les employés avec le nom de leur équipe
export const useEmployees = () => {
  const { profile } = useAuth();
  const userRole = profile?.role;

  return useQuery({
    queryKey: ['employees', userRole, profile?.tenant_id],
    queryFn: async () => {
      // Seuls les admins et gérants peuvent voir les employés
      const canViewEmployees = userRole === 'admin' || userRole === 'gerant';
      if (!canViewEmployees || !profile?.tenant_id) return [];

      // Requête Supabase pour récupérer les employés avec l'équipe associée
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          team:team_id (
            id,
            name
          )
        `)
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