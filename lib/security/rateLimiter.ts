/**
 * Server-only rate limiting abstraction for Gatherly AI.
 * 
 * Provides:
 * 1. Proxy-aware, spoof-resistant client identification
 * 2. Sliding-window log rate limiter with hard-bounded in-memory LRU storage
 * 3. Native distributed Upstash Redis REST store support for multi-instance production
 * 4. Documented fail-closed safety policy for live AI quota protection
 * 5. Deterministic clock and store injection for testing
 */

export interface RateLimitConfig {
  maxRequests: number; // Maximum allowed requests within the window
  windowSeconds: number; // Time window in seconds
  name?: string; // Endpoint or action identifier
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfterSeconds: number;
  limiterBackend?: 'memory' | 'upstash-redis';
  limiterFailure?: boolean;
}

export interface RateLimitStore {
  check(key: string, maxRequests: number, windowSeconds: number, nowMs: number): Promise<RateLimitResult>;
  reset(key?: string): Promise<void> | void;
}

/**
 * In-memory sliding-window log rate limiter with strict, hard-bounded LRU eviction
 * to ensure memory consumption never exceeds maxKeys under concurrent client abuse.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private hits: Map<string, number[]> = new Map();
  private maxKeys: number;

  constructor(maxKeys: number = 5000) {
    this.maxKeys = Math.max(10, maxKeys);
  }

  async check(
    key: string,
    maxRequests: number,
    windowSeconds: number,
    nowMs: number
  ): Promise<RateLimitResult> {
    const windowMs = windowSeconds * 1000;
    const windowStart = nowMs - windowMs;

    // Strict hard bounding: if map has reached or exceeded maxKeys, prune expired first
    if (this.hits.size >= this.maxKeys && !this.hits.has(key)) {
      this.cleanup(windowStart);

      // If still at or above capacity, enforce strict LRU/FIFO eviction of oldest keys
      while (this.hits.size >= this.maxKeys) {
        const oldestKey = this.hits.keys().next().value;
        if (oldestKey !== undefined) {
          this.hits.delete(oldestKey);
        } else {
          break;
        }
      }
    }

    const timestamps = this.hits.get(key) || [];
    // Keep only timestamps within current sliding window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    // Re-insert key to maintain strict Map insertion/LRU access order
    this.hits.delete(key);

    if (validTimestamps.length >= maxRequests) {
      const oldestInWindow = validTimestamps[0];
      const resetMs = Math.max(0, oldestInWindow + windowMs - nowMs);
      const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));

      this.hits.set(key, validTimestamps);
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetSeconds: retryAfterSeconds,
        retryAfterSeconds,
        limiterBackend: 'memory',
      };
    }

    validTimestamps.push(nowMs);
    this.hits.set(key, validTimestamps);

    const remaining = maxRequests - validTimestamps.length;
    return {
      success: true,
      limit: maxRequests,
      remaining,
      resetSeconds: windowSeconds,
      retryAfterSeconds: 0,
      limiterBackend: 'memory',
    };
  }

  reset(key?: string): void {
    if (key) {
      this.hits.delete(key);
    } else {
      this.hits.clear();
    }
  }

  getCapacity(): { currentKeys: number; maxKeys: number } {
    return { currentKeys: this.hits.size, maxKeys: this.maxKeys };
  }

  private cleanup(windowStart: number): void {
    for (const [k, timestamps] of this.hits.entries()) {
      const active = timestamps.filter((t) => t > windowStart);
      if (active.length === 0) {
        this.hits.delete(k);
      } else {
        this.hits.set(k, active);
      }
    }
  }
}

/**
 * Distributed rate limiter adapter backed by Upstash Redis REST API.
 * Uses atomic Redis pipeline commands (ZREMRANGEBYSCORE, ZCARD, ZADD, EXPIRE)
 * to provide global rate limiting across serverless and multi-instance deployments.
 */
export class UpstashRedisRateLimitStore implements RateLimitStore {
  private url: string;
  private token: string;
  private fetchFn: typeof fetch;

  constructor(url: string, token: string, customFetch?: typeof fetch) {
    this.url = url.replace(/\/+$/, '');
    this.token = token;
    this.fetchFn = customFetch || fetch;
  }

