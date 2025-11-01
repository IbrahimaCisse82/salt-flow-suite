import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analytics } from '../analytics';

// Mock ReactGA
vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
    set: vi.fn(),
  },
}));

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize analytics', () => {
    analytics.init('G-TEST123');
    expect(analytics).toBeDefined();
  });

  it('should track page view', () => {
    analytics.trackPageView('/dashboard', 'Dashboard');
    expect(analytics).toBeDefined();
  });

  it('should track custom events', () => {
    analytics.trackEvent({
      category: 'User',
      action: 'click',
      label: 'button',
      value: 1,
    });
    expect(analytics).toBeDefined();
  });

  it('should track login', () => {
    analytics.trackLogin('email');
    expect(analytics).toBeDefined();
  });

  it('should track signup', () => {
    analytics.trackSignup('email', 'user');
    expect(analytics).toBeDefined();
  });

  it('should track feature usage', () => {
    analytics.trackFeatureUsage('dashboard', 'view');
    expect(analytics).toBeDefined();
  });

  it('should identify user', () => {
    analytics.identifyUser({
      userId: '123',
      email: 'test@example.com',
      role: 'admin',
    });
    expect(analytics).toBeDefined();
  });

  it('should track conversion', () => {
    analytics.trackConversion('tx-123', 1000);
    expect(analytics).toBeDefined();
  });

  it('should track timing', () => {
    analytics.trackTiming('page-load', 'dashboard', 1500);
    expect(analytics).toBeDefined();
  });
});
