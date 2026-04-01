import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, profiles, connections, connectionRequests } from "../db/schema.js";
import { eq, and, or, notInArray, inArray, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const requestConnectionSchema = z.object({
  toId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export const connectionsRoutes = new Hono<AppEnv>();
connectionsRoutes.use("*", authMiddleware);

connectionsRoutes.get("/", (c) => {
  const userId = c.get("userId") as string;

  const rows = db.select().from(connections).where(
    or(eq(connections.userId, userId), eq(connections.targetId, userId))
  ).all();

  // Batch-load related users and profiles to avoid N+1
  const otherIds = rows.map((conn) => conn.userId === userId ? conn.targetId : conn.userId);
  const userMap = new Map<string, { id: string; name: string | null }>();
  const profileMap = new Map<string, typeof profiles.$inferSelect>();
  if (otherIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, otherIds)).all()
      .forEach((u) => userMap.set(u.id, u));
    db.select().from(profiles).where(inArray(profiles.userId, otherIds)).all()
      .forEach((p) => profileMap.set(p.userId, p));
  }

  const items = rows.map((conn) => {
    const otherId = conn.userId === userId ? conn.targetId : conn.userId;
    const other = userMap.get(otherId);
    const profile = profileMap.get(otherId);
    return {
      id: conn.id,
      userId: otherId,
      name: other?.name ?? "Unknown",
      headline: profile?.headline ?? null,
      location: profile?.location ?? null,
      skills: parseJsonArray(profile?.skills),
      connectedSince: conn.createdAt,
    };
  });

  return c.json({ connections: items });
});

connectionsRoutes.get("/suggested", (c) => {
  const userId = c.get("userId") as string;

  const conns = db.select({ userId: connections.userId, targetId: connections.targetId })
    .from(connections)
    .where(or(eq(connections.userId, userId), eq(connections.targetId, userId)))
    .all();

  const reqs = db.select({ fromId: connectionRequests.fromId, toId: connectionRequests.toId })
    .from(connectionRequests)
    .where(and(
      or(eq(connectionRequests.fromId, userId), eq(connectionRequests.toId, userId)),
      eq(connectionRequests.status, "pending"),
    ))
    .all();

  const excludeIds = new Set<string>([userId]);
  conns.forEach((conn) => { excludeIds.add(conn.userId); excludeIds.add(conn.targetId); });
  reqs.forEach((r) => { excludeIds.add(r.fromId); excludeIds.add(r.toId); });

  const excludeArr = [...excludeIds];
  const suggested = excludeArr.length > 0
    ? db.select().from(users).where(notInArray(users.id, excludeArr)).orderBy(desc(users.createdAt)).limit(20).all()
    : db.select().from(users).orderBy(desc(users.createdAt)).limit(20).all();

  // Batch-load profiles for all suggested users
  const suggestedIds = suggested.map((u) => u.id);
  const suggestedProfileMap = new Map<string, typeof profiles.$inferSelect>();
  if (suggestedIds.length > 0) {
    db.select().from(profiles).where(inArray(profiles.userId, suggestedIds)).all()
      .forEach((p) => suggestedProfileMap.set(p.userId, p));
  }

  return c.json({
    suggested: suggested.map((u) => {
      const profile = suggestedProfileMap.get(u.id);
      const skills = parseJsonArray(profile?.skills);
      return {
        id: u.id,
        name: u.name ?? "Unknown",
        headline: profile?.headline ?? null,
        skills,
        matchScore: Math.min(95, 50 + skills.length * 5),
        reason: skills.length > 0 ? `Shares skills: ${skills.slice(0, 3).join(", ")}` : "New to the platform",
        mutualConnections: 0,
      };
    }),
  });
});

connectionsRoutes.get("/requests", (c) => {
  const userId = c.get("userId") as string;

  const incoming = db.select().from(connectionRequests)
    .where(and(eq(connectionRequests.toId, userId), eq(connectionRequests.status, "pending")))
    .orderBy(desc(connectionRequests.createdAt)).all();

  const outgoing = db.select().from(connectionRequests)
    .where(and(eq(connectionRequests.fromId, userId), eq(connectionRequests.status, "pending")))
    .orderBy(desc(connectionRequests.createdAt)).all();

  // Batch-load users and profiles for all request participants
  const reqUserIds = [...new Set([...incoming.map((r) => r.fromId), ...outgoing.map((r) => r.toId)])];
  const reqUserMap = new Map<string, { id: string; name: string | null }>();
  const reqProfileMap = new Map<string, typeof profiles.$inferSelect>();
  if (reqUserIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, reqUserIds)).all()
      .forEach((u) => reqUserMap.set(u.id, u));
    db.select().from(profiles).where(inArray(profiles.userId, reqUserIds)).all()
      .forEach((p) => reqProfileMap.set(p.userId, p));
  }

  return c.json({
    incoming: incoming.map((r) => {
      const from = reqUserMap.get(r.fromId);
      const profile = reqProfileMap.get(r.fromId);
      return { id: r.id, fromId: r.fromId, name: from?.name ?? "Unknown", headline: profile?.headline ?? null, message: r.message, createdAt: r.createdAt };
    }),
    outgoing: outgoing.map((r) => {
      const to = reqUserMap.get(r.toId);
      const profile = reqProfileMap.get(r.toId);
      return { id: r.id, toId: r.toId, name: to?.name ?? "Unknown", headline: profile?.headline ?? null, message: r.message, createdAt: r.createdAt };
    }),
  });
});

