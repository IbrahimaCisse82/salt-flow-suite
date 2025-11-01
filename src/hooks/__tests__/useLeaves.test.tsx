import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeaves } from '../useLeaves';
import * as AuthContext from '@/contexts/AuthContext';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase client
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
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLeaves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return leaves list', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'admin', id: 'user-123' },
      tenant: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useLeaves(), {
      wrapper: createWrapper(),
    });

    expect(result.current.leaves).toBeDefined();
    expect(Array.isArray(result.current.leaves)).toBe(true);
  });

  it('should provide CRUD functions', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: { tenant_id: 'tenant-123', role: 'admin', id: 'user-123' },
      tenant: null,
      user: null,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useLeaves(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.createLeave).toBe('function');
    expect(typeof result.current.updateLeaveStatus).toBe('function');
    expect(typeof result.current.deleteLeave).toBe('function');
  });
});
