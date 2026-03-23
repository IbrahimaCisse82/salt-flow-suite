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

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_OPERATIONAL,
        gcTime: GC_TIME_REFERENCE,
        retry: (failureCount, error: unknown) => {
          const err = error as { status?: number } | undefined;
          if (err?.status && err.status >= 400 && err.status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        networkMode: 'offlineFirst',
      },
      mutations: {
        networkMode: 'offlineFirst',
      },
    },
  });

/** Reference data query keys that benefit from longer cache */
export const REFERENCE_STALE_TIME = STALE_TIME_REFERENCE;
export const REFERENCE_GC_TIME = GC_TIME_REFERENCE;
