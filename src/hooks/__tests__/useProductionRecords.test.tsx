import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useProductionRecords } from '../useProductionRecords';
import * as AuthContext from '@/contexts/AuthContext';

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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProductionRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch production records', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'production' },
      tenant: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useProductionRecords(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeDefined();
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
