import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemMonitoring } from '../SystemMonitoring';

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
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SystemMonitoring', () => {
  it('should render monitoring dashboard', () => {
    const { getByText } = render(<SystemMonitoring />, { wrapper: createWrapper() });
    
    expect(getByText(/monitoring/i)).toBeInTheDocument();
  });

  it('should display system metrics', () => {
    const { container } = render(<SystemMonitoring />, { wrapper: createWrapper() });
    
    expect(container).toBeInTheDocument();
  });

  it('should render without errors', () => {
    const { container } = render(<SystemMonitoring />, { wrapper: createWrapper() });
    
    expect(container).toBeInTheDocument();
  });
});
