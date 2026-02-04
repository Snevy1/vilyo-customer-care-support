
type RateLimitConfig = {
  interval?: number;           // refill window in milliseconds
  maxTokensPerInterval?: number; // how many requests allowed per interval
  maxBurst?: number;          // optional: allow short bursts larger than interval rate
};

type TokenBucket = {
  tokens: number;
  lastRefill: number;
};

type LimiterStore = Map<string, TokenBucket>;

const globalStore: LimiterStore = new Map();

/**
 * Factory that creates a reusable rate limiter instance
 */
export function rateLimit({
  interval = 60_000,              // 60 seconds default
  maxTokensPerInterval = 10,      // e.g. 10 req / minute
  maxBurst = maxTokensPerInterval * 2, // allow some burst
}: RateLimitConfig = {}) {
  const store: LimiterStore = typeof globalStore !== 'undefined'
    ? globalStore
    : new Map(); // fallback for non-global environments

  // Simple cleanup: remove entries older than ~10× interval (prevent memory leak)
  const MAX_AGE = interval * 10;

  function cleanup() {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      if (now - bucket.lastRefill > MAX_AGE) {
        store.delete(key);
      }
    }
  }

  /**
   * Checks if a request is allowed and consumes a token if yes
   * @throws Error with retryAfterMs when rate limited
   */
  async function check(identifier: string, requestedTokens = 1): Promise<void> {
    if (requestedTokens < 1) return;

    const now = Date.now();
    let bucket = store.get(identifier);

    // Initialize or refill bucket
    if (!bucket) {
      bucket = { tokens: maxTokensPerInterval, lastRefill: now };
      store.set(identifier, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsedMs = now - bucket.lastRefill;
    if (elapsedMs > 0) {
      const tokensToAdd = Math.floor(elapsedMs / (interval / maxTokensPerInterval));
      bucket.tokens = Math.min(maxBurst, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Clean up occasionally (once every ~100 checks should be enough)
    if (Math.random() < 0.01) {
      cleanup();
    }

    if (bucket.tokens < requestedTokens) {
      const msUntilRefill = interval - (elapsedMs % interval);
      throw new Error(`Rate limit exceeded. Retry after ${msUntilRefill}ms`, {
        cause: { retryAfterMs: msUntilRefill, limit: maxTokensPerInterval, window: interval }
      });
    }

    // Consume tokens
    bucket.tokens -= requestedTokens;
  }

  /**
   * Convenience method to get remaining tokens & reset time
   */
  function getRemaining(identifier: string): {
    remaining: number;
    resetMs: number;
  } {
    const now = Date.now();
    const bucket = store.get(identifier);

    if (!bucket) {
      return { remaining: maxTokensPerInterval, resetMs: interval };
    }

    const elapsed = now - bucket.lastRefill;
    const tokensAdded = Math.floor(elapsed / (interval / maxTokensPerInterval));
    const current = Math.min(maxBurst, bucket.tokens + tokensAdded);

    const resetMs = interval - (elapsed % interval);

    return {
      remaining: current,
      resetMs,
    };
  }

  return {
    check,
    getRemaining,
    // Mostly for testing
    _getStoreSize: () => store.size,
  };
}

// -----------------------------
// Common pre-configured limiters (export what you need)
// -----------------------------

export const strictLimiter = rateLimit({
  interval: 60_000,           // 1 minute
  maxTokensPerInterval: 5,    // very strict
  maxBurst: 8,
});

export const standardLimiter = rateLimit({
  interval: 60_000,
  maxTokensPerInterval: 30,
  maxBurst: 50,
});

export const generousLimiter = rateLimit({
  interval: 60_000,
  maxTokensPerInterval: 100,
  maxBurst: 150,
});

// Default one matching your original usage style
export const defaultLimiter = rateLimit({
  interval: 60_000,
  maxTokensPerInterval: 10,
  maxBurst: 20,
});