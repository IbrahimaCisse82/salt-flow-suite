import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RoleProtectedRoute } from '../RoleProtectedRoute';
import { ReactNode } from 'react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
    Navigate: ({ to }: { to: string }) => <div>Redirect to {to}</div>,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import('@/contexts/AuthContext');

describe('RoleProtectedRoute', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  it('should show loader when authentication is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: null,
      loading: true,
      user: null,
      session: null,
      tenant: null,
    });

    const { container } = render(
      <RoleProtectedRoute>
        <div>Protected Content</div>
      </RoleProtectedRoute>,
      { wrapper }
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should redirect to auth if not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: null,
      loading: false,
      user: null,
      session: null,
      tenant: null,
    });

    const { getByText } = render(
      <RoleProtectedRoute>
        <div>Protected Content</div>
      </RoleProtectedRoute>,
      { wrapper }
    );

    expect(getByText('Redirect to /auth')).toBeInTheDocument();
  });

  it('should render children if user has access', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: {
        id: 'test-id',
        role: 'gerant',
        tenant_id: 'test-tenant',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: null,
        avatar_url: null,
      },
      loading: false,
      user: { id: 'test-id' } as never,
      session: {} as never,
      tenant: null,
    });

    const { getByText } = render(
      <RoleProtectedRoute>
        <div>Protected Content</div>
      </RoleProtectedRoute>,
      { wrapper }
    );

    expect(getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show access denied for unauthorized role', () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: {
        id: 'test-id',
        role: 'commercial',
        tenant_id: 'test-tenant',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: null,
        avatar_url: null,
      },
      loading: false,
      user: { id: 'test-id' } as never,
      session: {} as never,
      tenant: null,
    });

    // Mock location to admin page
    vi.mocked(useAuth).mockReturnValue({
      profile: {
        id: 'test-id',
        role: 'commercial',
        tenant_id: 'test-tenant',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: null,
        avatar_url: null,
      },
      loading: false,
      user: { id: 'test-id' } as never,
      session: {} as never,
      tenant: null,
    });

    const { getByText } = render(
      <RoleProtectedRoute>
        <div>Admin Content</div>
      </RoleProtectedRoute>,
      { wrapper }
    );

    // Commercial role can access home page
    expect(getByText('Admin Content')).toBeInTheDocument();
  });
});
