import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

/**
 * Server-only rate limiting abstraction for Gatherly AI.
 * 
 * Provides:
 * 1. Single atomic Lua script for Redis sliding-window rate limiting (zero race conditions)
 * 2. Strict validation of Redis HTTP responses and command execution
 * 3. Mandatory Upstash Redis configuration in production whenever live Gemini AI is enabled
 * 4. Hard-bounded in-memory LRU fallback storage for local/demo use
 * 5. Robust IPv4/IPv6 normalization with port stripping and anonymous client isolation
 * 6. Deterministic clock and store injection for testing
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

export function parseBoundedPositiveInteger(
  rawValue: string | undefined,
  fallback: number,
  maximum: number
): number {
  if (!rawValue?.trim()) return fallback;
  const parsed = Number(rawValue);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
}

/**
 * Atomic Lua script for genuine sliding-window rate limiting in Redis.
 * Eliminates check-then-write race conditions by executing prune, count,
 * conditional write, and expiration in a single atomic transaction.
 *
 * KEYS[1]: Redis sorted set key
 * ARGV[1]: Current timestamp in ms (now)
 * ARGV[2]: Window size in ms
 * ARGV[3]: Maximum allowed requests
 * ARGV[4]: Unique member ID for this hit
 *
 * Returns: { isAllowed (1 or 0), remainingCount, retryAfterSeconds }
 */
export const LUA_SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local clearBefore = now - window

-- 1. Remove expired timestamps outside sliding window
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)

-- 2. Count active hits within current window
local currentHits = redis.call('ZCARD', key)

if currentHits < limit then
  -- 3. Under limit: atomically add current hit and refresh expiration TTL
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window * 2)
  return { 1, limit - currentHits - 1, 0 }
else
  -- 4. Limit reached: query oldest timestamp in current window to calculate retryAfter
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfter = 1
  if oldest and #oldest >= 2 then
    local oldestTs = tonumber(oldest[2])
    local resetAt = oldestTs + window
    retryAfter = math.max(1, math.ceil((resetAt - now) / 1000))
  end
  return { 0, 0, retryAfter }
