import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useScheduledReports } from '../useScheduledReports';
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
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
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

describe('useScheduledReports', () => {
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

  it('should fetch scheduled reports', async () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.scheduledReports).toBeDefined();
    expect(Array.isArray(result.current.scheduledReports)).toBe(true);
  });

  it('should provide createReport mutation', () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper(),
    });

    expect(result.current.createReport).toBeDefined();
    expect(typeof result.current.createReport.mutate).toBe('function');
  });

  it('should provide updateReport mutation', () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper(),
    });

    expect(result.current.updateReport).toBeDefined();
    expect(typeof result.current.updateReport.mutate).toBe('function');
  });

  it('should provide deleteReport mutation', () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper(),
    });

    expect(result.current.deleteReport).toBeDefined();
    expect(typeof result.current.deleteReport.mutate).toBe('function');
  });

  it('should provide toggleReport mutation', () => {
    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper(),
    });

    expect(result.current.toggleReport).toBeDefined();
    expect(typeof result.current.toggleReport.mutate).toBe('function');
  });

  it('should not fetch without tenant', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      profile: null,
      user: null,
    } as any);

    const { result } = renderHook(() => useScheduledReports(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.scheduledReports).toEqual([]);
  });
});
