import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types.js";
import { verifyToken } from "../lib/jwt.js";

/**
 * Hono middleware: extracts & verifies JWT, sets userId on context.
 * Protected routes call `c.get("userId")` to read the authenticated user.
 */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("userId", payload.userId);
  await next();
});
