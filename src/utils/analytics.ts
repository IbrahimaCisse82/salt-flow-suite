// Analytics & User Tracking Utility
// Ready for Google Analytics, Mixpanel, or Segment integration

interface PageViewData {
  path: string;
  title: string;
  referrer?: string;
}

interface EventData {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

interface UserProperties {
  userId: string;
  email?: string;
  tenantId?: string;
  role?: string;
  plan?: string;
}

class Analytics {
  private enabled: boolean;
  private debug: boolean;

  constructor() {
    this.enabled = import.meta.env.PROD;
    this.debug = import.meta.env.DEV;
  }

  /**
   * Track page view
   */
  trackPageView(data: PageViewData): void {
    if (this.debug) {
      console.log('[Analytics] Page View:', data);
    }

    if (!this.enabled) return;

    // TODO: Integrate with GA4
    // gtag('event', 'page_view', { page_path: data.path, page_title: data.title });

    // TODO: Integrate with Mixpanel
    // mixpanel.track('Page Viewed', data);
  }

  /**
   * Track custom event
   */
  trackEvent(data: EventData): void {
    if (this.debug) {
      console.log('[Analytics] Event:', data);
    }

    if (!this.enabled) return;

    // TODO: Integrate with GA4
    // gtag('event', data.action, {
    //   event_category: data.category,
    //   event_label: data.label,
    //   value: data.value,
    // });

    // TODO: Integrate with Mixpanel
    // mixpanel.track(data.action, { category: data.category, ...data.metadata });
  }

  /**
   * Track user login
   */
  trackLogin(method: string): void {
    this.trackEvent({
      category: 'Auth',
      action: 'login',
      label: method,
    });
  }

  /**
   * Track user signup
   */
  trackSignup(method: string, role?: string): void {
    this.trackEvent({
      category: 'Auth',
      action: 'signup',
      label: method,
      metadata: { role },
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string): void {
    this.trackEvent({
      category: 'Feature',
      action: `${feature}_${action}`,
      label: feature,
    });
  }

  /**
   * Track error occurrence
   */
  trackError(errorName: string, errorMessage: string, fatal: boolean = false): void {
    this.trackEvent({
      category: 'Error',
      action: errorName,
      label: errorMessage,
      metadata: { fatal },
    });
  }

  /**
   * Identify user
   */
  identifyUser(properties: UserProperties): void {
    if (this.debug) {
      console.log('[Analytics] Identify User:', properties);
    }

    if (!this.enabled) return;

    // TODO: Integrate with GA4
    // gtag('set', 'user_properties', { user_id: properties.userId });

    // TODO: Integrate with Mixpanel
    // mixpanel.identify(properties.userId);
    // mixpanel.people.set({ $email: properties.email, role: properties.role });
  }

  /**
   * Track conversion (for paid plans)
   */
  trackConversion(value: number, currency: string = 'XOF'): void {
    this.trackEvent({
      category: 'Commerce',
      action: 'conversion',
      value,
      metadata: { currency },
    });
  }

  /**
   * Track search query
   */
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent({
      category: 'Search',
      action: 'search_query',
      label: query,
      value: resultsCount,
    });
  }

  /**
   * Track performance metric
   */
  trackTiming(category: string, variable: string, value: number): void {
    if (this.debug) {
      console.log('[Analytics] Timing:', { category, variable, value });
    }

    if (!this.enabled) return;

    // TODO: Integrate with GA4
    // gtag('event', 'timing_complete', {
    //   name: variable,
    //   value: value,
    //   event_category: category,
    // });
  }
}

export const analytics = new Analytics();

// React Router integration helper
export function usePageTracking(): void {
  // This would be used in a hook to track route changes
  // Example: useEffect(() => analytics.trackPageView({ path: location.pathname, title: document.title }), [location]);
}

// Track component mount/unmount for engagement metrics
export function trackComponentLifecycle(componentName: string): () => void {
  const startTime = Date.now();
  
  analytics.trackEvent({
    category: 'Component',
    action: 'mount',
    label: componentName,
  });

  return () => {
    const duration = Date.now() - startTime;
    analytics.trackTiming('Component', componentName, duration);
  };
}
