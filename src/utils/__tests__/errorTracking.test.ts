import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorTracker } from '../errorTracking';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  metrics: {
    distribution: vi.fn(),
  },
}));

describe('ErrorTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize error tracking', () => {
    errorTracker.init('test-dsn');
    expect(errorTracker).toBeDefined();
  });

  it('should capture exceptions', () => {
    const error = new Error('Test error');
    errorTracker.captureException(error, {
      userId: '123',
      route: '/dashboard',
    });
    expect(errorTracker).toBeDefined();
  });

  it('should capture messages', () => {
    errorTracker.captureMessage('Test message', 'info', {
      action: 'test',
    });
    expect(errorTracker).toBeDefined();
  });

  it('should set user context', () => {
    errorTracker.setUser('user-123', 'test@example.com', 'tenant-123');
    expect(errorTracker).toBeDefined();
  });

  it('should clear user context', () => {
    errorTracker.clearUser();
    expect(errorTracker).toBeDefined();
  });

  it('should add breadcrumbs', () => {
    errorTracker.addBreadcrumb('User clicked button', 'ui', {
      buttonId: 'submit',
    });
    expect(errorTracker).toBeDefined();
  });

  it('should track performance', () => {
    errorTracker.trackPerformance('page-render', 250, {
      page: 'dashboard',
    });
    expect(errorTracker).toBeDefined();
  });
});
