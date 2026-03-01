import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

/**
 * Hook qui écoute en temps réel les événements métier critiques
 * et déclenche des toasts + invalidation de cache automatiques.
 */
export const useRealtimeNotifications = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const handlePurchaseOrderChange = useCallback(
    (payload: any) => {
      const record = payload.new;
      const oldRecord = payload.old;

      // Validation d'un bon de commande
      if (
        payload.eventType === "UPDATE" &&
        oldRecord?.status !== "approved" &&
        record?.status === "approved"
      ) {
        toast.success("Bon de commande validé", {
          description: `BC #${record.order_number || record.id?.slice(0, 8)} a été approuvé`,
          action: { label: "Voir", onClick: () => window.location.assign("/achats") },
        });
      }

      // Réception complète
      if (
        payload.eventType === "UPDATE" &&
        oldRecord?.status !== "received" &&
        record?.status === "received"
      ) {
        toast.info("Réception enregistrée", {
          description: `BC #${record.order_number || record.id?.slice(0, 8)} — réception complète`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    [queryClient]
  );

  const handleTransactionChange = useCallback(
    (payload: any) => {
      const record = payload.new;

      if (payload.eventType === "INSERT") {
        // Ne notifier que les types importants
        const importantTypes = ["vente", "achat", "salaire", "cession"];
        if (importantTypes.includes(record?.transaction_type)) {
          const labels: Record<string, string> = {
            vente: "Nouvelle vente enregistrée",
            achat: "Nouvel achat enregistré",
            salaire: "Paiement salaire enregistré",
            cession: "Cession d'immobilisation",
          };
          toast.info(labels[record.transaction_type] || "Nouvelle transaction", {
            description: `${Number(record.amount || 0).toLocaleString()} FCFA — ${record.description || ""}`.trim(),
          });
        }
      }

      if (payload.eventType === "UPDATE" && record?.is_validated === true) {
        toast.success("Écriture validée", {
          description: `Transaction #${record.reference || record.id?.slice(0, 8)} verrouillée`,
          action: { label: "Grand Livre", onClick: () => window.location.assign("/comptabilite/grand-livre") },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    [queryClient]
  );

  const handleAccountantNotification = useCallback(
    (payload: any) => {
      const record = payload.new;
      if (payload.eventType === "INSERT") {
        toast.warning(record.title, {
          description: record.message || `Montant: ${Number(record.amount || 0).toLocaleString()} FCFA`,
          duration: 8000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["accountant-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
    [queryClient]
  );

  const handleFixedAssetChange = useCallback(
    (payload: any) => {
      const record = payload.new;
      const oldRecord = payload.old;

      if (
        payload.eventType === "UPDATE" &&
        oldRecord?.status === "active" &&
        record?.status === "disposed"
      ) {
        toast.info("Immobilisation cédée", {
          description: `${record.asset_name} — ${record.disposal_type}`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
    },
    [queryClient]
  );

  useEffect(() => {
    if (!profile?.tenant_id) return;

    logger.info("Setting up realtime notifications for tenant:", profile.tenant_id);

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "purchase_orders",
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        handlePurchaseOrderChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        handleTransactionChange
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "accountant_notifications",
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        handleAccountantNotification
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "fixed_assets",
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        handleFixedAssetChange
      )
      .subscribe((status) => {
        logger.info("Realtime notifications channel status:", status);
      });

    return () => {
      logger.info("Removing realtime notifications channel");
      supabase.removeChannel(channel);
    };
  }, [
    profile?.tenant_id,
    handlePurchaseOrderChange,
    handleTransactionChange,
    handleAccountantNotification,
    handleFixedAssetChange,
  ]);
};
