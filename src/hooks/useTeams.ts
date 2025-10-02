import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useTeams = () => {
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          leader:employees!leader_id(id, full_name, position),
          members:team_members(
            id,
            employee:employees(id, full_name, position, employee_type)
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: {
      name: string;
      leader_id?: string;
      sector?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Équipe créée",
        description: "L'équipe a été créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'équipe",
        variant: "destructive"
      });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Équipe mise à jour",
        description: "L'équipe a été mise à jour avec succès",
      });
    }
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (memberData: {
      team_id: string;
      employee_id: string;
      role?: string;
    }) => {
      const { error } = await supabase
        .from('team_members')
        .insert(memberData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Membre ajouté",
        description: "Le membre a été ajouté à l'équipe",
      });
    }
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Membre retiré",
        description: "Le membre a été retiré de l'équipe",
      });
    }
  });

  return {
    teams,
    isLoading,
    createTeam: createTeamMutation.mutateAsync,
    updateTeam: updateTeamMutation.mutateAsync,
    addTeamMember: addTeamMemberMutation.mutateAsync,
    removeTeamMember: removeTeamMemberMutation.mutateAsync,
    isCreating: createTeamMutation.isPending,
    isUpdating: updateTeamMutation.isPending
  };
};
