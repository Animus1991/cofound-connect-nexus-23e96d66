import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import {
  users, profiles, connections, connectionRequests, opportunities, applications,
  conversations, messages, communities, communityMemberships, mentorshipRequests,
  organizations, tenants, activityLog,
} from "../db/schema.js";
import { eq, count, gte, desc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { z } from "zod";

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use("*", authMiddleware);

// ── GET /api/admin/stats — platform analytics ────────────────────────────────

adminRoutes.get("/stats", (c) => {
  try {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const totalUsers = db.select({ count: count() }).from(users).get()?.count ?? 0;
    const newUsers30d = db.select({ count: count() }).from(users).where(gte(users.createdAt, since30d)).get()?.count ?? 0;
    const completedProfiles = db.select({ count: count() }).from(profiles).get()?.count ?? 0;
    const totalConnections = db.select({ count: count() }).from(connections).get()?.count ?? 0;
    const totalOpportunities = db.select({ count: count() }).from(opportunities).get()?.count ?? 0;
    const totalApplications = db.select({ count: count() }).from(applications).get()?.count ?? 0;
    const totalConversations = db.select({ count: count() }).from(conversations).get()?.count ?? 0;
    const totalMessages = db.select({ count: count() }).from(messages).get()?.count ?? 0;
    const totalCommunities = db.select({ count: count() }).from(communities).get()?.count ?? 0;
    const communityMembers = db.select({ count: count() }).from(communityMemberships).get()?.count ?? 0;
    const mentorRequests = db.select({ count: count() }).from(mentorshipRequests).get()?.count ?? 0;
    const acceptedMentorRequests = db.select({ count: count() }).from(mentorshipRequests)
      .where(eq(mentorshipRequests.status, "accepted")).get()?.count ?? 0;
    const pendingConnectionRequests = db.select({ count: count() }).from(connectionRequests)
      .where(eq(connectionRequests.status, "pending")).get()?.count ?? 0;

    // Recent registrations (last 7 days by day)
    const recentActivity = db.select({
      day: sql<string>`date(created_at)`.as("day"),
      count: count(),
    }).from(users)
      .where(gte(users.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()))
      .groupBy(sql`date(created_at)`)
      .orderBy(sql`date(created_at)`)
      .all();

    return c.json({
      stats: {
        users: { total: totalUsers, new30d: newUsers30d },
        profiles: { completed: completedProfiles },
        connections: { total: totalConnections, pendingRequests: pendingConnectionRequests },
        opportunities: { total: totalOpportunities, applications: totalApplications },
        messaging: { conversations: totalConversations, messages: totalMessages },
        communities: { total: totalCommunities, totalMembers: communityMembers },
        mentorship: { requests: mentorRequests, accepted: acceptedMentorRequests },
        recentActivity,
      },
    });
  } catch (err) {
    logger.error({ err }, "Admin stats failed");
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// ── GET /api/admin/users — list users with filtering ─────────────────────────

adminRoutes.get("/users", (c) => {
  const limit = Math.min(100, parseInt(c.req.query("limit") ?? "50", 10));
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const offset = (page - 1) * limit;

  const allUsers = db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset).all();

  const total = db.select({ count: count() }).from(users).get()?.count ?? 0;

  // Attach profile completion flag
  const userIds = allUsers.map((u) => u.id);
  const profileMap = new Map<string, boolean>();
  if (userIds.length) {
    db.select({ userId: profiles.userId }).from(profiles).all()
      .forEach((p) => profileMap.set(p.userId, true));
  }

  return c.json({
    users: allUsers.map((u) => ({ ...u, hasProfile: profileMap.get(u.id) ?? false })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
});

// ── GET /api/admin/activity — recent platform activity log ───────────────────

adminRoutes.get("/activity", (c) => {
  const limit = Math.min(200, parseInt(c.req.query("limit") ?? "50", 10));
  const events = db.select({
    id: activityLog.id,
    userId: activityLog.userId,
    action: activityLog.action,
    context: activityLog.context,
    createdAt: activityLog.createdAt,
  }).from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit).all();

  const userIds = [...new Set(events.map((e) => e.userId))];
  const eventUsers = userIds.length
    ? db.select({ id: users.id, name: users.name }).from(users)
        .where(sql`id IN (${sql.raw(userIds.map(() => "?").join(","))})`)
        .all()
    : [];
  const userMap = new Map(eventUsers.map((u) => [u.id, u]));

  return c.json({
    events: events.map((e) => ({
      ...e,
      context: JSON.parse(e.context),
      user: { id: e.userId, name: userMap.get(e.userId)?.name ?? "Unknown" },
    })),
  });
});

// ── GET /api/admin/communities — community management ───────────────────────

adminRoutes.get("/communities", (c) => {
  const all = db.select().from(communities).orderBy(desc(communities.createdAt)).all();
  return c.json({
    communities: all.map((c) => ({ ...c, tags: JSON.parse(c.tags) })),
  });
});

// ── Organizations (scaffold) ─────────────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  type: z.enum(["accelerator", "vc", "incubator", "corporate", "community"]),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
});

adminRoutes.get("/organizations", (c) => {
  const all = db.select().from(organizations).all();
  return c.json({ organizations: all });
});

adminRoutes.post("/organizations", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parse = orgSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);
  const org = db.insert(organizations).values({ ...parse.data, ownerId: userId }).returning().get();
  return c.json({ organization: org }, 201);
});

adminRoutes.patch("/organizations/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parse = orgSchema.partial().safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);
  const org = db.update(organizations).set({ ...parse.data, updatedAt: new Date().toISOString() })
    .where(eq(organizations.id, id)).returning().get();
  if (!org) return c.json({ error: "Not found" }, 404);
  return c.json({ organization: org });
});

// ── Tenants (scaffold) ────────────────────────────────────────────────────────

const tenantSchema = z.object({
  organizationId: z.string().uuid(),
  domain: z.string().max(200).optional(),
  customBranding: z.record(z.unknown()).optional(),
  features: z.array(z.string()).optional(),
  maxSeats: z.number().int().min(1).optional(),
});

adminRoutes.get("/tenants", (c) => {
  const all = db.select().from(tenants).all();
  return c.json({
    tenants: all.map((t) => ({
      ...t,
      customBranding: JSON.parse(t.customBranding),
      features: JSON.parse(t.features),
    })),
  });
});

adminRoutes.post("/tenants", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parse = tenantSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);
  const { customBranding, features, ...rest } = parse.data;
  const tenant = db.insert(tenants).values({
    ...rest,
    customBranding: JSON.stringify(customBranding ?? {}),
    features: JSON.stringify(features ?? []),
  }).returning().get();
  return c.json({ tenant }, 201);
});
