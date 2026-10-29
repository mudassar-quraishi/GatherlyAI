/**
 * Server-only rate limiting abstraction for Gatherly AI.
 * 
 * Provides proxy-aware client identification, sliding-window rate tracking,
 * deterministic clock injection for testing, and pluggable storage (in-memory
 * bounded store for local/testing, with adapter pattern for Upstash/Redis in multi-instance production).
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
}

export interface RateLimitStore {
  check(key: string, maxRequests: number, windowSeconds: number, nowMs: number): Promise<RateLimitResult>;
  reset(key?: string): void;
}

/**
 * In-memory sliding-window log rate limiter with bounded storage
 * to prevent memory leaks in long-running processes or serverless environments.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private hits: Map<string, number[]> = new Map();
  private maxKeys: number;

  constructor(maxKeys: number = 5000) {
    this.maxKeys = maxKeys;
  }

  async check(
    key: string,
    maxRequests: number,
    windowSeconds: number,
    nowMs: number
  ): Promise<RateLimitResult> {
    const windowMs = windowSeconds * 1000;
    const windowStart = nowMs - windowMs;

    // Prune stale keys if map exceeds max capacity
    if (this.hits.size > this.maxKeys) {
      this.cleanup(windowStart);
    }

    const timestamps = this.hits.get(key) || [];
    // Keep only timestamps within current sliding window
    const validTimestamps = timestamps.filter((t) => t > windowStart);

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
    };
  }

  reset(key?: string): void {
    if (key) {
      this.hits.delete(key);
    } else {
      this.hits.clear();
    }
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

// Singleton default in-memory store
const defaultStore = new MemoryRateLimitStore();

/**
 * Evaluates rate limit for a given client key and policy.
 * Supports clock and store injection for deterministic automated tests.
 */
export async function checkRateLimit(
  clientKey: string,
  config: RateLimitConfig,
  store: RateLimitStore = defaultStore,
  customNowMs?: number
): Promise<RateLimitResult> {
  const nowMs = customNowMs ?? Date.now();
  const namespacedKey = `${config.name || 'default'}:${clientKey}`;
  return store.check(namespacedKey, config.maxRequests, config.windowSeconds, nowMs);
}

/**
 * Safely extracts client identifier from Next.js request headers.
 * Uses trusted proxy ordering and falls back gracefully.
 */
export function getClientIdentifier(headers: Headers): string {
  // Check x-forwarded-for header (first entry is the client IP)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const clientIp = forwardedFor.split(',')[0].trim();
    if (clientIp) return clientIp;
  }

  // Fallback to x-real-ip
  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  // Fallback to cf-connecting-ip if deployed behind Cloudflare
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  // Default fallback for local testing
  return '127.0.0.1';
}

/**
 * Resets the default store (used in test teardown).
 */
export function resetRateLimiter(key?: string): void {
  defaultStore.reset(key);
}
