import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { BassinRow, BassinInsert, BassinUpdate } from "@/types/database.types";
import { cleanString, ensureNumber } from "@/utils/dataTransformers";

export type BassinStatus = 'active' | 'repos' | 'maintenance';
export type BassinType = 'Bassin 1' | 'Bassin 2' | 'Bassin 3' | 'Bassin 4' | 'Table Salante';

export interface BassinFormData {
  name: string;
  code?: string;
  area?: number | string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
  status?: BassinStatus;
  bassin_type?: BassinType;
}

export const useBassins = () => {
  const { user, profile, tenant } = useAuth();
  const queryClient = useQueryClient();
  const currentTenantId = profile?.tenant_id ?? tenant?.id ?? null;

  const resolveTenantId = async (): Promise<string | null> => {
    if (currentTenantId) return currentTenantId;

    const { data: profilesArray, error } = await supabase
      .rpc('get_profiles_with_roles');

    if (error) {
      console.error('Error refreshing tenant context:', error);
      return null;
    }

    // Find the current user's profile in the returned array
    const refreshedProfile = profilesArray?.find((p: { id: string }) => p.id === user?.id) ?? null;

    return refreshedProfile?.tenant_id ?? null;
  };

  const { data: bassins = [], isLoading } = useQuery({
    queryKey: ['bassins', currentTenantId],
    queryFn: async (): Promise<BassinRow[]> => {
      const tenantId = currentTenantId ?? (await resolveTenantId());
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('bassins')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('name');
      
      if (error) {
        console.error('Error loading bassins:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
    retry: 1
  });

  const createBassinMutation = useOfflineMutation({
    tableName: 'bassins',
    operation: 'insert',
    mutationFn: async (formData: BassinFormData): Promise<BassinRow> => {
      const tenantId = await resolveTenantId();
      if (!tenantId) {
        throw new Error("Tenant ID manquant. Rechargez la page et réessayez.");
      }

      const insertData: BassinInsert & { bassin_type?: string; latitude?: number | null; longitude?: number | null } = {
        tenant_id: tenantId,
        name: formData.name.trim(),
        code: cleanString(formData.code),
        area: ensureNumber(formData.area),
        location: cleanString(formData.location),
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
        is_active: formData.status === 'active',
        status: formData.status || 'repos',
        bassin_type: formData.bassin_type
      };

      const { data, error } = await supabase
        .from('bassins')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bassins'] });
      toast({
        title: "Bassin créé",
        description: navigator.onLine
          ? "Le nouveau bassin a été créé avec succès"
          : "Le bassin sera synchronisé quand vous serez en ligne",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le bassin",
        variant: "destructive"
      });
    }
  });

  const updateBassinMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<BassinFormData>): Promise<BassinRow> => {
      const updateData: BassinUpdate & { bassin_type?: string; latitude?: number | null; longitude?: number | null } = {
        name: updates.name?.trim(),
        code: updates.code !== undefined ? cleanString(updates.code) : undefined,
        area: updates.area !== undefined ? ensureNumber(updates.area) : undefined,
        location: updates.location !== undefined ? cleanString(updates.location) : undefined,
        latitude: (updates as any).latitude !== undefined ? (updates as any).latitude : undefined,
        longitude: (updates as any).longitude !== undefined ? (updates as any).longitude : undefined,
        is_active: updates.status !== undefined ? updates.status === 'active' : updates.is_active,
        status: updates.status,
        bassin_type: (updates as any).bassin_type,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof BassinUpdate] === undefined) {
          delete updateData[key as keyof BassinUpdate];
        }
      });

      const { data, error } = await supabase
        .from('bassins')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bassins'] });
      toast({
        title: "Bassin mis à jour",
        description: "Les modifications ont été enregistrées"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le bassin",
        variant: "destructive"
      });
    }
  });

  const deleteBassinMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('bassins')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bassins'] });
      toast({
        title: "Bassin supprimé",
        description: "Le bassin a été supprimé"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le bassin",
        variant: "destructive"
      });
    }
  });

  return {
    bassins,
    isLoading,
    createBassin: createBassinMutation.mutateAsync,
    isCreating: createBassinMutation.isPending,
    updateBassin: updateBassinMutation.mutateAsync,
    isUpdating: updateBassinMutation.isPending,
    deleteBassin: deleteBassinMutation.mutateAsync,
    isDeleting: deleteBassinMutation.isPending
  };
};
