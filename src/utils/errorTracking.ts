// Error Tracking & Monitoring Utility
// Integrated with Sentry
import * as Sentry from '@sentry/react';

interface ErrorContext {
  userId?: string;
  tenantId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class ErrorTracker {
  private enabled: boolean;
  private environment: string;
  private initialized: boolean = false;

  constructor() {
    this.enabled = import.meta.env.PROD;
    this.environment = import.meta.env.MODE || 'development';
  }

  /**
   * Initialize Sentry
   */
  init(dsn?: string): void {
    if (this.initialized) return;

    // Initialize Sentry only in production or if DSN provided
    if (dsn && this.enabled) {
      Sentry.init({
        dsn,
        environment: this.environment,
        tracesSampleRate: 0.1, // 10% of transactions
        beforeSend(event) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.Cookie;
          }
          return event;
        },
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
      });
      this.initialized = true;
    }
  }

  /**
   * Capture exception with context
   */
  captureException(error: Error, context?: ErrorContext): void {
    if (!this.enabled) {
      console.error('[Dev Error]', error, context);
      return;
    }

    if (this.initialized) {
      Sentry.captureException(error, {
        tags: {
          userId: context?.userId,
          tenantId: context?.tenantId,
          route: context?.route,
          action: context?.action,
        },
        extra: context?.metadata,
      });
    } else {
      // Fallback logging
      console.error('[Error Tracker]', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        environment: this.environment,
      });
    }
  }

  /**
   * Capture custom message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (!this.enabled && level === 'info') return;

    if (this.initialized) {
      Sentry.captureMessage(message, {
        level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
        tags: {
          userId: context?.userId,
          tenantId: context?.tenantId,
          route: context?.route,
        },
        extra: context?.metadata,
      });
    } else {
      console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
        `[${level.toUpperCase()}]`,
        message,
        context
      );
    }
  }

  /**
   * Set user context for tracking
   */
  setUser(userId: string, email?: string, tenantId?: string): void {
    if (!this.enabled) return;

    if (this.initialized) {
      Sentry.setUser({
        id: userId,
        email,
        tenantId,
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.enabled) return;

    if (this.initialized) {
      Sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    if (this.initialized) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now() / 1000,
      });
    }
  }

  /**
   * Track performance
   */
  trackPerformance(name: string, duration: number, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    if (this.initialized) {
      Sentry.metrics.distribution(name, duration, {
        unit: 'millisecond',
      });
    } else {
      console.log('[Performance]', { name, duration, metadata });
    }
  }
}

export const errorTracker = new ErrorTracker();

// Helper to wrap async functions with error tracking
export function withErrorTracking<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

// React Error Boundary helper
export function logComponentError(error: Error, errorInfo: { componentStack: string }): void {
  errorTracker.captureException(error, {
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
}
