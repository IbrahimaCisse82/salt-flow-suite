import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/useTenantId";
import type { Team } from "@/types";


// Hook pour récupérer + gérer les équipes
export const useTeams = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const query = useQuery<Team[]>({
    queryKey: ["teams", tenantId],
    queryFn: async (): Promise<Team[]> => {

      const { data, error } = await supabase
        .from("teams")
        .select(
          `
          *,
          supervisor:leader_id (
            id,
            full_name,
            employee_type
          ),
          members:employees!team_id (
            id,
            full_name,
            employee_type
          )
        `
        )
        .order("name");

      if (error) throw error;
      if (!data || !Array.isArray(data)) return [];

      // Normalisation défensive (relations parfois null)
      return data.map((team: any) => ({
        id: team.id ?? "",
        name: team.name ?? "",
        leader_id: team.leader_id ?? null,
        supervisor: Array.isArray(team.supervisor) ? team.supervisor : team.supervisor ? [team.supervisor] : [],
        sector: team.sector ?? "",
        status: team.status ?? "active",
        members: Array.isArray(team.members) ? team.members : team.members ? [team.members] : [],
        production_target: team.production_target ?? 0,
        efficiency_rate: team.efficiency_rate ?? 0,
      })) as Team[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (payload: { name: string; leader_id?: string | null; sector?: string; status?: string }) => {
      if (!tenantId) throw new Error("tenant_id manquant");

      const { error } = await supabase.from("teams").insert([
        {
          tenant_id: tenantId,
          name: payload.name,
          leader_id: payload.leader_id ?? null,
          sector: (payload.sector ?? null) as any,
          status: payload.status ?? "active",
        } as any,
      ]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });


  const updateTeamMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string; leader_id?: string | null; sector?: string | null; status?: string | null }) => {
      const { id, ...updates } = payload;
      const { error } = await supabase.from("teams").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  return {
    teams: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    // fonctions attendues par le front existant
    createTeam: (payload: Parameters<typeof createTeamMutation.mutateAsync>[0]) => createTeamMutation.mutateAsync(payload),
    updateTeam: (payload: Parameters<typeof updateTeamMutation.mutateAsync>[0]) => updateTeamMutation.mutateAsync(payload),
    query,
  };
};
