import { createMiddleware } from "hono/factory";

/**
 * Security headers middleware — Helmet-equivalent for Hono.
 * Sets common HTTP security headers on every response.
 */
export const securityHeaders = createMiddleware(async (c, next) => {
  await next();

  // Prevent MIME-type sniffing
  c.header("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  c.header("X-Frame-Options", "DENY");

  // XSS protection (legacy browsers)
  c.header("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — disable sensitive browser features
  c.header(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Strict Transport Security (only effective over HTTPS)
  if (process.env.NODE_ENV === "production") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
});
