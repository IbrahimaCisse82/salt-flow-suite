import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { InventoryItemRow, InventoryItemInsert, InventoryItemUpdate } from "@/types/database.types";
import { cleanString, ensureNumber, dateToYYYYMMDD } from "@/utils/dataTransformers";

export interface InventoryItemFormData {
  item_name: string;
  item_code?: string;
  item_category?: string;
  description?: string;
  quantity_on_hand?: number | string;
  unit_of_measure?: string;
  unit_cost?: number | string;
  reorder_level?: number | string;
  storage_location?: string;
  last_purchase_date?: string;
  last_purchase_price?: number | string;
  notes?: string;
}

export const useInventoryItems = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items', profile?.tenant_id],
    queryFn: async (): Promise<InventoryItemRow[]> => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('is_active', true)
        .order('item_name');
      
      if (error) {
        console.error('Error loading inventory items:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1
  });

  const createItem = useMutation({
    mutationFn: async (formData: InventoryItemFormData): Promise<InventoryItemRow> => {
      if (!profile?.tenant_id) throw new Error("Tenant ID manquant");

      const insertData: InventoryItemInsert = {
        tenant_id: profile.tenant_id,
        item_name: formData.item_name.trim(),
        item_code: cleanString(formData.item_code),
        item_category: cleanString(formData.item_category),
        description: cleanString(formData.description),
        quantity_on_hand: ensureNumber(formData.quantity_on_hand) || 0,
        unit_of_measure: cleanString(formData.unit_of_measure),
        unit_cost: ensureNumber(formData.unit_cost),
        reorder_level: ensureNumber(formData.reorder_level),
        storage_location: cleanString(formData.storage_location),
        last_purchase_date: dateToYYYYMMDD(formData.last_purchase_date),
        last_purchase_price: ensureNumber(formData.last_purchase_price),
        notes: cleanString(formData.notes),
        is_active: true
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success("Article ajouté au stock");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
      console.error("Erreur création article:", error);
    }
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InventoryItemFormData>): Promise<InventoryItemRow> => {
      const updateData: InventoryItemUpdate = {
        item_name: updates.item_name?.trim(),
        item_code: updates.item_code !== undefined ? cleanString(updates.item_code) : undefined,
        item_category: updates.item_category !== undefined ? cleanString(updates.item_category) : undefined,
        description: updates.description !== undefined ? cleanString(updates.description) : undefined,
        quantity_on_hand: updates.quantity_on_hand !== undefined ? ensureNumber(updates.quantity_on_hand) : undefined,
        unit_of_measure: updates.unit_of_measure !== undefined ? cleanString(updates.unit_of_measure) : undefined,
        unit_cost: updates.unit_cost !== undefined ? ensureNumber(updates.unit_cost) : undefined,
        reorder_level: updates.reorder_level !== undefined ? ensureNumber(updates.reorder_level) : undefined,
        storage_location: updates.storage_location !== undefined ? cleanString(updates.storage_location) : undefined,
        last_purchase_date: updates.last_purchase_date !== undefined ? dateToYYYYMMDD(updates.last_purchase_date) : undefined,
        last_purchase_price: updates.last_purchase_price !== undefined ? ensureNumber(updates.last_purchase_price) : undefined,
        notes: updates.notes !== undefined ? cleanString(updates.notes) : undefined,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof InventoryItemUpdate] === undefined) {
          delete updateData[key as keyof InventoryItemUpdate];
        }
      });

      const { data, error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success("Article mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('inventory_items')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success("Article supprimé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Group items by category for stock display
  const stockBySaltType = items
    .filter(item => item.item_category === 'production')
    .reduce((acc, item) => {
      const type = item.item_name || 'Autre';
      acc[type] = (acc[type] || 0) + (item.quantity_on_hand || 0);
      return acc;
    }, {} as Record<string, number>);

  return {
    items,
    stockBySaltType,
    isLoading,
    createItem,
    updateItem,
    deleteItem
  };
};

// Hook for stock movements
export const useStockMovements = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const recordMovement = useMutation({
    mutationFn: async (movement: {
      item_name: string;
      movement_type: 'entry' | 'exit';
      quantity: number;
      date: string;
      warehouse?: string;
      notes?: string;
    }) => {
      if (!profile?.tenant_id) throw new Error("Tenant ID manquant");

      // Find existing item or create new
      const { data: existingItems } = await supabase
        .from('inventory_items')
        .select('id, quantity_on_hand')
        .eq('tenant_id', profile.tenant_id)
        .eq('item_name', movement.item_name)
        .eq('is_active', true)
        .limit(1);

      const currentQty = existingItems?.[0]?.quantity_on_hand || 0;
      const newQty = movement.movement_type === 'entry' 
        ? currentQty + movement.quantity 
        : Math.max(0, currentQty - movement.quantity);

      if (existingItems?.[0]) {
        // Update existing
        const { error } = await supabase
          .from('inventory_items')
          .update({
            quantity_on_hand: newQty,
            updated_at: new Date().toISOString(),
            notes: movement.notes
          })
          .eq('id', existingItems[0].id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('inventory_items')
          .insert({
            tenant_id: profile.tenant_id,
            item_name: movement.item_name,
            item_category: 'production',
            quantity_on_hand: movement.quantity,
            storage_location: movement.warehouse,
            notes: movement.notes,
            unit_of_measure: 'tonnes'
          });

        if (error) throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-by-type'] });
      toast.success("Mouvement de stock enregistré");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  return { recordMovement };
};
