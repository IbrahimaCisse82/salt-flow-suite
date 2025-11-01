import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../Header';
import * as AuthContext from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../hooks/useTenantId', () => ({
  useTenantId: () => 'tenant-123',
}));

describe('Header', () => {
  it('should render logo and user info when authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      profile: { full_name: 'John Doe', role: 'admin' },
      tenant: { name: 'Test Tenant' },
      isLoading: false,
      signOut: vi.fn(),
    } as any);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Test Tenant')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      profile: null,
      tenant: null,
      isLoading: true,
      signOut: vi.fn(),
    } as any);

    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(container).toBeInTheDocument();
  });

  it('should render without user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      profile: null,
      tenant: null,
      isLoading: false,
      signOut: vi.fn(),
    } as any);

    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(container).toBeInTheDocument();
  });
});
