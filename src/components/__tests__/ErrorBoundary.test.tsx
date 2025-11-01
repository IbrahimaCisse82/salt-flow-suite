import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock error tracking
vi.mock('@/utils/errorTracking', () => ({
  logComponentError: vi.fn(),
}));

const ThrowError = () => {
  throw new Error('Test error');
};

const WorkingComponent = () => <div>Working component</div>;

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(getByText('Working component')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/quelque chose s'est mal passé/i)).toBeInTheDocument();

    console.error = originalError;
  });

  it('should provide reload functionality', () => {
    const originalError = console.error;
    console.error = vi.fn();

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(container.querySelector('button')).toBeInTheDocument();

    console.error = originalError;
  });
});