end
`.trim();

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
 * Uses atomic Lua script execution to guarantee zero race conditions across
 * concurrent requests in serverless or multi-instance deployments.
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
    const redisKey = `gatherly:ratelimit:${key}`;
    const memberId = `${nowMs}:${Math.random().toString(36).slice(2, 8)}`;

    const res = await this.fetchFn(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        LUA_SLIDING_WINDOW_SCRIPT,
        1,
        redisKey,
        String(nowMs),
        String(windowMs),
        String(maxRequests),
        memberId,
      ]),
    });

    if (!res.ok) {
      throw new Error(`Upstash RateLimit HTTP Error ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as
      | { result?: unknown; error?: string }
      | Array<{ result?: unknown; error?: string }>;

    const data = Array.isArray(json) ? json[0] : json;

    if (data?.error) {
      throw new Error(`Upstash Redis Command Error: ${data.error}`);
    }

    if (!data || !Array.isArray(data.result) || data.result.length < 3) {
      throw new Error(`Upstash Redis Invalid Script Output: ${JSON.stringify(data)}`);
    }

    const [allowedFlag, remainingCount, retryAfterSecs] = data.result as [number, number, number];
    const isAllowed = Number(allowedFlag) === 1;
    const remaining = Math.max(0, Number(remainingCount));
    const retryAfterSeconds = Math.max(0, Number(retryAfterSecs));

    return {
      success: isAllowed,
      limit: maxRequests,
      remaining: isAllowed ? remaining : 0,
      resetSeconds: isAllowed ? windowSeconds : retryAfterSeconds,
      retryAfterSeconds: isAllowed ? 0 : retryAfterSeconds,
      limiterBackend: 'upstash-redis',
    };
  }

  async reset(key?: string): Promise<void> {
    if (key) {
      const redisKey = `gatherly:ratelimit:${key}`;
      const res = await this.fetchFn(`${this.url}/DEL/${encodeURIComponent(redisKey)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) {
        throw new Error(`Upstash DEL Error ${res.status}: ${res.statusText}`);
      }
    }
  }
}

/**
 * Standard endpoint policy configurations.
 */
export const RATE_LIMIT_POLICIES: Record<string, RateLimitConfig> = {
  GENERATE_PLAN: {
    maxRequests: parseBoundedPositiveInteger(process.env.RATE_LIMIT_GENERATE_MAX, 5, 1000),
    windowSeconds: parseBoundedPositiveInteger(process.env.RATE_LIMIT_GENERATE_WINDOW, 60, 86400),
    name: 'generate-plan',
  },
  REFINE_PLAN: {
    maxRequests: parseBoundedPositiveInteger(process.env.RATE_LIMIT_REFINE_MAX, 10, 1000),
    windowSeconds: parseBoundedPositiveInteger(process.env.RATE_LIMIT_REFINE_WINDOW, 60, 86400),
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
 * Checks whether live Gemini AI is enabled in production.
 */
export function isLiveAIInProduction(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Checks whether distributed Upstash Redis credentials are configured.
 */
export function isUpstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
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
 * 1. In production with live Gemini AI, distributed Upstash Redis is MANDATORY.
 *    Silently falling back to an in-memory store is prohibited.
 * 2. If storage backend encounters an unexpected failure, requests fail closed (HTTP 503)
 *    to prevent Gemini quota exhaustion.
 */
export async function checkRateLimit(
  clientKey: string,
  config: RateLimitConfig,
  store?: RateLimitStore,
  customNowMs?: number
): Promise<RateLimitResult> {
  const isProdWithLiveAI = isLiveAIInProduction();
  const hasUpstash = isUpstashConfigured();

  // Enforce mandatory distributed store when live AI is enabled in production
  if (isProdWithLiveAI && !hasUpstash && !store) {
    console.error(
      '[Gatherly RateLimiter] Production Security Misconfiguration: Live Gemini AI is enabled in production, ' +
      'but UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured. ' +
      'In-memory rate limiting is strictly prohibited in production with live AI.'
    );
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetSeconds: 60,
      retryAfterSeconds: 60,
      limiterBackend: 'upstash-redis',
      limiterFailure: true,
    };
  }

  const activeStore = store ?? getActiveRateLimitStore();
  const nowMs = customNowMs ?? Date.now();
  const clientKeyHash = createHash('sha256').update(clientKey).digest('hex');
  const namespacedKey = `${config.name || 'default'}:${clientKeyHash}`;

  try {
    return await activeStore.check(namespacedKey, config.maxRequests, config.windowSeconds, nowMs);
  } catch (error) {
    console.error('[Gatherly RateLimiter] Storage backend failure:', error);

    const shouldFailClosed =
      process.env.RATE_LIMIT_FAIL_CLOSED === 'true' || isProdWithLiveAI;

    if (shouldFailClosed) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetSeconds: 60,
        retryAfterSeconds: 60,
        limiterBackend: activeStore instanceof UpstashRedisRateLimitStore ? 'upstash-redis' : 'memory',
        limiterFailure: true,
      };
    }

    // Fall back to in-memory store ONLY in non-production or demo environments
    return defaultMemoryStore.check(namespacedKey, config.maxRequests, config.windowSeconds, nowMs);
  }
}

/**
 * Normalizes and validates an IPv4 or IPv6 address.
 * Strips port numbers if present (e.g. 192.0.2.1:8080 or [2001:db8::1]:443).
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let cleaned = raw.trim();
  if (!cleaned) return null;

  // Bracketed IPv6 (optionally with a port): [2001:db8::1]:8080 -> 2001:db8::1
  if (cleaned.startsWith('[')) {
    const bracketedAddress = /^\[([^\]]+)\](?::\d+)?$/.exec(cleaned);
    if (!bracketedAddress) return null;
    cleaned = bracketedAddress[1];
  } else if (isIP(cleaned) === 0) {
    // IPv4 with a port: 198.51.100.1:8080 -> 198.51.100.1
    const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(cleaned);
    if (ipv4WithPort) cleaned = ipv4WithPort[1];
  }

  return isIP(cleaned) === 0 ? null : cleaned.toLowerCase();
}

/**
 * Safely extracts client identifier from request headers.
 * Uses trusted ingress headers (Vercel, Cloudflare, X-Real-IP) and
 * resolves proxy hops to prevent spoofing from client-provided leftmost headers.
 * 
 * Never assigns unidentified production clients to 127.0.0.1.
 */
export function getClientIdentifier(headers: Headers): string {
  // 1. Platform-trusted headers that cannot be spoofed by external callers
  const vercelIp = normalizeIp(headers.get('x-vercel-forwarded-for')?.split(',')[0]);
  if (vercelIp) return vercelIp;

  const cfIp = normalizeIp(headers.get('cf-connecting-ip'));
  if (cfIp) return cfIp;

  const realIp = normalizeIp(headers.get('x-real-ip'));
  if (realIp) return realIp;

  // 2. Standard X-Forwarded-For parsing with trusted proxy hop handling
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      const configuredHops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10);
      const trustedHops = Number.isSafeInteger(configuredHops) && configuredHops > 0 ? configuredHops : 1;
      const targetIndex = Math.max(0, ips.length - trustedHops);
      const chosenIp = normalizeIp(ips[targetIndex]) || normalizeIp(ips[0]);
      if (chosenIp) {
        return chosenIp;
      }
    }
  }

  // 3. Fallback:
  // For local development and test environments, use loopback
  if (process.env.NODE_ENV !== 'production') {
    return '127.0.0.1';
  }

  // In production, do NOT assign all unidentified clients to 127.0.0.1 (which would collapse
  // separate users into one shared quota). Generate an isolated pseudo-identifier.
  const userAgent = headers.get('user-agent') || '';
  const acceptLanguage = headers.get('accept-language') || '';
  const secChUa = headers.get('sec-ch-ua') || '';

  // Request IDs are unique per request; including one would let each request bypass its quota.
  const fingerprint = `${userAgent}|${acceptLanguage}|${secChUa}`;
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = (hash << 5) - hash + fingerprint.charCodeAt(i);
    hash |= 0;
  }
  return `anon-${Math.abs(hash).toString(36)}`;
}

/**
 * Resets the default in-memory store (used in test teardown).
 */
export function resetRateLimiter(key?: string): void {
  defaultMemoryStore.reset(key);
}
