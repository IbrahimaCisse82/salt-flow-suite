import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePredictiveAnalysis } from '../usePredictiveAnalysis';
import * as AuthContext from '@/contexts/AuthContext';

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

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
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

describe('usePredictiveAnalysis', () => {
  const mockProfile = {
    id: 'user-123',
    tenant_id: 'tenant-123',
    role: 'admin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: mockProfile,
      user: { id: 'user-123' },
    } as any);
  });

  it('should initialize with empty predictions', async () => {
    const { result } = renderHook(() => usePredictiveAnalysis(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.productionPredictions).toEqual([]);
    expect(result.current.salesPredictions).toEqual([]);
  });

  it('should fetch production predictions', async () => {
    const { result } = renderHook(() => usePredictiveAnalysis(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isPredictingProduction).toBe(false);
    });

    expect(result.current.productionPredictions).toBeDefined();
  });

  it('should fetch sales predictions', async () => {
    const { result } = renderHook(() => usePredictiveAnalysis(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isPredictingSales).toBe(false);
    });

    expect(result.current.salesPredictions).toBeDefined();
  });

  it('should not fetch without tenant', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: null,
      user: null,
    } as any);

    const { result } = renderHook(() => usePredictiveAnalysis(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.productionPredictions).toEqual([]);
    expect(result.current.salesPredictions).toEqual([]);
  });

  it('should track loading states separately', async () => {
    const { result } = renderHook(() => usePredictiveAnalysis(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.isPredictingProduction).toBe('boolean');
    expect(typeof result.current.isPredictingSales).toBe('boolean');
  });
});
