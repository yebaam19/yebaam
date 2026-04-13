import 'server-only';

type Bucket = {
  tokens: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Max requests allowed in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Tiny in-memory token bucket rate limiter scoped per `key` (use IP+route).
 * Resets only when the previous window expires. Process-local — fine for a
 * single Next.js instance, replace with Redis if you scale horizontally.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { tokens: opts.limit - 1, resetAt: now + opts.windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: fresh.tokens, resetAt: fresh.resetAt };
  }

  if (existing.tokens <= 0) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.tokens -= 1;
  return { ok: true, remaining: existing.tokens, resetAt: existing.resetAt };
}

export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
