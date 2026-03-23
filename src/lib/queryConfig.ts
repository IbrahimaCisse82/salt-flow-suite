/**
 * React Query default configuration with aggressive caching
 * for offline-first PWA support on salt production sites.
 */
import { QueryClient } from '@tanstack/react-query';

/** 30 minutes stale time for reference data */
const STALE_TIME_REFERENCE = 30 * 60 * 1000;
/** 5 minutes for operational data */
const STALE_TIME_OPERATIONAL = 5 * 60 * 1000;
/** 1 hour cache time for reference data */
const GC_TIME_REFERENCE = 60 * 60 * 1000;

/** Reference data query keys that should be cached aggressively */
const REFERENCE_QUERY_KEYS = [
  'clients', 'suppliers', 'accounts', 'chart-of-accounts',
  'expense-types', 'inventory-items', 'employees', 'teams',
  'bassins', 'campagnes', 'tenants',
];

/** Check if a query key matches reference data */
const isReferenceData = (queryKey: readonly unknown[]): boolean => {
  const firstKey = String(queryKey[0] ?? '');
  return REFERENCE_QUERY_KEYS.some(k => firstKey.includes(k));
};

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_OPERATIONAL,
        gcTime: GC_TIME_REFERENCE,
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && 'status' in (error as Record<string, unknown>)) {
            const status = (error as Record<string, unknown>).status as number;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        // When offline, serve from cache without refetching
        networkMode: 'offlineFirst',
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  });

/** Apply aggressive caching to reference data queries */
export const configureReferenceCaching = (queryClient: QueryClient): void => {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'added' && event.query.queryKey) {
      if (isReferenceData(event.query.queryKey)) {
        event.query.setOptions({
          ...event.query.options,
          staleTime: STALE_TIME_REFERENCE,
          gcTime: GC_TIME_REFERENCE,
        });
      }
    }
  });
};
