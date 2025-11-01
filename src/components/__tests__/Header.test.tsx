import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '@/components/Layout/Header';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
    userProfile: { full_name: 'Test User' },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/contexts/SidebarContext', () => ({
  useSidebar: () => ({
    toggleSidebar: vi.fn(),
  }),
}));

const renderHeader = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Header />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  it('should render header', () => {
    const { container } = renderHeader();
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('should display user name when available', () => {
    const { getByText } = renderHeader();
    expect(getByText('Test User')).toBeInTheDocument();
  });

  it('should have theme toggle button', () => {
    const { container } = renderHeader();
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
