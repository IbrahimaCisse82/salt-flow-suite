import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTeamAttendance } from '../useTeamAttendance';
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

describe('useTeamAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch attendance records', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'gerant', id: 'user-123' },
      tenant: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useTeamAttendance(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('should handle filters', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'gerant', id: 'user-123' },
      tenant: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useTeamAttendance({ status: 'pending' }), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});
