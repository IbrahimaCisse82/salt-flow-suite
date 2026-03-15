import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  initOfflineDB,
  getPendingMutations,
  markMutationAsSynced,
  deleteSyncedMutation,
  getPendingMutationCount,
} from '@/utils/offlineStorage';
import { logger } from '@/utils/logger';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Use refs to avoid stale closures in event handlers
  const isSyncingRef = useRef(isSyncing);
  isSyncingRef.current = isSyncing;
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const userRef = useRef(user);
  userRef.current = user;

  // Mettre à jour le compteur de mutations en attente
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingMutationCount();
      setPendingCount(count);
    } catch (error) {
      logger.error('Failed to update pending count:', error);
    }
  }, []);

  // Synchroniser les mutations en attente
  const syncPendingMutations = useCallback(async () => {
    if (!isOnlineRef.current || !userRef.current || isSyncingRef.current) return;

    setIsSyncing(true);
    try {
      const mutations = await getPendingMutations();
      logger.info(`Syncing ${mutations.length} pending mutations`);

      let successCount = 0;
      let errorCount = 0;

      for (const mutation of mutations) {
        try {
          // Vérifier que la mutation appartient à l'utilisateur actuel
          if (mutation.userId !== userRef.current!.id) {
            logger.warn('Skipping mutation from different user:', mutation.id);
            await deleteSyncedMutation(mutation.id);
            continue;
          }

          // Exécuter la mutation
          switch (mutation.operation) {
            case 'insert':
              await supabase
                .from(mutation.tableName as any)
                .insert(mutation.data);
              break;

            case 'update':
              await supabase
                .from(mutation.tableName as any)
                .update(mutation.data)
                .eq('id', mutation.data.id);
              break;

            case 'delete':
              await supabase
                .from(mutation.tableName as any)
                .delete()
                .eq('id', mutation.data.id);
              break;
          }

          // Marquer comme synchronisée et supprimer
          await markMutationAsSynced(mutation.id);
          await deleteSyncedMutation(mutation.id);
          successCount++;

          logger.info('Synced mutation:', mutation.id);
        } catch (error) {
          logger.error('Failed to sync mutation:', { mutation, error });
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Synchronisation réussie',
          description: `${successCount} modification(s) synchronisée(s)`,
        });

        // Invalider toutes les requêtes pour rafraîchir les données
        queryClient.invalidateQueries();
      }

      if (errorCount > 0) {
        toast({
          title: 'Erreurs de synchronisation',
          description: `${errorCount} modification(s) n'ont pas pu être synchronisées`,
          variant: 'destructive',
        });
      }

      await updatePendingCount();
    } catch (error) {
      logger.error('Sync failed:', error);
      toast({
        title: 'Erreur de synchronisation',
        description: 'Impossible de synchroniser les modifications',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast, queryClient, updatePendingCount]);

  // Surveiller le statut de la connexion
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      logger.warn('Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialiser la base de données offline
    initOfflineDB().catch((error) => {
      logger.error('Failed to init offline DB:', error);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toast on connectivity changes
  useEffect(() => {
    // Skip initial render
    if (isOnline) {
      // Don't toast on mount
    }
  }, [isOnline]);

  // Synchroniser automatiquement quand en ligne
  useEffect(() => {
    if (isOnline && user) {
      updatePendingCount();
      syncPendingMutations();
    }
  }, [isOnline, user, syncPendingMutations, updatePendingCount]);

  // Synchroniser périodiquement
  useEffect(() => {
    if (!isOnline || !user) return;

    const interval = setInterval(() => {
      updatePendingCount();
      syncPendingMutations();
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [isOnline, user, syncPendingMutations, updatePendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow: syncPendingMutations,
  };
};
