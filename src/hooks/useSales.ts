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

  // Filtres par statut pour les différents onglets
  const draftSales = sales.filter(s => !s.sale_status || s.sale_status === 'draft');
  const confirmedSales = sales.filter(s => s.sale_status === 'confirmed');
  const invoicedSales = sales.filter(s => ['invoiced', 'delivered', 'completed'].includes(s.sale_status || ''));
  const deliveredSales = sales.filter(s => ['delivered', 'completed'].includes(s.sale_status || ''));

  const createSaleMutation = useOfflineMutation({
    tableName: 'sales',
    operation: 'insert',
    mutationFn: async (saleData: {
      client_id: string;
      campagne_id?: string;
      quantity: number;
      unit_price: number;
      payment_status: string;
      invoice_number?: string;
      notes?: string;
      salt_type?: string;
      discount?: number;
      delivery_date?: string;
      order_number?: string;
      customer_name?: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const subtotal = saleData.quantity * saleData.unit_price;
      const discount = saleData.discount || 0;
      const totalAmount = subtotal - discount;
      
      const { data, error } = await supabase
        .from('sales')
        .insert([{
          client_id: saleData.client_id,
          campagne_id: saleData.campagne_id,
          quantity: saleData.quantity,
          unit_price: saleData.unit_price,
          total_amount: totalAmount,
          payment_status: saleData.payment_status,
          invoice_number: saleData.invoice_number,
          notes: saleData.notes,
          salt_type: saleData.salt_type,
          discount: discount,
          delivery_date: saleData.delivery_date,
          order_number: saleData.order_number,
          customer_name: saleData.customer_name,
          can_be_delivered: false,
          delivered: false,
          sale_status: 'draft', // Nouvelle vente = brouillon
          stock_updated: false, // Sera mis à jour par trigger si confirmé
          tenant_id: profile.tenant_id,
          sale_date: new Date().toISOString().split('T')[0]
        }] as any)
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
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: "Commande mise à jour",
        description: navigator.onLine
          ? "La commande a été mise à jour avec succès"
          : "La mise à jour sera synchronisée quand vous serez en ligne",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la commande",
        variant: "destructive"
      });
    }
  });

  return {
    sales,
    draftSales,
    confirmedSales,
    invoicedSales,
    deliveredSales,
    isLoading,
    createSale: createSaleMutation.mutateAsync,
    updateSale: updateSaleMutation.mutateAsync,
    isCreating: createSaleMutation.isPending,
    isUpdating: updateSaleMutation.isPending
  };
};
