import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryRateLimitStore,
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_POLICIES,
} from '@/lib/security/rateLimiter';

describe('Server-Side Rate Limiter', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore(100);
  });

  it('allows requests within the configured threshold', async () => {
    const config = { maxRequests: 3, windowSeconds: 60, name: 'test-gen' };
    const now = 1000000;

    const res1 = await checkRateLimit('client-1', config, store, now);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit('client-1', config, store, now + 1000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit('client-1', config, store, now + 2000);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('rejects requests exceeding the limit with accurate retryAfterSeconds', async () => {
    const config = { maxRequests: 2, windowSeconds: 30, name: 'test-limit' };
    const baseTime = 1000000;

    await checkRateLimit('client-exceed', config, store, baseTime);
    await checkRateLimit('client-exceed', config, store, baseTime + 5000);

    // 3rd request should fail
    const blockedRes = await checkRateLimit('client-exceed', config, store, baseTime + 10000);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    // Oldest request was at baseTime; window is 30s; elapsed is 10s -> retryAfter = 20s
    expect(blockedRes.retryAfterSeconds).toBe(20);
  });

  it('isolates different clients independently', async () => {
    const config = { maxRequests: 1, windowSeconds: 60, name: 'test-isolation' };
    const now = 1000000;

    const clientARes1 = await checkRateLimit('client-A', config, store, now);
    expect(clientARes1.success).toBe(true);

    const clientARes2 = await checkRateLimit('client-A', config, store, now + 100);
    expect(clientARes2.success).toBe(false);

    // Client B should still be allowed
    const clientBRes = await checkRateLimit('client-B', config, store, now + 200);
    expect(clientBRes.success).toBe(true);
  });

  it('resets limits after the sliding window expires', async () => {
    const config = { maxRequests: 2, windowSeconds: 10, name: 'test-expiry' };
    const t0 = 1000000;

    await checkRateLimit('client-expire', config, store, t0);
    await checkRateLimit('client-expire', config, store, t0 + 1000);

    // Blocked at t0 + 2000 (2s into 10s window)
    const blocked = await checkRateLimit('client-expire', config, store, t0 + 2000);
    expect(blocked.success).toBe(false);

    // After 11 seconds (window passed), new request should succeed
    const allowedAfterExpiry = await checkRateLimit('client-expire', config, store, t0 + 11000);
    expect(allowedAfterExpiry.success).toBe(true);
    expect(allowedAfterExpiry.remaining).toBe(1);
  });

  it('enforces distinct policies for generate (5/min) vs refine (10/min)', () => {
    expect(RATE_LIMIT_POLICIES.GENERATE_PLAN.maxRequests).toBe(5);
    expect(RATE_LIMIT_POLICIES.GENERATE_PLAN.windowSeconds).toBe(60);

    expect(RATE_LIMIT_POLICIES.REFINE_PLAN.maxRequests).toBe(10);
    expect(RATE_LIMIT_POLICIES.REFINE_PLAN.windowSeconds).toBe(60);
  });

  it('extracts client IP from proxy headers safely', () => {
    const h1 = new Headers({ 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' });
    expect(getClientIdentifier(h1)).toBe('203.0.113.195');

    const h2 = new Headers({ 'x-real-ip': '198.51.100.42' });
    expect(getClientIdentifier(h2)).toBe('198.51.100.42');

    const h3 = new Headers();
    expect(getClientIdentifier(h3)).toBe('127.0.0.1');
  });
});
