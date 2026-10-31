import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MemoryRateLimitStore,
  UpstashRedisRateLimitStore,
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_POLICIES,
  RateLimitStore,
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

  it('enforces strict hard bounds via LRU eviction to prevent unbounded memory growth', async () => {
    const smallStore = new MemoryRateLimitStore(10);
    const config = { maxRequests: 5, windowSeconds: 60, name: 'test-bounded' };
    const now = 1000000;

    // Insert 25 distinct active client keys
    for (let i = 1; i <= 25; i++) {
      await smallStore.check(`client-${i}`, config.maxRequests, config.windowSeconds, now + i * 10);
    }

    // Capacity must never exceed maxKeys (10)
    const capacity = smallStore.getCapacity();
    expect(capacity.currentKeys).toBeLessThanOrEqual(10);
    expect(capacity.maxKeys).toBe(10);
  });

  it('provides native UpstashRedisRateLimitStore using atomic REST pipeline', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string);
      // First pipeline call queries count and oldest timestamp
      if (body[0][0] === 'ZREMRANGEBYSCORE') {
        return {
          ok: true,
          status: 200,
          json: async () => [
            { result: 0 },
            { result: 1 }, // 1 existing hit
            { result: ['oldest-member', '1000000'] },
          ],
        };
      }
      return { ok: true, status: 200, json: async () => [{ result: 1 }] };
    });

    const upstashStore = new UpstashRedisRateLimitStore(
      'https://example-upstash.upstash.io',
      'test-token',
      mockFetch as unknown as typeof fetch
    );

    const config = { maxRequests: 3, windowSeconds: 60, name: 'upstash-test' };
    const res = await upstashStore.check('upstash-client', config.maxRequests, config.windowSeconds, 1000050);

    expect(res.success).toBe(true);
    expect(res.limit).toBe(3);
    expect(res.remaining).toBe(1);
    expect(res.limiterBackend).toBe('upstash-redis');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('handles fail-closed safety policy when rate limit backend encounters an error', async () => {
    const failingStore: RateLimitStore = {
      check: async () => {
        throw new Error('Connection refused to redis host');
      },
      reset: () => {},
    };

    const originalFailClosed = process.env.RATE_LIMIT_FAIL_CLOSED;
    try {
      process.env.RATE_LIMIT_FAIL_CLOSED = 'true';
      const config = { maxRequests: 5, windowSeconds: 60, name: 'fail-closed-test' };
      const res = await checkRateLimit('client-fail', config, failingStore, 1000000);

      // Must fail closed to prevent quota exhaustion
      expect(res.success).toBe(false);
      expect(res.limiterFailure).toBe(true);
      expect(res.retryAfterSeconds).toBe(60);
    } finally {
      process.env.RATE_LIMIT_FAIL_CLOSED = originalFailClosed;
    }
  });

  it('extracts client IP safely from trusted proxy headers without spoofing vulnerabilities', () => {
    // 1. Vercel trusted header
    const hVercel = new Headers({ 'x-vercel-forwarded-for': '203.0.113.50, 10.0.0.1' });
    expect(getClientIdentifier(hVercel)).toBe('203.0.113.50');

    // 2. Cloudflare connecting IP
    const hCf = new Headers({ 'cf-connecting-ip': '198.51.100.22' });
    expect(getClientIdentifier(hCf)).toBe('198.51.100.22');

    // 3. X-Real-IP
    const hReal = new Headers({ 'x-real-ip': '198.51.100.42' });
    expect(getClientIdentifier(hReal)).toBe('198.51.100.42');

    // 4. X-Forwarded-For with proxy hops (picks nearest verified hop instead of spoofable leftmost)
    const hForwarded = new Headers({ 'x-forwarded-for': 'spoofed.attacker.ip, 192.0.2.1' });
    expect(getClientIdentifier(hForwarded)).toBe('192.0.2.1');

    // 5. Fallback for local
    const hEmpty = new Headers();
    expect(getClientIdentifier(hEmpty)).toBe('127.0.0.1');
  });

  it('enforces distinct policies for generate (5/min) vs refine (10/min)', () => {
    expect(RATE_LIMIT_POLICIES.GENERATE_PLAN.maxRequests).toBe(5);
    expect(RATE_LIMIT_POLICIES.GENERATE_PLAN.windowSeconds).toBe(60);

    expect(RATE_LIMIT_POLICIES.REFINE_PLAN.maxRequests).toBe(10);
    expect(RATE_LIMIT_POLICIES.REFINE_PLAN.windowSeconds).toBe(60);
  });
});
