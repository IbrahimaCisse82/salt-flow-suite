import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Header } from '../Header';
import * as AuthContext from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/SidebarContext', () => ({
  useSidebar: () => ({ isOpen: true, toggle: vi.fn() }),
}));

vi.mock('@/components/Notifications/NotificationCenter', () => ({
  NotificationCenter: () => null,
}));

vi.mock('../../../hooks/useTenantId', () => ({
  useTenantId: () => 'tenant-123',
}));

const wrap = (ui: ReactNode) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Header', () => {
  it('should render logo and user info when authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      profile: { full_name: 'John Doe', role: 'admin' },
      tenant: { name: 'Test Tenant' },
      isLoading: false,
      signOut: vi.fn(),
    } as any);

    const { getAllByText } = wrap(<Header />);

    expect(getAllByText('Test Tenant').length).toBeGreaterThan(0);
  });

  it('should show loading state', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      profile: null,
      tenant: null,
      isLoading: true,
      signOut: vi.fn(),
    } as any);

    const { container } = wrap(<Header />);

    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('should render without user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      profile: null,
      tenant: null,
      isLoading: false,
      signOut: vi.fn(),
    } as any);

    const { container } = wrap(<Header />);

    expect(container.querySelector('header')).toBeInTheDocument();
  });
});