connectionsRoutes.post("/request", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const parseResult = requestConnectionSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
  }

  const { toId, message } = parseResult.data;
  if (toId === userId) return c.json({ error: "Cannot connect to yourself" }, 400);

  const existingConn = db.select({ id: connections.id }).from(connections).where(
    or(and(eq(connections.userId, userId), eq(connections.targetId, toId)), and(eq(connections.userId, toId), eq(connections.targetId, userId)))
  ).get();
  if (existingConn) return c.json({ error: "Already connected" }, 409);

  const existingReq = db.select({ id: connectionRequests.id }).from(connectionRequests).where(
    and(
      or(
        and(eq(connectionRequests.fromId, userId), eq(connectionRequests.toId, toId)),
        and(eq(connectionRequests.fromId, toId), eq(connectionRequests.toId, userId)),
      ),
      eq(connectionRequests.status, "pending"),
    )
  ).get();
  if (existingReq) return c.json({ error: "Request already exists" }, 409);

  const req = db.insert(connectionRequests).values({ fromId: userId, toId, message: message ?? null }).returning().get();
  logActivity(userId, "intro_sent", { toId, requestId: req.id });
  return c.json({ id: req.id, ok: true }, 201);
});

connectionsRoutes.post("/requests/:id/accept", (c) => {
  const userId = c.get("userId") as string;
  const id = c.req.param("id");

  const connReq = db.select().from(connectionRequests)
    .where(and(eq(connectionRequests.id, id), eq(connectionRequests.toId, userId), eq(connectionRequests.status, "pending")))
    .get();
  if (!connReq) return c.json({ error: "Request not found or already handled" }, 404);

  db.transaction((tx) => {
    tx.update(connectionRequests).set({ status: "accepted" }).where(eq(connectionRequests.id, id)).run();
    tx.insert(connections).values({ userId: connReq.fromId, targetId: connReq.toId }).run();
    tx.insert(connections).values({ userId: connReq.toId, targetId: connReq.fromId }).run();
  });
  logActivity(userId, "connection_made", { withUserId: connReq.fromId, requestId: id });

  return c.json({ ok: true });
});

connectionsRoutes.post("/requests/:id/decline", (c) => {
  const userId = c.get("userId") as string;
  const id = c.req.param("id");

  const connReq = db.select().from(connectionRequests)
    .where(and(eq(connectionRequests.id, id), eq(connectionRequests.toId, userId), eq(connectionRequests.status, "pending")))
    .get();
  if (!connReq) return c.json({ error: "Request not found or already handled" }, 404);

  db.update(connectionRequests).set({ status: "declined" }).where(eq(connectionRequests.id, id)).run();
  return c.json({ ok: true });
});
