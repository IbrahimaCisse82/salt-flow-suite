import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOfflineSync } from '../useOfflineSync';
import * as AuthContext from '@/contexts/AuthContext';
import * as offlineStorage from '@/utils/offlineStorage';

const waitFor = async (callback: () => void, timeout = 3000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  callback();
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/utils/offlineStorage', () => ({
  initOfflineDB: vi.fn(() => Promise.resolve()),
  getPendingMutations: vi.fn(() => Promise.resolve([])),
  markMutationAsSynced: vi.fn(() => Promise.resolve()),
  deleteSyncedMutation: vi.fn(() => Promise.resolve()),
  getPendingMutationCount: vi.fn(() => Promise.resolve(0)),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-123' },
      profile: { id: 'user-123', tenant_id: 'tenant-123', role: 'admin' },
    } as any);
  });

  it('should detect online status', () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isOnline).toBe(navigator.onLine);
  });

  it('should initialize offline database', async () => {
    renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(offlineStorage.initOfflineDB).toHaveBeenCalled();
    });
  });

  it('should track pending mutation count', async () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it('should provide syncNow function', () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.syncNow).toBe('function');
  });

  it('should not sync when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSyncing).toBe(false);
  });
});
