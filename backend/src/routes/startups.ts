import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types.js";
import { db } from "../db/index.js";
import { startupProfiles, startupTeamMembers, users } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

export const startupsRoutes = new Hono<AppEnv>();

startupsRoutes.use("*", authMiddleware);

const upsertSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
  stage: z.enum(["idea", "mvp", "early_traction", "growth", "scale"]).optional(),
  fundingStatus: z.string().max(100).optional(),
  techStack: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/startups/mine
startupsRoutes.get("/mine", (c) => {
  const userId = c.get("userId");
  const startup = db.select().from(startupProfiles).where(eq(startupProfiles.ownerId, userId)).get();
  if (!startup) return c.json({ startup: null });

  const members = db.select().from(startupTeamMembers)
    .where(eq(startupTeamMembers.startupId, startup.id)).all();

  const memberUserIds = members.map((m) => m.userId);
  const memberUsers = memberUserIds.length > 0
    ? db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(inArray(users.id, memberUserIds)).all()
    : [];

  const userMap = new Map(memberUsers.map((u) => [u.id, u]));

  return c.json({
    startup: {
      ...startup,
      techStack: JSON.parse(startup.techStack),
      tags: JSON.parse(startup.tags),
      members: members.map((m) => ({ ...m, user: userMap.get(m.userId) ?? null })),
    },
  });
});

// GET /api/startups/:id
startupsRoutes.get("/:id", (c) => {
  const startup = db.select().from(startupProfiles)
    .where(eq(startupProfiles.id, c.req.param("id"))).get();
  if (!startup) return c.json({ error: "Not found" }, 404);
  if (!startup.isPublic && startup.ownerId !== c.get("userId")) {
    return c.json({ error: "Not found" }, 404);
  }

  const members = db.select().from(startupTeamMembers)
    .where(eq(startupTeamMembers.startupId, startup.id)).all();

  const memberUserIds = members.map((m) => m.userId);
  const memberUsers = memberUserIds.length > 0
    ? db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(inArray(users.id, memberUserIds)).all()
    : [];

  const userMap = new Map(memberUsers.map((u) => [u.id, u]));

  return c.json({
    startup: {
      ...startup,
      techStack: JSON.parse(startup.techStack),
      tags: JSON.parse(startup.tags),
      members: members.map((m) => ({ ...m, user: userMap.get(m.userId) ?? null })),
    },
  });
});

// POST /api/startups — create
startupsRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parse = upsertSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const existing = db.select({ id: startupProfiles.id }).from(startupProfiles)
    .where(eq(startupProfiles.ownerId, userId)).get();
  if (existing) return c.json({ error: "You already have a startup profile. Use PUT to update it." }, 409);

  const { techStack, tags, ...rest } = parse.data;
  const startup = db.insert(startupProfiles).values({
    ownerId: userId,
    techStack: JSON.stringify(techStack ?? []),
    tags: JSON.stringify(tags ?? []),
    ...rest,
  }).returning().get();

  // Add owner as team member automatically
  db.insert(startupTeamMembers).values({
    startupId: startup.id,
    userId,
    role: "owner",
    title: "Founder",
  }).run();

  logActivity(userId, "startup_created", { startupId: startup.id });

  return c.json({ startup: { ...startup, techStack: techStack ?? [], tags: tags ?? [], members: [] } }, 201);
});

// PUT /api/startups/:id — update
startupsRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const startupId = c.req.param("id");
  const startup = db.select().from(startupProfiles)
    .where(and(eq(startupProfiles.id, startupId), eq(startupProfiles.ownerId, userId))).get();
  if (!startup) return c.json({ error: "Not found or not your startup" }, 404);

  const body = await c.req.json();
  const parse = upsertSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const { techStack, tags, ...rest } = parse.data;
  const updated = db.update(startupProfiles).set({
    ...(techStack !== undefined ? { techStack: JSON.stringify(techStack) } : {}),
    ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
    ...rest,
    updatedAt: new Date().toISOString(),
  }).where(eq(startupProfiles.id, startupId)).returning().get();

  logActivity(userId, "startup_updated", { startupId });

  return c.json({ startup: { ...updated, techStack: JSON.parse(updated.techStack), tags: JSON.parse(updated.tags) } });
});

// POST /api/startups/:id/members — add team member
startupsRoutes.post("/:id/members", async (c) => {
  const userId = c.get("userId");
  const startupId = c.req.param("id");
  const startup = db.select({ id: startupProfiles.id }).from(startupProfiles)
    .where(and(eq(startupProfiles.id, startupId), eq(startupProfiles.ownerId, userId))).get();
  if (!startup) return c.json({ error: "Not found or not your startup" }, 404);

  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const parse = z.object({
    userId: z.string().uuid(),
    role: z.enum(["cofounder", "member", "advisor"]).default("member"),
    title: z.string().max(100).optional(),
  }).safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const existing = db.select({ id: startupTeamMembers.id }).from(startupTeamMembers)
    .where(and(eq(startupTeamMembers.startupId, startupId), eq(startupTeamMembers.userId, parse.data.userId))).get();
  if (existing) return c.json({ error: "User is already a team member" }, 409);

  const member = db.insert(startupTeamMembers).values({
    startupId,
    userId: parse.data.userId,
    role: parse.data.role,
    title: parse.data.title,
  }).returning().get();

  return c.json({ member }, 201);
});

// DELETE /api/startups/:id/members/:userId — remove team member (not owner)
startupsRoutes.delete("/:id/members/:memberId", (c) => {
  const requesterId = c.get("userId");
  const startupId = c.req.param("id");
  const memberId = c.req.param("memberId");

  const startup = db.select({ id: startupProfiles.id, ownerId: startupProfiles.ownerId })
    .from(startupProfiles).where(eq(startupProfiles.id, startupId)).get();
  if (!startup) return c.json({ error: "Not found" }, 404);
  if (startup.ownerId !== requesterId && memberId !== requesterId) {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (memberId === startup.ownerId) {
    return c.json({ error: "Cannot remove the startup owner from the team" }, 400);
  }

  db.delete(startupTeamMembers)
    .where(and(eq(startupTeamMembers.startupId, startupId), eq(startupTeamMembers.userId, memberId)))
    .run();

  return c.json({ ok: true });
});
