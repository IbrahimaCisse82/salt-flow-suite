import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from './logger';

interface OfflineDBSchema extends DBSchema {
  'pending-mutations': {
    key: string;
    value: {
      id: string;
      timestamp: number;
      tableName: string;
      operation: 'insert' | 'update' | 'delete';
      data: any;
      userId: string;
      tenantId: string;
      synced: boolean;
    };
    indexes: {
      synced: number;
      timestamp: number;
    };
  };
  'cached-data': {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      expiresAt: number;
    };
    indexes: {
      expiresAt: number;
    };
  };
}

let db: IDBPDatabase<OfflineDBSchema> | null = null;

/**
 * Initialise la base de données IndexedDB pour le mode hors ligne
 */
export async function initOfflineDB(): Promise<void> {
  try {
    db = await openDB<OfflineDBSchema>('gsuite-offline-db', 1, {
      upgrade(db) {
        // Store pour les mutations en attente de synchronisation
        if (!db.objectStoreNames.contains('pending-mutations')) {
          const mutationStore = db.createObjectStore('pending-mutations', {
            keyPath: 'id',
          });
          mutationStore.createIndex('synced', 'synced');
          mutationStore.createIndex('timestamp', 'timestamp');
        }

        // Store pour les données en cache
        if (!db.objectStoreNames.contains('cached-data')) {
          const cacheStore = db.createObjectStore('cached-data', {
            keyPath: 'key',
          });
          cacheStore.createIndex('expiresAt', 'expiresAt');
        }
      },
    });
    logger.info('Offline database initialized');
  } catch (error) {
    logger.error('Failed to initialize offline database:', error);
    throw error;
  }
}

/**
 * Sauvegarde une mutation en attente de synchronisation
 */
export async function savePendingMutation(
  tableName: string,
  operation: 'insert' | 'update' | 'delete',
  data: any,
  userId: string,
  tenantId: string
): Promise<string> {
  if (!db) await initOfflineDB();

  const id = `${tableName}-${operation}-${Date.now()}-${Math.random()}`;
  const mutation = {
    id,
    timestamp: Date.now(),
    tableName,
    operation,
    data,
    userId,
    tenantId,
    synced: false,
  };

  await db!.put('pending-mutations', mutation);
  logger.info('Saved pending mutation:', { id, tableName, operation });
  return id;
}

/**
 * Récupère toutes les mutations en attente
 */
export async function getPendingMutations() {
  if (!db) await initOfflineDB();

  const tx = db!.transaction('pending-mutations', 'readonly');
  const store = tx.objectStore('pending-mutations');
  const index = store.index('synced');
  const mutations = await index.getAll(IDBKeyRange.only(0));
  await tx.done;
  
  return mutations.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Marque une mutation comme synchronisée
 */
export async function markMutationAsSynced(id: string): Promise<void> {
  if (!db) await initOfflineDB();

  const mutation = await db!.get('pending-mutations', id);
  if (mutation) {
    mutation.synced = true;
    await db!.put('pending-mutations', mutation);
    logger.info('Marked mutation as synced:', id);
  }
}

/**
 * Supprime une mutation synchronisée
 */
export async function deleteSyncedMutation(id: string): Promise<void> {
  if (!db) await initOfflineDB();
  await db!.delete('pending-mutations', id);
  logger.info('Deleted synced mutation:', id);
}

/**
 * Sauvegarde des données en cache
 */
export async function cacheData(
  key: string,
  data: any,
  ttlMinutes: number = 60
): Promise<void> {
  if (!db) await initOfflineDB();

  const cached = {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  };

  await db!.put('cached-data', cached);
  logger.info('Cached data:', { key, ttl: ttlMinutes });
}

/**
 * Récupère des données du cache
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!db) await initOfflineDB();

  const cached = await db!.get('cached-data', key);
  if (!cached) return null;

  // Vérifier si le cache a expiré
  if (Date.now() > cached.expiresAt) {
    await db!.delete('cached-data', key);
    logger.info('Cache expired:', key);
    return null;
  }

  logger.info('Retrieved cached data:', key);
  return cached.data as T;
}

/**
 * Nettoie les données en cache expirées
 */
export async function cleanExpiredCache(): Promise<void> {
  if (!db) await initOfflineDB();

  const now = Date.now();
  const allCached = await db!.getAll('cached-data');
  
  let deletedCount = 0;
  for (const cached of allCached) {
    if (cached.expiresAt < now) {
      await db!.delete('cached-data', cached.key);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    logger.info(`Cleaned ${deletedCount} expired cache entries`);
  }
}

/**
 * Nettoie toutes les données hors ligne (pour la déconnexion)
 */
export async function clearOfflineData(): Promise<void> {
  if (!db) await initOfflineDB();

  await db!.clear('pending-mutations');
  await db!.clear('cached-data');
  logger.info('Cleared all offline data');
}

/**
 * Compte le nombre de mutations en attente
 */
export async function getPendingMutationCount(): Promise<number> {
  if (!db) await initOfflineDB();

  const tx = db!.transaction('pending-mutations', 'readonly');
  const store = tx.objectStore('pending-mutations');
  const index = store.index('synced');
  const count = await index.count(IDBKeyRange.only(0));
  await tx.done;
  
  return count;
}
