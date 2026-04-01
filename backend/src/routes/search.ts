import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { searchUsers, searchOpportunities } from "../lib/search.js";

export const searchRoutes = new Hono<AppEnv>();
searchRoutes.use("*", authMiddleware);

// GET /api/search?q=react&type=users|opportunities|all&limit=20
searchRoutes.get("/", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const type = c.req.query("type") ?? "all";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 50);

  if (!q) return c.json({ users: [], opportunities: [] });

  const [usersResult, oppsResult] = await Promise.allSettled([
    type !== "opportunities" ? searchUsers(q, limit) : Promise.resolve(null),
    type !== "users" ? searchOpportunities(q, limit) : Promise.resolve(null),
  ]);

  const userHits =
    usersResult.status === "fulfilled" && usersResult.value
      ? usersResult.value.hits.map((h) => ({ ...h.document, score: h.score }))
      : [];

  const oppHits =
    oppsResult.status === "fulfilled" && oppsResult.value
      ? oppsResult.value.hits.map((h) => ({ ...h.document, score: h.score }))
      : [];

  return c.json({ users: userHits, opportunities: oppHits });
});
