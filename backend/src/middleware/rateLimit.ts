import { createMiddleware } from "hono/factory";

/**
 * Simple in-memory rate limiter for Hono.
 * Uses a sliding window counter per IP address.
 *
 * For production with multiple instances, replace with Redis-backed limiter.
 */

interface RateLimitOptions {
  /** Max requests allowed in the window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, WindowEntry>>();

// Periodic cleanup to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }
}, 60_000);

export function rateLimiter(opts: RateLimitOptions) {
  const storeKey = `${opts.max}-${opts.windowMs}`;
  if (!stores.has(storeKey)) stores.set(storeKey, new Map());
  const store = stores.get(storeKey)!;

  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const now = Date.now();
    let entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(ip, entry);
    }

    entry.count++;

    c.header("X-RateLimit-Limit", String(opts.max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.max - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > opts.max) {
      return c.json(
        { error: "Too many requests. Please try again later." },
        429
      );
    }

    await next();
  });
}

/** Strict limiter for auth endpoints: 20 requests per 15 minutes per IP */
export const authRateLimit = rateLimiter({ max: 20, windowMs: 15 * 60 * 1000 });

/** General API limiter: 100 requests per minute per IP */
export const apiRateLimit = rateLimiter({ max: 100, windowMs: 60 * 1000 });
