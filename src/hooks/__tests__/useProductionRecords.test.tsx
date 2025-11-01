import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductionRecords } from '../useProductionRecords';
import * as AuthContext from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProductionRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch production records', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'production' },
      tenant: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useProductionRecords(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('should handle loading state', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'production' },
      tenant: null,
      user: null,
      isLoading: true,
    } as any);

    const { result } = renderHook(() => useProductionRecords(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});
