import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { mentorAvailability, mentorshipRequests, users, profiles } from "../db/schema.js";
import { eq, and, ne, inArray } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { logActivity } from "../lib/activity.js";
import { z } from "zod";

export const mentorshipRoutes = new Hono<AppEnv>();
mentorshipRoutes.use("*", authMiddleware);

// ── GET /api/mentorship — list public mentor profiles ─────────────────────────

mentorshipRoutes.get("/", (c) => {
  const userId = c.get("userId");
  const expertise = c.req.query("expertise");
  const stage = c.req.query("stage");
  const availability = c.req.query("availability");

  let mentors = db.select().from(mentorAvailability)
    .where(and(eq(mentorAvailability.isPublic, true), ne(mentorAvailability.userId, userId)))
    .all();

  // Soft filters (post-fetch since SQLite JSON arrays need JS parsing)
  if (expertise) {
    mentors = mentors.filter((m) => {
      const areas: string[] = JSON.parse(m.expertiseAreas);
      return areas.some((a) => a.toLowerCase().includes(expertise.toLowerCase()));
    });
  }
  if (stage) {
    mentors = mentors.filter((m) => {
      const stages: string[] = JSON.parse(m.stagesServed);
      return stages.includes(stage);
    });
  }
  if (availability) {
    mentors = mentors.filter((m) => m.availabilityStatus === availability);
  }

  const mentorIds = mentors.map((m) => m.userId);
  const mentorUsers = mentorIds.length
    ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, mentorIds)).all()
    : [];
  const mentorProfiles = mentorIds.length
    ? db.select({ userId: profiles.userId, headline: profiles.headline, location: profiles.location })
        .from(profiles).where(inArray(profiles.userId, mentorIds)).all()
    : [];

  const userMap = new Map(mentorUsers.map((u) => [u.id, u]));
  const profileMap = new Map(mentorProfiles.map((p) => [p.userId, p]));

  // Check existing requests from this user
  const myRequests = db.select({ mentorId: mentorshipRequests.mentorId, status: mentorshipRequests.status })
    .from(mentorshipRequests).where(eq(mentorshipRequests.menteeId, userId)).all();
  const requestMap = new Map(myRequests.map((r) => [r.mentorId, r.status]));

  return c.json({
    mentors: mentors.map((m) => ({
      ...m,
      expertiseAreas: JSON.parse(m.expertiseAreas),
      stagesServed: JSON.parse(m.stagesServed),
      industries: JSON.parse(m.industries),
      name: userMap.get(m.userId)?.name ?? "Unknown",
      headline: profileMap.get(m.userId)?.headline ?? null,
      location: profileMap.get(m.userId)?.location ?? null,
      requestStatus: requestMap.get(m.userId) ?? null,
    })),
  });
});

// ── GET /api/mentorship/mine — get my mentor profile ─────────────────────────

mentorshipRoutes.get("/mine", (c) => {
  const userId = c.get("userId");
  const mentor = db.select().from(mentorAvailability).where(eq(mentorAvailability.userId, userId)).get();
  if (!mentor) return c.json({ mentor: null });
  return c.json({
    mentor: {
      ...mentor,
      expertiseAreas: JSON.parse(mentor.expertiseAreas),
      stagesServed: JSON.parse(mentor.stagesServed),
      industries: JSON.parse(mentor.industries),
    },
  });
});

// ── PUT /api/mentorship/mine — upsert mentor availability ─────────────────────

