/**
 * Rate Limiting Utility
 * Prevents abuse by limiting the number of requests per time window
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be allowed
   */
  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    // No previous entry or expired
    if (!entry || now >= entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    // Within limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, config: RateLimitConfig): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() >= entry.resetAt) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until reset (in ms)
   */
  getResetTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.resetAt - Date.now());
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // API calls (100 requests per minute)
  API: { maxRequests: 100, windowMs: 60 * 1000 },
  
  // Authentication attempts (5 per 15 minutes)
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  
  // Form submissions (10 per minute)
  FORM: { maxRequests: 10, windowMs: 60 * 1000 },
  
  // File uploads (20 per hour)
  UPLOAD: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  
  // Email sending (5 per hour)
  EMAIL: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  
  // Push notifications (50 per hour)
  NOTIFICATION: { maxRequests: 50, windowMs: 60 * 60 * 1000 },
} as const;

/**
 * Create a rate-limited wrapper for a function
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  config: RateLimitConfig,
  getKey: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = getKey(...args);
    
    if (!rateLimiter.check(key, config)) {
      const resetIn = Math.ceil(rateLimiter.getResetTime(key) / 1000);
      throw new Error(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`
      );
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Middleware for rate limiting (React hook)
 */
export function useRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.API
) {
  return {
    check: () => rateLimiter.check(key, config),
    remaining: rateLimiter.getRemaining(key, config),
    resetIn: rateLimiter.getResetTime(key),
  };
}