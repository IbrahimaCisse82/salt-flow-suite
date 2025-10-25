import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";

export const useSales = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          client:clients(name, client_type)
        `)
        .order('sale_date', { ascending: false });
      
      if (error) {
        console.error('Error loading sales:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createSaleMutation = useOfflineMutation({
    tableName: 'sales',
    operation: 'insert',
    mutationFn: async (saleData: {
      client_id: string;
      salt_type: string;
      quantity: number;
      unit_price: number;
      discount?: number;
      delivery_date: string;
      payment_status: string;
      notes?: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const totalAmount = (saleData.quantity * saleData.unit_price) - (saleData.discount || 0);
      
      const { data, error } = await supabase
        .from('sales')
        .insert({
          ...saleData,
          tenant_id: profile.tenant_id,
          total_amount: totalAmount,
          sale_date: new Date().toISOString().split('T')[0],
          can_be_delivered: false,
          delivered: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Commande créée",
        description: navigator.onLine 
          ? "La commande a été enregistrée avec succès"
          : "La commande sera synchronisée quand vous serez en ligne",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la commande",
        variant: "destructive"
      });
    }
  });

  const updateSaleMutation = useOfflineMutation({
    tableName: 'sales',
    operation: 'update',
    getRecordId: (data: { id: string; [key: string]: any }) => data.id,
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Commande mise à jour",
        description: navigator.onLine
          ? "La commande a été mise à jour avec succès"
          : "La mise à jour sera synchronisée quand vous serez en ligne",
      });
    }
  });

  return {
    sales,
    isLoading,
    createSale: createSaleMutation.mutateAsync,
    updateSale: updateSaleMutation.mutateAsync,
    isCreating: createSaleMutation.isPending,
    isUpdating: updateSaleMutation.isPending
  };
};
