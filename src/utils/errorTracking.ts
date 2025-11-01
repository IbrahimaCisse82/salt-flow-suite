// Error Tracking & Monitoring Utility
// Ready for Sentry integration

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

  constructor() {
    this.enabled = import.meta.env.PROD;
    this.environment = import.meta.env.MODE || 'development';
  }

  /**
   * Capture exception with context
   */
  captureException(error: Error, context?: ErrorContext): void {
    if (!this.enabled) {
      console.error('[Dev Error]', error, context);
      return;
    }

    // TODO: Integrate with Sentry
    // Sentry.captureException(error, { contexts: { custom: context } });
    
    // Fallback logging
    console.error('[Error Tracker]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      environment: this.environment,
    });
  }

  /**
   * Capture custom message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (!this.enabled && level === 'info') return;

    // TODO: Integrate with Sentry
    // Sentry.captureMessage(message, { level, contexts: { custom: context } });

    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
      `[${level.toUpperCase()}]`,
      message,
      context
    );
  }

  /**
   * Set user context for tracking
   */
  setUser(userId: string, email?: string, tenantId?: string): void {
    if (!this.enabled) return;

    // TODO: Integrate with Sentry
    // Sentry.setUser({ id: userId, email, tenantId });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.enabled) return;

    // TODO: Integrate with Sentry
    // Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    // TODO: Integrate with Sentry
    // Sentry.addBreadcrumb({ message, category, data, timestamp: Date.now() / 1000 });
  }

  /**
   * Track performance
   */
  trackPerformance(name: string, duration: number, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    console.log('[Performance]', { name, duration, metadata });

    // TODO: Integrate with Sentry or custom APM
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
