import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePendingMutation } from '@/utils/offlineStorage';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface OfflineMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  tableName: string;
  operation: 'insert' | 'update' | 'delete';
  getRecordId?: (variables: TVariables) => string;
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
  onError?: (error: Error, variables: TVariables, context: unknown) => void;
}

/**
 * Hook wrapper pour les mutations qui supporte le mode offline
 * Sauvegarde automatiquement les mutations en local quand offline
 */
export function useOfflineMutation<TData, TVariables>({
  mutationFn,
  tableName,
  operation,
  getRecordId,
  onSuccess,
  onError,
}: OfflineMutationOptions<TData, TVariables>) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isOnline = navigator.onLine;

  return useMutation<TData, Error, TVariables, unknown>({
    mutationFn: async (variables: TVariables) => {
      // Si online, exécuter normalement
      if (isOnline) {
        return mutationFn(variables);
      }

      // Si offline, sauvegarder pour sync plus tard
      logger.info('Offline mutation detected, saving for later sync:', { tableName, operation });

      const recordId = getRecordId ? getRecordId(variables) : undefined;
      
      await savePendingMutation(
        tableName,
        operation,
        { ...variables, recordId },
        profile?.id || '',
        profile?.tenant_id || ''
      );

      // Retourner un objet fictif pour que la mutation "réussisse"
      // Les données seront réellement envoyées lors de la synchro
      return { offline: true } as TData;
    },
    onSuccess: (data, variables, context) => {
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
      // Invalider les queries pour mettre à jour l'UI même en offline
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
    onError: (error, variables, context) => {
      logger.error('Mutation error:', error);
      if (onError) {
        onError(error as Error, variables, context);
      }
    },
  });
}
