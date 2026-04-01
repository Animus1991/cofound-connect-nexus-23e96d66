import type { ErrorHandler } from "hono";
import { logger } from "../lib/logger.js";

/**
 * Global error handler for Hono.
 * Catches unhandled exceptions, logs them with Pino, and returns a safe JSON response.
 */
export const globalErrorHandler: ErrorHandler = (err, c) => {
  const status = "status" in err && typeof err.status === "number" ? err.status : 500;

  logger.error(
    {
      err: { message: err.message, stack: err.stack, name: err.name },
      method: c.req.method,
      path: c.req.path,
      status,
    },
    "Unhandled error"
  );

  // Never expose internal error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message ?? "Internal server error";

  return c.json({ error: message }, status as 500);
};
