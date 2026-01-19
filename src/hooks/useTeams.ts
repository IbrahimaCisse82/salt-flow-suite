import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Team, TeamRaw } from "@/types";

// Hook pour récupérer les équipes
export const useTeams = () => {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          supervisor:leader_id (
            id,
            full_name
          ),
          members:employees!team_id (
            id,
            full_name,
            employee_type
          )
        `)
        .order('name');

      if (error) throw error;

      // ✅ Vérification stricte : si data n'existe pas ou n'est pas un tableau, renvoyer tableau vide
      if (!data || !Array.isArray(data)) return [];

      // Map TeamRaw → Team en toute sécurité
      const mappedTeams: Team[] = data.map((team) => {
        return {
          id: team.id ?? '',
          name: team.name ?? '',
          leader_id: team.leader_id ?? null,
          supervisor: Array.isArray(team.supervisor) ? team.supervisor : [],
          sector: team.sector ?? '',
          status: team.status === 'repos' ? 'repos' : 'active',
          members: Array.isArray(team.members) ? team.members : [],
          production_target: team.production_target ?? 0,
          efficiency_rate: team.efficiency_rate ?? 0
        };
      });

      return mappedTeams;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });
};
