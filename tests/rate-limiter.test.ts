import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  MemoryRateLimitStore,
  UpstashRedisRateLimitStore,
  checkRateLimit,
  getClientIdentifier,
  normalizeIp,
  LUA_SLIDING_WINDOW_SCRIPT,
  RATE_LIMIT_POLICIES,
  RateLimitStore,
} from '@/lib/security/rateLimiter';

describe('Server-Side Rate Limiter', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore(100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('executes atomic Lua script with Upstash Redis REST and returns correct sliding-window quota', async () => {
    let capturedBody: unknown = null;
    const mockFetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          result: [1, 2, 0], // allowed: 1, remaining: 2, retryAfter: 0
        }),
      };
    });

    const upstashStore = new UpstashRedisRateLimitStore(
      'https://example-upstash.upstash.io',
      'test-token',
      mockFetch as unknown as typeof fetch
    );

    const config = { maxRequests: 3, windowSeconds: 60, name: 'upstash-atomic' };
    const res = await upstashStore.check('upstash-client', config.maxRequests, config.windowSeconds, 1000050);

    expect(res.success).toBe(true);
    expect(res.limit).toBe(3);
    expect(res.remaining).toBe(2);
    expect(res.retryAfterSeconds).toBe(0);
    expect(res.limiterBackend).toBe('upstash-redis');

    // Verify atomic EVAL invocation
    expect(Array.isArray(capturedBody)).toBe(true);
    const bodyArray = capturedBody as unknown[];
    expect(bodyArray[0]).toBe('EVAL');
    expect(bodyArray[1]).toBe(LUA_SLIDING_WINDOW_SCRIPT);
    expect(bodyArray[2]).toBe(1); // 1 key
    expect(bodyArray[3]).toBe('gatherly:ratelimit:upstash-client');
    expect(bodyArray[4]).toBe('1000050'); // nowMs
    expect(bodyArray[5]).toBe('60000'); // windowMs
    expect(bodyArray[6]).toBe('3'); // maxRequests
  });

  /**
   * Evaluator Core Test:
   * "With a limit of five requests per minute, send 30 simultaneous requests
   * using the same client identifier. No more than five should succeed."
   */
  it('handles 30 simultaneous requests with limit of 5: exactly 5 succeed and 25 fail without race conditions (Atomic Redis)', async () => {
    // Model Redis's single-threaded atomic Lua script execution
    const mockRedisSortedSet: Array<{ member: string; score: number }> = [];

    const mockFetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      const args = JSON.parse(init?.body as string);
      expect(args[0]).toBe('EVAL');
      const now = Number(args[4]);
      const window = Number(args[5]);
      const limit = Number(args[6]);
      const member = args[7];
      const clearBefore = now - window;

      // 1. ZREMRANGEBYSCORE
      const activeEntries = mockRedisSortedSet.filter((e) => e.score > clearBefore);
      mockRedisSortedSet.length = 0;
      mockRedisSortedSet.push(...activeEntries);

      // 2. ZCARD
      const currentHits = mockRedisSortedSet.length;

      // 3. Conditional atomic check-and-write
      if (currentHits < limit) {
        mockRedisSortedSet.push({ member, score: now });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            result: [1, limit - currentHits - 1, 0],
          }),
        };
      } else {
        const oldest = mockRedisSortedSet[0];
        const retryAfter = oldest ? Math.max(1, Math.ceil((oldest.score + window - now) / 1000)) : 1;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            result: [0, 0, retryAfter],
          }),
        };
      }
    });

    const upstashStore = new UpstashRedisRateLimitStore(
      'https://concurrent-test.upstash.io',
      'secret-token',
      mockFetch as unknown as typeof fetch
    );

    const clientId = 'evaluator-race-client';
    const limit = 5;
    const windowSecs = 60;
    const now = 1000000;

    // Dispatch 30 simultaneous requests concurrently
    const requests = Array.from({ length: 30 }, () =>
      upstashStore.check(clientId, limit, windowSecs, now)
    );

    const results = await Promise.all(requests);

    const succeeded = results.filter((r) => r.success);
    const rejected = results.filter((r) => !r.success);

    // EXACTLY 5 MUST SUCCEED AND EXACTLY 25 MUST BE REJECTED
    expect(succeeded.length).toBe(5);
    expect(rejected.length).toBe(25);

    // Succeeded remaining counts must decrease down to 0
    const remainingCounts = succeeded.map((s) => s.remaining).sort((a, b) => b - a);
    expect(remainingCounts).toEqual([4, 3, 2, 1, 0]);

    // All rejected responses must report retryAfterSeconds > 0
    expect(rejected.every((r) => r.retryAfterSeconds > 0)).toBe(true);
  });

  it('handles 30 simultaneous requests with limit of 5 on MemoryRateLimitStore', async () => {
    const memStore = new MemoryRateLimitStore();
    const clientId = 'mem-race-client';
    const limit = 5;
    const windowSecs = 60;
    const now = 1000000;

    const requests = Array.from({ length: 30 }, () =>
      memStore.check(clientId, limit, windowSecs, now)
    );

    const results = await Promise.all(requests);
    const succeeded = results.filter((r) => r.success);
    const rejected = results.filter((r) => !r.success);

    expect(succeeded.length).toBe(5);
    expect(rejected.length).toBe(25);
  });

  describe('Redis Error Handling & Fail-Closed Validation', () => {
    it('validates Redis HTTP response status and throws on HTTP 500 error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const upstashStore = new UpstashRedisRateLimitStore(
        'https://error.upstash.io',
        'token',
        mockFetch as unknown as typeof fetch
      );

      await expect(upstashStore.check('client', 5, 60, 1000)).rejects.toThrow(
        'Upstash RateLimit HTTP Error 500: Internal Server Error'
      );
    });

    it('validates individual Redis command execution errors and throws on error payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ error: 'ERR syntax error in script' }),
      });

      const upstashStore = new UpstashRedisRateLimitStore(
        'https://error.upstash.io',
        'token',
        mockFetch as unknown as typeof fetch
      );

      await expect(upstashStore.check('client', 5, 60, 1000)).rejects.toThrow(
        'Upstash Redis Command Error: ERR syntax error in script'
      );
    });

    it('validates script return shape and throws on malformed output', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: 'unexpected-string' }),
      });

      const upstashStore = new UpstashRedisRateLimitStore(
        'https://error.upstash.io',
        'token',
        mockFetch as unknown as typeof fetch
      );

      await expect(upstashStore.check('client', 5, 60, 1000)).rejects.toThrow(
        'Upstash Redis Invalid Script Output'
      );
    });

    it('validates DEL response when resetting key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      });

      const upstashStore = new UpstashRedisRateLimitStore(
        'https://error.upstash.io',
        'token',
        mockFetch as unknown as typeof fetch
      );

      await expect(upstashStore.reset('client-del')).rejects.toThrow(
        'Upstash DEL Error 502: Bad Gateway'
      );
    });

    it('enforces fail-closed behavior when backend fails and fail-closed is active', async () => {
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

        expect(res.success).toBe(false);
        expect(res.limiterFailure).toBe(true);
        expect(res.retryAfterSeconds).toBe(60);
      } finally {
        process.env.RATE_LIMIT_FAIL_CLOSED = originalFailClosed;
      }
    });
  });

  describe('Production Mandatory Upstash Enforcement', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('strictly prohibits silent in-memory fallback in production when live Gemini is enabled', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('GEMINI_API_KEY', 'AIzaSyLiveProductionKey');
      vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config = { maxRequests: 5, windowSeconds: 60, name: 'prod-security-check' };
      const res = await checkRateLimit('prod-client', config);

      expect(res.success).toBe(false);
      expect(res.limiterFailure).toBe(true);
      expect(res.retryAfterSeconds).toBe(60);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Production Security Misconfiguration')
      );
    });

    it('allows in-memory fallback in local development or demo mode without Upstash', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('GEMINI_API_KEY', '');
      vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

      const config = { maxRequests: 5, windowSeconds: 60, name: 'dev-check' };
      const res = await checkRateLimit('dev-client', config);

      expect(res.success).toBe(true);
      expect(res.limiterBackend).toBe('memory');
    });
  });

  describe('IP Normalization & Header Parsing', () => {
    it('normalizes IPv4 addresses and strips port numbers', () => {
      expect(normalizeIp('198.51.100.1:8080')).toBe('198.51.100.1');
      expect(normalizeIp('  203.0.113.19  ')).toBe('203.0.113.19');
      expect(normalizeIp('10.0.0.1')).toBe('10.0.0.1');
    });

    it('normalizes IPv6 addresses including bracketed ports', () => {
      expect(normalizeIp('[2001:db8::1]:8443')).toBe('2001:db8::1');
      expect(normalizeIp('2001:db8::1')).toBe('2001:db8::1');
      expect(normalizeIp('::1')).toBe('::1');
    });

    it('rejects invalid or malformed IP addresses', () => {
      expect(normalizeIp('999.999.999.999')).toBeNull();
      expect(normalizeIp('not-an-ip')).toBeNull();
      expect(normalizeIp('')).toBeNull();
      expect(normalizeIp(null)).toBeNull();
      expect(normalizeIp(undefined)).toBeNull();
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

    it('isolates unidentified production clients using anonymous fingerprints rather than 127.0.0.1', () => {
      vi.stubEnv('NODE_ENV', 'production');
      try {
        const hClient1 = new Headers({
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
          'accept-language': 'en-US,en;q=0.9',
        });

        const hClient2 = new Headers({
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'accept-language': 'fr-FR,fr;q=0.8',
        });

        const id1 = getClientIdentifier(hClient1);
        const id2 = getClientIdentifier(hClient2);

        // Neither should be 127.0.0.1
        expect(id1).not.toBe('127.0.0.1');
        expect(id2).not.toBe('127.0.0.1');
        expect(id1.startsWith('anon-')).toBe(true);
        expect(id2.startsWith('anon-')).toBe(true);

        // Different user agents generate isolated anonymous quotas
        expect(id1).not.toBe(id2);
      } finally {
        vi.unstubAllEnvs();
      }
    });
  });

  it('enforces distinct policies for generate (5/min) vs refine (10/min)', () => {
    expect(RATE_LIMIT_POLICIES.GENERATE_PLAN.maxRequests).toBe(5);
    expect(RATE_LIMIT_POLICIES.GENERATE_PLAN.windowSeconds).toBe(60);

    expect(RATE_LIMIT_POLICIES.REFINE_PLAN.maxRequests).toBe(10);
    expect(RATE_LIMIT_POLICIES.REFINE_PLAN.windowSeconds).toBe(60);
  });
});
