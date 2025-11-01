import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimiter, RATE_LIMITS, withRateLimit } from '../rateLimit';

describe('RateLimiter', () => {
  beforeEach(() => {
    rateLimiter.clear('test-key');
  });

  afterEach(() => {
    rateLimiter.clear('test-key');
  });

  it('should allow requests within limit', () => {
    const config = { maxRequests: 3, windowMs: 1000 };
    
    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    const config = { maxRequests: 2, windowMs: 1000 };
    
    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(false);
  });

  it('should return correct remaining count', () => {
    const config = { maxRequests: 5, windowMs: 1000 };
    
    expect(rateLimiter.getRemaining('test-key', config)).toBe(5);
    
    rateLimiter.check('test-key', config);
    expect(rateLimiter.getRemaining('test-key', config)).toBe(4);
    
    rateLimiter.check('test-key', config);
    expect(rateLimiter.getRemaining('test-key', config)).toBe(3);
  });

  it('should reset after time window', async () => {
    const config = { maxRequests: 2, windowMs: 100 };
    
    rateLimiter.check('test-key', config);
    rateLimiter.check('test-key', config);
    expect(rateLimiter.check('test-key', config)).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(rateLimiter.check('test-key', config)).toBe(true);
  });

  it('should clear specific key', () => {
    const config = { maxRequests: 1, windowMs: 1000 };
    
    rateLimiter.check('test-key', config);
    expect(rateLimiter.check('test-key', config)).toBe(false);
    
    rateLimiter.clear('test-key');
    expect(rateLimiter.check('test-key', config)).toBe(true);
  });

  it('should have predefined rate limits', () => {
    expect(RATE_LIMITS.API.maxRequests).toBe(100);
    expect(RATE_LIMITS.AUTH.maxRequests).toBe(5);
    expect(RATE_LIMITS.FORM.maxRequests).toBe(10);
    expect(RATE_LIMITS.UPLOAD.maxRequests).toBe(20);
    expect(RATE_LIMITS.EMAIL.maxRequests).toBe(5);
    expect(RATE_LIMITS.NOTIFICATION.maxRequests).toBe(50);
  });
});

describe('withRateLimit', () => {
  it('should allow function execution within limit', () => {
    const fn = vi.fn((x: number) => x * 2);
    const config = { maxRequests: 2, windowMs: 1000 };
    const limited = withRateLimit(fn, config, () => 'test');
    
    expect(limited(5)).toBe(10);
    expect(limited(3)).toBe(6);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw error when rate limit exceeded', () => {
    const fn = vi.fn((x: number) => x * 2);
    const config = { maxRequests: 1, windowMs: 1000 };
    const limited = withRateLimit(fn, config, () => 'test');
    
    limited(5);
    expect(() => limited(3)).toThrow(/rate limit exceeded/i);
  });

  it('should use different keys for different arguments', () => {
    const fn = vi.fn((x: number) => x * 2);
    const config = { maxRequests: 1, windowMs: 1000 };
    const limited = withRateLimit(fn, config, (x) => `key-${x}`);
    
    expect(limited(1)).toBe(2);
    expect(limited(2)).toBe(4); // Different key, should work
    expect(() => limited(1)).toThrow(); // Same key as first, should fail
  });
});
