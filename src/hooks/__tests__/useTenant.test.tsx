import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTenant } from '../useTenant';
import * as AuthContext from '@/contexts/AuthContext';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', async () => {
  const { createSupabaseMock } = await import('@/test/supabaseChainMock');
  return { supabase: createSupabaseMock() };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tenant details when tenant exists', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      tenant: { id: 'tenant-123', name: 'Test Tenant' },
      profile: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.tenantDetails).toBeDefined();
  });

  it('should return loading state', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      tenant: { id: 'tenant-123', name: 'Test Tenant' },
      profile: null,
      user: null,
      isLoading: true,
    } as any);

    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should provide updateOnboarding function', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      tenant: { id: 'tenant-123', name: 'Test Tenant' },
      profile: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.updateOnboarding).toBe('function');
  });
});
