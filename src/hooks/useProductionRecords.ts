// @ts-nocheck
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cleanString, dateToYYYYMMDD, ensureNumber } from "@/utils/dataTransformers";
import { processStockMovement } from "@/lib/domain/stock";

export interface CreateProductionRecordInput {
  production_date: string;
  bassin_id: string;
  quantity: number | string | null;
  salt_type: string;
  quality_grade?: string | null;
  traceability_code?: string | null;
  campagne_id?: string | null;
  team_id?: string | null;
  status?: string | null;
  warehouse_id?: string | null;
}

export const useProductionRecords = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["production-records", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from("production_records")
        .select("*")
        .order("production_date", { ascending: false });

      if (error) {
        console.error("Error loading production records:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
  });
};

export const useCreateProductionRecord = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductionRecordInput) => {
      if (!profile?.tenant_id) {
        throw new Error("Tenant ID manquant");
      }

      const quantity = ensureNumber(input.quantity);
      if (!quantity || quantity <= 0) {
        throw new Error("La quantité doit être supérieure à 0");
      }

      // Backend validation: only Récolte team allowed
      if (input.team_id) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', input.team_id)
          .single();

        if (teamError || !team) {
          throw new Error("Équipe introuvable");
        }
        if (!team.name?.toLowerCase().includes('récolte')) {
          throw new Error("Seule l'équipe 'Récolte' est autorisée pour enregistrer une production");
        }
      }

      // Backend validation: only active Table Salante bassins allowed
      const { data: bassin, error: bassinError } = await supabase
        .from('bassins')
        .select('id, bassin_type, status, is_active')
        .eq('id', input.bassin_id)
        .single();

      if (bassinError || !bassin) {
        throw new Error("Bassin introuvable");
      }
      if (!bassin.is_active || bassin.status !== 'active') {
        throw new Error("Ce bassin n'est pas actif");
      }
      if (bassin.bassin_type !== 'Table Salante') {
        throw new Error("Seuls les bassins de type 'Table Salante' sont autorisés pour la récolte");
      }

      // ── Validation de la capacité de l'entrepôt ──
      if (input.warehouse_id) {
        // Récupérer l'entrepôt (item_category = 'warehouse') pour obtenir sa capacité et son nom
        const { data: warehouse, error: whError } = await supabase
          .from('inventory_items')
          .select('id, item_name, quantity_on_hand')
          .eq('id', input.warehouse_id)
          .eq('item_category', 'warehouse')
          .single();

        if (whError || !warehouse) {
          throw new Error("Entrepôt introuvable");
        }

        const warehouseName = warehouse.item_name;
        const warehouseCapacity = Number(warehouse.quantity_on_hand || 0);

        // Calculer le stock actuel dans cet entrepôt (somme de tous les items production)
        const { data: currentStockItems } = await supabase
          .from('inventory_items')
          .select('quantity_on_hand')
          .eq('tenant_id', profile.tenant_id)
          .eq('item_category', 'production')
          .eq('storage_location', warehouseName)
          .eq('is_active', true);

        const currentStock = (currentStockItems || []).reduce(
          (sum, item) => sum + Number(item.quantity_on_hand || 0), 0
        );

        if (warehouseCapacity > 0 && (currentStock + quantity) > warehouseCapacity) {
          const remaining = Math.max(0, warehouseCapacity - currentStock);
          throw new Error(
            `Capacité insuffisante dans "${warehouseName}": ${remaining.toLocaleString()} tonnes disponibles sur ${warehouseCapacity.toLocaleString()} tonnes`
          );
        }

        // ── Insérer le production_record ──
        const { data: record, error: recordError } = await supabase
          .from("production_records")
          .insert({
            tenant_id: profile.tenant_id,
            salt_type: input.salt_type,
            production_date: dateToYYYYMMDD(input.production_date),
            bassin_id: input.bassin_id,
            quantity: quantity,
            quality_grade: cleanString(input.quality_grade ?? undefined),
            traceability_code: cleanString(input.traceability_code ?? undefined),
            campagne_id: input.campagne_id ?? null,
            team_id: input.team_id ?? null,
            status: cleanString(input.status ?? undefined) || 'completed',
            warehouse_id: input.warehouse_id ?? null,
          })
          .select()
          .single();

        if (recordError) throw recordError;

        // ── Trouver ou créer l'item d'inventaire (type de sel + entrepôt) ──
        const saltTypeName = input.salt_type;
        const { data: existingItems } = await supabase
          .from('inventory_items')
          .select('id, quantity_on_hand')
          .eq('tenant_id', profile.tenant_id)
          .eq('item_name', saltTypeName)
          .eq('item_category', 'production')
          .eq('storage_location', warehouseName)
          .eq('is_active', true)
          .limit(1);

        let inventoryItemId: string;

        if (existingItems && existingItems.length > 0) {
          inventoryItemId = existingItems[0].id;
        } else {
          // Créer un nouvel item d'inventaire pour ce type de sel dans cet entrepôt
          const { data: newItem, error: createError } = await supabase
            .from('inventory_items')
            .insert({
              tenant_id: profile.tenant_id,
              item_name: saltTypeName,
              item_category: 'production',
              quantity_on_hand: 0,
              storage_location: warehouseName,
              unit_of_measure: 'tonnes',
              is_active: true,
            })
            .select()
            .single();

          if (createError) throw createError;
          inventoryItemId = newItem.id;
        }

        // ── Incrémenter le stock via RPC atomique ──
        await processStockMovement({
          itemId: inventoryItemId,
          quantity: quantity,
          movementType: 'entry',
          unitCost: 0,
          warehouseTo: warehouseName,
          referenceType: 'production',
          referenceId: record.id,
          notes: `Récolte ${saltTypeName} - Bassin ${bassin.id}`,
        });

        return record;
      }

      // ── Cas sans entrepôt (ne devrait pas arriver, mais fallback) ──
      const { data, error } = await supabase
        .from("production_records")
        .insert({
          tenant_id: profile.tenant_id,
          salt_type: input.salt_type,
          production_date: dateToYYYYMMDD(input.production_date),
          bassin_id: input.bassin_id,
          quantity: quantity,
          quality_grade: cleanString(input.quality_grade ?? undefined),
          traceability_code: cleanString(input.traceability_code ?? undefined),
          campagne_id: input.campagne_id ?? null,
          team_id: input.team_id ?? null,
          status: cleanString(input.status ?? undefined) || 'completed',
          warehouse_id: input.warehouse_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-records"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      toast({
        title: "Récolte enregistrée",
        description: "La récolte a été enregistrée et le stock mis à jour automatiquement",
      });
    },
    onError: (error: Error) => {
      const message = error?.message || (typeof error === 'string' ? error : "Impossible d'enregistrer la récolte");
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    },
  });
};

export const useProductionStats = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["production-stats", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;

      const { data, error } = await supabase
        .from("production_records")
        .select("quantity");

      if (error) {
        console.error("Error loading production stats:", error);
        return null;
      }

      const totalProduction = data?.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0) || 0;

      return { total: totalProduction, records: data?.length || 0 };
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
  });
};

export const useMonthlyProductionData = (year?: number) => {
  const { profile } = useAuth();
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ["monthly-production", profile?.tenant_id, currentYear],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from("production_records")
        .select("production_date, quantity")
        .gte("production_date", `${currentYear}-01-01`)
        .lte("production_date", `${currentYear}-12-31`)
        .order("production_date");

      if (error) return [];

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(currentYear, i).toLocaleDateString("fr-FR", { month: "short" }),
        production: 0,
      }));

      data?.forEach((record) => {
        if (record.production_date) {
          const monthIndex = new Date(record.production_date).getMonth();
          monthlyData[monthIndex].production += Number(record.quantity) || 0;
        }
      });

      return monthlyData;
    },
    enabled: !!profile?.tenant_id,
    retry: 1,
  });
};
