import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useQualityTests } from '../useQualityTests';
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

describe('useQualityTests', () => {
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

  it('should fetch quality tests', async () => {
    const { result } = renderHook(() => useQualityTests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.qualityTests).toBeDefined();
  });

  it('should fetch tests for specific production record', async () => {
    const { result } = renderHook(() => useQualityTests('prod-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.qualityTests).toBeDefined();
  });

  it('should provide createTest function', () => {
    const { result } = renderHook(() => useQualityTests(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.createTest).toBe('function');
  });

  it('should provide updateTest function', () => {
    const { result } = renderHook(() => useQualityTests(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.updateTest).toBe('function');
  });

  it('should provide deleteTest function', () => {
    const { result } = renderHook(() => useQualityTests(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.deleteTest).toBe('function');
  });

  it('should track loading states', () => {
    const { result } = renderHook(() => useQualityTests(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it('should not fetch without tenant', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: null,
      user: null,
    } as any);

    const { result } = renderHook(() => useQualityTests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.qualityTests).toBeUndefined();
  });
});
