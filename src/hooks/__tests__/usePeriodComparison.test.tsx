import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePeriodComparison } from '../usePeriodComparison';
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

vi.mock('@/integrations/supabase/client', async () => {
  const { createSupabaseMock } = await import('@/test/supabaseChainMock');
  return { supabase: createSupabaseMock() };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePeriodComparison', () => {
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

  it('should fetch period comparison for month', async () => {
    const { result } = renderHook(() => usePeriodComparison('month'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comparison).toBeDefined();
  });

  it('should fetch period comparison for week', async () => {
    const { result } = renderHook(() => usePeriodComparison('week'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should fetch period comparison for quarter', async () => {
    const { result } = renderHook(() => usePeriodComparison('quarter'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should fetch period comparison for year', async () => {
    const { result } = renderHook(() => usePeriodComparison('year'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should not fetch without tenant', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: null,
      user: null,
    } as any);

    const { result } = renderHook(() => usePeriodComparison(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comparison).toBeNull();
  });

  it('should default to month period type', async () => {
    const { result } = renderHook(() => usePeriodComparison(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