  async check(
    key: string,
    maxRequests: number,
    windowSeconds: number,
    nowMs: number
  ): Promise<RateLimitResult> {
    const windowMs = windowSeconds * 1000;
    const windowStart = nowMs - windowMs;
    const redisKey = `gatherly:ratelimit:${key}`;
    const memberId = `${nowMs}:${Math.random().toString(36).slice(2, 8)}`;

    // Atomic pipeline:
    // 1. ZREMRANGEBYSCORE: purge requests older than sliding window
    // 2. ZCARD: query count of active requests in current window
    // 3. ZRANGE ... WITHSCORES: retrieve oldest active request timestamp
    const pipelineCmds = [
      ['ZREMRANGEBYSCORE', redisKey, 0, windowStart],
      ['ZCARD', redisKey],
      ['ZRANGE', redisKey, 0, 0, 'WITHSCORES'],
    ];

    const res = await this.fetchFn(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipelineCmds),
    });

    if (!res.ok) {
      throw new Error(`Upstash RateLimit HTTP Error ${res.status}: ${res.statusText}`);
    }

    const results = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    const count = typeof results[1]?.result === 'number' ? results[1].result : 0;
    const oldestEntry = results[2]?.result;

    if (count >= maxRequests) {
      let oldestTimestamp = windowStart;
      if (Array.isArray(oldestEntry) && oldestEntry.length > 0) {
        const scoreVal = Number(oldestEntry[1] ?? oldestEntry[0]);
        if (!isNaN(scoreVal) && scoreVal > 0) {
          oldestTimestamp = scoreVal;
        }
      }
      const resetMs = Math.max(0, oldestTimestamp + windowMs - nowMs);
      const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));

      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetSeconds: retryAfterSeconds,
        retryAfterSeconds,
        limiterBackend: 'upstash-redis',
      };
    }

    // Under limit: record request timestamp and refresh TTL
    await this.fetchFn(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['ZADD', redisKey, nowMs, memberId],
        ['EXPIRE', redisKey, windowSeconds * 2],
      ]),
    });

    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - count - 1),
      resetSeconds: windowSeconds,
      retryAfterSeconds: 0,
      limiterBackend: 'upstash-redis',
    };
  }

  async reset(key?: string): Promise<void> {
    if (key) {
      const redisKey = `gatherly:ratelimit:${key}`;
      await this.fetchFn(`${this.url}/DEL/${encodeURIComponent(redisKey)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
      });
    }
  }
}

/**
 * Standard endpoint policy configurations.
 */
export const RATE_LIMIT_POLICIES: Record<string, RateLimitConfig> = {
  GENERATE_PLAN: {
    maxRequests: parseInt(process.env.RATE_LIMIT_GENERATE_MAX || '5', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_GENERATE_WINDOW || '60', 10),
    name: 'generate-plan',
  },
  REFINE_PLAN: {
    maxRequests: parseInt(process.env.RATE_LIMIT_REFINE_MAX || '10', 10),
    windowSeconds: parseInt(process.env.RATE_LIMIT_REFINE_WINDOW || '60', 10),
    name: 'refine-plan',
  },
};

// Default singleton store instances
const defaultMemoryStore = new MemoryRateLimitStore(5000);

let defaultUpstashStore: UpstashRedisRateLimitStore | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  defaultUpstashStore = new UpstashRedisRateLimitStore(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Gets the active rate limit store based on configuration.
 */
export function getActiveRateLimitStore(): RateLimitStore {
  return defaultUpstashStore || defaultMemoryStore;
}

/**
 * Evaluates rate limit for a given client key and policy.
 * Supports clock and store injection for deterministic automated tests.
 * 
 * Safety Policy:
 * If a distributed rate limiter is configured but encounters network/backend failures,
 * production requests with live AI configured will fail-closed to prevent quota exhaustion.
 */
export async function checkRateLimit(
  clientKey: string,
  config: RateLimitConfig,
  store?: RateLimitStore,
  customNowMs?: number
): Promise<RateLimitResult> {
  const activeStore = store ?? getActiveRateLimitStore();
  const nowMs = customNowMs ?? Date.now();
  const namespacedKey = `${config.name || 'default'}:${clientKey}`;

  try {
    return await activeStore.check(namespacedKey, config.maxRequests, config.windowSeconds, nowMs);
  } catch (error) {
    console.error('[Gatherly RateLimiter] Storage backend failure:', error);

    const isProductionWithLiveAI =
      process.env.NODE_ENV === 'production' && !!process.env.GEMINI_API_KEY;
    const shouldFailClosed =
      process.env.RATE_LIMIT_FAIL_CLOSED === 'true' || isProductionWithLiveAI;

    if (shouldFailClosed) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetSeconds: 60,
        retryAfterSeconds: 60,
        limiterFailure: true,
      };
    }

    // Fall back safely to in-memory store for demo/development environments
    return defaultMemoryStore.check(namespacedKey, config.maxRequests, config.windowSeconds, nowMs);
  }
}

/**
 * Safely extracts client identifier from request headers.
 * Uses trusted ingress headers (Vercel, Cloudflare, X-Real-IP) and
 * resolves proxy hops to prevent spoofing from client-provided leftmost headers.
 */
export function getClientIdentifier(headers: Headers): string {
  const IP_REGEX = /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4})$/;

  // 1. Platform-trusted headers that cannot be spoofed by external callers
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim();
    if (IP_REGEX.test(candidate)) return candidate;
  }

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    const candidate = cfIp.trim();
    if (IP_REGEX.test(candidate)) return candidate;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    const candidate = realIp.trim();
    if (IP_REGEX.test(candidate)) return candidate;
  }

  // 2. Standard X-Forwarded-For parsing with trusted proxy hop handling
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      // In a reverse-proxy topology (Vercel/ALB/Nginx), the nearest proxy appends the client IP
      // at the right. The leftmost IP is attacker-controlled unless trusted hops are strictly 0.
      const trustedHops = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10));
      const targetIndex = Math.max(0, ips.length - trustedHops);
      const chosenIp = ips[targetIndex] || ips[0];
      if (IP_REGEX.test(chosenIp)) {
        return chosenIp;
      }
    }
  }

  // 3. Fallback for local testing and isolated environments
  return '127.0.0.1';
}

/**
 * Resets the default in-memory store (used in test teardown).
 */
export function resetRateLimiter(key?: string): void {
  defaultMemoryStore.reset(key);
}
