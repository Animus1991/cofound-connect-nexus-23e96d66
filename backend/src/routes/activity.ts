import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { db } from "../db/index.js";
import { activityLog, users } from "../db/schema.js";
import { eq, desc, inArray } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

export const activityRoutes = new Hono<AppEnv>();
activityRoutes.use("*", authMiddleware);

// GET /api/activity?limit=20
// Returns the current user's recent activity, enriched with user names
// for actions involving other users (e.g. connection_made, intro_sent).
activityRoutes.get("/", (c) => {
  const userId = c.get("userId");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 100);

  const rows = db.select().from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .all();

  // Parse context JSON; collect any targetUserIds for enrichment
  const parsed = rows.map((r) => {
    let ctx: Record<string, unknown> = {};
    try { ctx = JSON.parse(r.context); } catch { /* keep empty */ }
    return { ...r, ctx };
  });

  const targetIds = [...new Set(
    parsed
      .map((r) => (r.ctx.toId ?? r.ctx.withUserId ?? r.ctx.targetUserId) as string | undefined)
      .filter((id): id is string => typeof id === "string")
  )];

  const nameMap = new Map<string, string>();
  if (targetIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users)
      .where(inArray(users.id, targetIds)).all()
      .forEach((u) => nameMap.set(u.id, u.name ?? "Someone"));
  }

  const labelMap: Record<string, string> = {
    profile_updated: "Updated your profile",
    connection_made: "Connected with",
    intro_sent: "Sent an intro request to",
    opportunity_posted: "Posted a new opportunity",
    application_sent: "Applied to an opportunity",
    message_sent: "Sent a message",
    startup_created: "Created a startup profile",
    startup_updated: "Updated startup profile",
  };

  return c.json({
    activity: parsed.map((r) => {
      const targetId = (r.ctx.toId ?? r.ctx.withUserId ?? r.ctx.targetUserId) as string | undefined;
      const targetName = targetId ? nameMap.get(targetId) : undefined;
      const label = labelMap[r.action] ?? r.action;
      return {
        id: r.id,
        action: r.action,
        label: targetName ? `${label} ${targetName}` : label,
        context: r.ctx,
        createdAt: r.createdAt,
      };
    }),
  });
});
