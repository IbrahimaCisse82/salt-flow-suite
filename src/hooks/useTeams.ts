import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/useTenantId";
import { useToast } from "@/hooks/use-toast";

// Types alignés sur la DB
export interface TeamMember {
  id: string;
  employee_id: string;
  full_name: string;
  employee_type: string | null;
  role: string | null;
  joined_at: string | null;
}

export interface TeamLeader {
  id: string;
  full_name: string;
  employee_type: string | null;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string | null;
  leader: TeamLeader | null;
  sector: string | null;
  status: string;
  members: TeamMember[];
  production_target: number;
  efficiency_rate: number;
  created_at: string | null;
  updated_at: string | null;
}

// Équipes par défaut pour la production de sel
const DEFAULT_TEAMS = [
  { name: "Préparation des bassins", sector: "preparation", status: "active" },
  { name: "Mise en eau", sector: "mise-en-eau", status: "active" },
  { name: "Évaporation", sector: "evaporation", status: "active" },
  { name: "Récolte", sector: "recolte", status: "active" },
  { name: "Traitement et stockage", sector: "stockage", status: "active" },
];

export const useTeams = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { toast } = useToast();

  // Récupérer les équipes avec leurs membres
  const query = useQuery<Team[]>({
    queryKey: ["teams", tenantId],
    queryFn: async (): Promise<Team[]> => {
      if (!tenantId) return [];

      // Récupérer les équipes (sans jointure pour éviter les problèmes RLS)
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");

      if (teamsError) {
        console.error("Error fetching teams:", teamsError);
        throw teamsError;
      }
      if (!teamsData || teamsData.length === 0) return [];

      // Récupérer les leaders séparément
      const leaderIds = teamsData
        .map(t => t.leader_id)
        .filter((id): id is string => !!id);
      
      let leadersMap: Record<string, TeamLeader> = {};
      if (leaderIds.length > 0) {
        const { data: leadersData } = await supabase
          .from("employees")
          .select("id, full_name, employee_type")
          .in("id", leaderIds);
        
        if (leadersData) {
          leadersData.forEach(l => {
            leadersMap[l.id] = {
              id: l.id,
              full_name: l.full_name,
              employee_type: l.employee_type
            };
          });
        }
      }

      // Récupérer les membres pour toutes les équipes
      const teamIds = teamsData.map(t => t.id);
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("id, team_id, employee_id, role, joined_at")
        .in("team_id", teamIds);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
      }

      // Récupérer les infos employés pour les membres
      const memberEmployeeIds = (membersData || []).map(m => m.employee_id);
      let employeesMap: Record<string, { full_name: string; employee_type: string | null }> = {};
      
      if (memberEmployeeIds.length > 0) {
        const { data: employeesData } = await supabase
          .from("employees")
          .select("id, full_name, employee_type")
          .in("id", memberEmployeeIds);
        
        if (employeesData) {
          employeesData.forEach(e => {
            employeesMap[e.id] = {
              full_name: e.full_name,
              employee_type: e.employee_type
            };
          });
        }
      }

      // Grouper les membres par équipe
      const membersByTeam: Record<string, TeamMember[]> = {};
      (membersData || []).forEach((m) => {
        if (!membersByTeam[m.team_id]) {
          membersByTeam[m.team_id] = [];
        }
        const emp = employeesMap[m.employee_id];
        membersByTeam[m.team_id].push({
          id: m.id,
          employee_id: m.employee_id,
          full_name: emp?.full_name || "Employé inconnu",
          employee_type: emp?.employee_type || null,
          role: m.role,
          joined_at: m.joined_at,
        });
      });

      // Construire les équipes avec leurs membres
      return teamsData.map((team) => ({
        id: team.id,
        name: team.name,
        leader_id: team.leader_id,
        leader: team.leader_id ? leadersMap[team.leader_id] || null : null,
        sector: team.sector,
        status: team.status || "active",
        members: membersByTeam[team.id] || [],
        production_target: Number(team.production_target) || 0,
        efficiency_rate: Number(team.efficiency_rate) || 0,
        created_at: team.created_at,
        updated_at: team.updated_at,
      }));
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Créer une équipe
  const createTeamMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      leader_id?: string | null;
      sector?: string | null;
      status?: string;
      production_target?: number;
    }) => {
      if (!tenantId) throw new Error("tenant_id manquant");

      const { data, error } = await supabase
        .from("teams")
        .insert({
          tenant_id: tenantId,
          name: payload.name,
          leader_id: payload.leader_id ?? null,
          sector: payload.sector ?? null,
          status: payload.status ?? "active",
          production_target: payload.production_target ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Succès", description: "Équipe créée avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de créer l'équipe", variant: "destructive" });
      console.error("Create team error:", error);
    },
  });

  // Mettre à jour une équipe
  const updateTeamMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      leader_id?: string | null;
      sector?: string | null;
      status?: string;
      production_target?: number;
      efficiency_rate?: number;
    }) => {
      const { id, ...updates } = payload;
      const { error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Succès", description: "Équipe mise à jour" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour l'équipe", variant: "destructive" });
      console.error("Update team error:", error);
    },
  });

  // Supprimer une équipe
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Succès", description: "Équipe supprimée" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'équipe", variant: "destructive" });
      console.error("Delete team error:", error);
    },
  });

  // Ajouter un membre à une équipe
  const addMemberMutation = useMutation({
    mutationFn: async (payload: {
      team_id: string;
      employee_id: string;
      role?: string;
    }) => {
      const { error } = await supabase
        .from("team_members")
        .insert({
          team_id: payload.team_id,
          employee_id: payload.employee_id,
          role: payload.role ?? null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Succès", description: "Membre ajouté à l'équipe" });
    },
    onError: (error: Error & { code?: string }) => {
      if (error.code === "23505") {
        toast({ title: "Info", description: "Ce membre fait déjà partie de l'équipe" });
      } else {
        toast({ title: "Erreur", description: "Impossible d'ajouter le membre", variant: "destructive" });
      }
      console.error("Add member error:", error);
    },
  });

  // Retirer un membre d'une équipe
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Succès", description: "Membre retiré de l'équipe" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de retirer le membre", variant: "destructive" });
      console.error("Remove member error:", error);
    },
  });

  // Initialiser les équipes par défaut
  const initializeDefaultTeams = async () => {
    if (!tenantId) return;

    // Vérifier si des équipes existent déjà
    const { data: existingTeams } = await supabase
      .from("teams")
      .select("id")
      .eq("tenant_id", tenantId)
      .limit(1);

    if (existingTeams && existingTeams.length > 0) {
      toast({ title: "Info", description: "Des équipes existent déjà" });
      return;
    }

    // Créer les équipes par défaut
    const teamsToInsert = DEFAULT_TEAMS.map((team) => ({
      tenant_id: tenantId,
      name: team.name,
      sector: team.sector,
      status: team.status,
      production_target: 0,
      efficiency_rate: 0,
    }));

    const { error } = await supabase.from("teams").insert(teamsToInsert);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de créer les équipes par défaut", variant: "destructive" });
      console.error("Initialize teams error:", error);
    } else {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Succès", description: "Équipes par défaut créées avec succès" });
    }
  };

  return {
    teams: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createTeam: createTeamMutation.mutateAsync,
    updateTeam: updateTeamMutation.mutateAsync,
    deleteTeam: deleteTeamMutation.mutateAsync,
    addMember: addMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    initializeDefaultTeams,
    isCreating: createTeamMutation.isPending,
    isUpdating: updateTeamMutation.isPending,
  };
};