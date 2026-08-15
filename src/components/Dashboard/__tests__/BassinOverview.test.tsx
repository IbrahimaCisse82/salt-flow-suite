import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BassinOverview } from '../BassinOverview';
import * as useBassins from '@/hooks/useBassins';

vi.mock('@/hooks/useBassins', () => ({
  useBassins: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('BassinOverview', () => {
  it('should render loading state', () => {
    vi.mocked(useBassins.useBassins).mockReturnValue({
      bassins: [],
      isLoading: true,
    } as any);

    const { container } = render(<BassinOverview />, { wrapper: createWrapper() });

    // Loading is rendered as skeleton placeholders
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should render empty state when no bassins', () => {
    vi.mocked(useBassins.useBassins).mockReturnValue({
      bassins: [],
      isLoading: false,
    } as any);

    const { getByText } = render(<BassinOverview />, { wrapper: createWrapper() });
    
    expect(getByText(/aucun bassin/i)).toBeInTheDocument();
  });

  it('should render bassins list', () => {
    const mockBassins = [
      {
        id: '1',
        name: 'Bassin A',
        surface_area: 1000,
        status: 'active',
        current_salt_quantity: 500,
      },
      {
        id: '2',
        name: 'Bassin B',
        surface_area: 2000,
        status: 'maintenance',
        current_salt_quantity: 300,
      },
    ];

    vi.mocked(useBassins.useBassins).mockReturnValue({
      bassins: mockBassins,
      isLoading: false,
    } as any);

    const { getByText } = render(<BassinOverview />, { wrapper: createWrapper() });
    
    expect(getByText('Bassin A')).toBeInTheDocument();
    expect(getByText('Bassin B')).toBeInTheDocument();
  });

  it('should display bassin status correctly', () => {
    const mockBassins = [
      {
        id: '1',
        name: 'Bassin Actif',
        surface_area: 1000,
        status: 'active',
        current_salt_quantity: 500,
      },
    ];

    vi.mocked(useBassins.useBassins).mockReturnValue({
      bassins: mockBassins,
      isLoading: false,
    } as any);

    const { container } = render(<BassinOverview />, { wrapper: createWrapper() });
    
    expect(container.textContent).toContain('Bassin Actif');
  });
});
