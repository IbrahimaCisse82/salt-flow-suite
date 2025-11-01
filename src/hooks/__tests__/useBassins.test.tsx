import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBassins } from '@/hooks/useBassins';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

vi.mock('@/hooks/useTenantId', () => ({
  useTenantId: () => 'test-tenant-id',
}));

describe('useBassins Hook', () => {
  it('should fetch bassins data', () => {
    const { result } = renderHook(() => useBassins(), {
      wrapper: createWrapper(),
    });

    expect(result.current.bassins).toBeDefined();
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useBassins(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBeDefined();
  });

  it('should provide create mutation', () => {
    const { result } = renderHook(() => useBassins(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createBassin).toBeDefined();
    expect(result.current.isCreating).toBeDefined();
  });
});