const mentorSchema = z.object({
  expertiseAreas: z.array(z.string()).optional(),
  stagesServed: z.array(z.string()).optional(),
  availabilityStatus: z.enum(["open", "limited", "closed"]).optional(),
  sessionFormat: z.enum(["1-on-1", "group", "async"]).optional(),
  sessionFrequency: z.enum(["weekly", "bi-weekly", "monthly"]).optional(),
  maxMentees: z.number().int().min(0).max(20).optional(),
  hourlyRate: z.number().int().min(0).nullable().optional(),
  currency: z.string().optional(),
  bio: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  industries: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

mentorshipRoutes.put("/mine", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parse = mentorSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);
  const d = parse.data;

  const existing = db.select({ id: mentorAvailability.id }).from(mentorAvailability)
    .where(eq(mentorAvailability.userId, userId)).get();

  const payload = {
    ...(d.expertiseAreas !== undefined ? { expertiseAreas: JSON.stringify(d.expertiseAreas) } : {}),
    ...(d.stagesServed !== undefined ? { stagesServed: JSON.stringify(d.stagesServed) } : {}),
    ...(d.industries !== undefined ? { industries: JSON.stringify(d.industries) } : {}),
    ...(d.availabilityStatus !== undefined ? { availabilityStatus: d.availabilityStatus } : {}),
    ...(d.sessionFormat !== undefined ? { sessionFormat: d.sessionFormat } : {}),
    ...(d.sessionFrequency !== undefined ? { sessionFrequency: d.sessionFrequency } : {}),
    ...(d.maxMentees !== undefined ? { maxMentees: d.maxMentees } : {}),
    ...(d.hourlyRate !== undefined ? { hourlyRate: d.hourlyRate } : {}),
    ...(d.currency !== undefined ? { currency: d.currency } : {}),
    ...(d.bio !== undefined ? { bio: d.bio } : {}),
    ...(d.linkedinUrl !== undefined ? { linkedinUrl: d.linkedinUrl } : {}),
    ...(d.isPublic !== undefined ? { isPublic: d.isPublic } : {}),
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    db.update(mentorAvailability).set(payload).where(eq(mentorAvailability.userId, userId)).run();
  } else {
    db.insert(mentorAvailability).values({
      userId,
      expertiseAreas: JSON.stringify(d.expertiseAreas ?? []),
      stagesServed: JSON.stringify(d.stagesServed ?? []),
      industries: JSON.stringify(d.industries ?? []),
      availabilityStatus: d.availabilityStatus ?? "open",
      sessionFormat: d.sessionFormat ?? "1-on-1",
      sessionFrequency: d.sessionFrequency ?? "monthly",
      maxMentees: d.maxMentees ?? 3,
      hourlyRate: d.hourlyRate ?? null,
      currency: d.currency ?? "USD",
      bio: d.bio,
      linkedinUrl: d.linkedinUrl,
      isPublic: d.isPublic ?? true,
    }).run();
  }

  const updated = db.select().from(mentorAvailability).where(eq(mentorAvailability.userId, userId)).get();
  return c.json({
    mentor: updated ? {
      ...updated,
      expertiseAreas: JSON.parse(updated.expertiseAreas),
      stagesServed: JSON.parse(updated.stagesServed),
      industries: JSON.parse(updated.industries),
    } : null,
  });
});

// ── POST /api/mentorship/requests — send mentorship request ──────────────────

const requestSchema = z.object({
  mentorId: z.string().uuid(),
  note: z.string().max(1000).optional(),
  goals: z.string().max(2000).optional(),
});

mentorshipRoutes.post("/requests", async (c) => {
  const menteeId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parse = requestSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);

  const { mentorId, note, goals } = parse.data;
  if (mentorId === menteeId) return c.json({ error: "Cannot request yourself as mentor" }, 400);

  const existing = db.select({ id: mentorshipRequests.id })
    .from(mentorshipRequests)
    .where(and(eq(mentorshipRequests.menteeId, menteeId), eq(mentorshipRequests.mentorId, mentorId))).get();
  if (existing) return c.json({ error: "Request already sent" }, 409);

  const req = db.insert(mentorshipRequests).values({ menteeId, mentorId, note, goals }).returning().get();
  logActivity(menteeId, "mentorship_requested", { mentorId });

  return c.json({ request: req }, 201);
});

// ── GET /api/mentorship/requests — list my sent requests ─────────────────────

mentorshipRoutes.get("/requests", (c) => {
  const userId = c.get("userId");
  const sent = db.select().from(mentorshipRequests).where(eq(mentorshipRequests.menteeId, userId)).all();
  const received = db.select().from(mentorshipRequests).where(eq(mentorshipRequests.mentorId, userId)).all();

  const allIds = [...new Set([
    ...sent.map((r) => r.mentorId),
    ...received.map((r) => r.menteeId),
  ])];
  const relatedUsers = allIds.length
    ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, allIds)).all()
    : [];
  const userMap = new Map(relatedUsers.map((u) => [u.id, u]));

  return c.json({
    sent: sent.map((r) => ({ ...r, mentor: { id: r.mentorId, name: userMap.get(r.mentorId)?.name ?? "Unknown" } })),
    received: received.map((r) => ({ ...r, mentee: { id: r.menteeId, name: userMap.get(r.menteeId)?.name ?? "Unknown" } })),
  });
});

// ── PATCH /api/mentorship/requests/:id — accept / decline ────────────────────

mentorshipRoutes.patch("/requests/:id", async (c) => {
  const userId = c.get("userId");
  const reqId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const status = z.enum(["accepted", "declined", "completed"]).safeParse((body as Record<string, unknown>).status);
  if (!status.success) return c.json({ error: "Invalid status" }, 400);

  const request = db.select().from(mentorshipRequests).where(eq(mentorshipRequests.id, reqId)).get();
  if (!request) return c.json({ error: "Not found" }, 404);
  if (request.mentorId !== userId) return c.json({ error: "Forbidden" }, 403);

  db.update(mentorshipRequests).set({ status: status.data, updatedAt: new Date().toISOString() })
    .where(eq(mentorshipRequests.id, reqId)).run();

  return c.json({ ok: true });
});
