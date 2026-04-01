import { createMiddleware } from "hono/factory";

/**
 * Request ID middleware.
 * Generates a unique ID per request for log correlation and tracing.
 * Reads X-Request-ID from incoming request if already set (e.g. by a reverse proxy),
 * otherwise generates a new one. Exposes it on the response header.
 */
export const requestId = createMiddleware(async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const id = incoming ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  c.set("requestId" as never, id);
  c.header("X-Request-ID", id);
  await next();
});
