import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

  const createSaleMutation = useMutation({
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
        description: "La commande a été enregistrée avec succès",
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

  const updateSaleMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
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
