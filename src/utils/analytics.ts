// Analytics & Tracking Utility
// Integrated with Google Analytics 4
import ReactGA from 'react-ga4';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface UserProperties {
  userId: string;
  email?: string;
  tenantId?: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private enabled: boolean;
  private environment: string;
  private initialized: boolean = false;

  constructor() {
    this.enabled = import.meta.env.PROD;
    this.environment = import.meta.env.MODE || 'development';
  }

  /**
   * Initialize Google Analytics 4
   */
  init(measurementId?: string): void {
    if (this.initialized) return;

    // Initialize GA4 only in production or if measurement ID provided
    if (measurementId && this.enabled) {
      ReactGA.initialize(measurementId, {
        gaOptions: {
          anonymizeIp: true,
        },
      });
      this.initialized = true;
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    if (!this.enabled) {
      console.log('[Analytics] Page View:', { path, title });
      return;
    }

    if (this.initialized) {
      ReactGA.send({ hitType: 'pageview', page: path, title });
    }
  }

  /**
   * Track custom event
   */
  trackEvent({ category, action, label, value }: AnalyticsEvent): void {
    if (!this.enabled) {
      console.log('[Analytics] Event:', { category, action, label, value });
      return;
    }

    if (this.initialized) {
      ReactGA.event({ category, action, label, value });
    }
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
      value: role ? 1 : 0,
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
   * Identify user for tracking
   */
  identifyUser(properties: UserProperties): void {
    if (!this.enabled) {
      console.log('[Analytics] Identify User:', properties);
      return;
    }

    if (this.initialized) {
      ReactGA.set({ userId: properties.userId, ...properties });
    }
  }

  /**
   * Track conversion
   */
  trackConversion(transactionId: string, value: number): void {
    this.trackEvent({
      category: 'Commerce',
      action: 'conversion',
      label: transactionId,
      value,
    });
  }

  /**
   * Track performance metric
   */
  trackTiming(category: string, variable: string, value: number): void {
    if (!this.enabled) {
      console.log('[Analytics] Timing:', { category, variable, value });
      return;
    }

    if (this.initialized) {
      ReactGA.event({
        category: 'timing',
        action: variable,
        label: category,
        value: Math.round(value),
      });
    }
  }
}

export const analytics = new Analytics();

// Track component lifecycle
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
