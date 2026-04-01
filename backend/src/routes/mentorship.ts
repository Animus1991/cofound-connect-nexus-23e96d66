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
    .where(and(eq(mentorAvailability.isAvailable, true), ne(mentorAvailability.userId, userId)))
    .all();

  // Soft filters (post-fetch since SQLite JSON arrays need JS parsing)
  if (expertise) {
    mentors = mentors.filter((m) => {
      const areas: string[] = JSON.parse(m.expertise);
      return areas.some((a) => a.toLowerCase().includes(expertise.toLowerCase()));
    });
  }
  if (stage) {
    mentors = mentors.filter((m) => {
      const industries: string[] = JSON.parse(m.industries);
      return industries.some((i) => i.toLowerCase().includes(stage.toLowerCase()));
    });
  }
  if (availability === "closed") {
    mentors = mentors.filter((m) => !m.isAvailable);
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
      expertise: JSON.parse(m.expertise),
      industries: JSON.parse(m.industries),
      sessionTypes: JSON.parse(m.sessionTypes),
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
      expertise: JSON.parse(mentor.expertise),
      industries: JSON.parse(mentor.industries),
      sessionTypes: JSON.parse(mentor.sessionTypes),
    },
  });
});

// ── PUT /api/mentorship/mine — upsert mentor availability ─────────────────────

const mentorSchema = z.object({
  expertise: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  sessionTypes: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
  maxMentees: z.number().int().min(0).max(20).optional(),
  hourlyRate: z.number().int().min(0).nullable().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  bio: z.string().max(2000).optional(),
});

mentorshipRoutes.put("/mine", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parse = mentorSchema.safeParse(body);
  if (!parse.success) return c.json({ error: "Validation failed", details: parse.error.flatten() }, 400);
  const d = parse.data;

  const existing = db.select({ id: mentorAvailability.id }).from(mentorAvailability)
    .where(eq(mentorAvailability.userId, userId)).get();

  const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (d.expertise !== undefined) payload.expertise = JSON.stringify(d.expertise);
  if (d.industries !== undefined) payload.industries = JSON.stringify(d.industries);
  if (d.sessionTypes !== undefined) payload.sessionTypes = JSON.stringify(d.sessionTypes);
  if (d.isAvailable !== undefined) payload.isAvailable = d.isAvailable;
  if (d.maxMentees !== undefined) payload.maxMentees = d.maxMentees;
  if (d.hourlyRate !== undefined) payload.hourlyRate = d.hourlyRate;
  if (d.currency !== undefined) payload.currency = d.currency;
  if (d.timezone !== undefined) payload.timezone = d.timezone;
  if (d.bio !== undefined) payload.bio = d.bio;

  if (existing) {
    db.update(mentorAvailability).set(payload).where(eq(mentorAvailability.userId, userId)).run();
  } else {
    db.insert(mentorAvailability).values({
      userId,
      expertise: JSON.stringify(d.expertise ?? []),
      industries: JSON.stringify(d.industries ?? []),
      sessionTypes: JSON.stringify(d.sessionTypes ?? []),
      isAvailable: d.isAvailable ?? true,
      maxMentees: d.maxMentees ?? 5,
      hourlyRate: d.hourlyRate ?? null,
      currency: d.currency ?? "USD",
      timezone: d.timezone,
      bio: d.bio,
    }).run();
  }

  const updated = db.select().from(mentorAvailability).where(eq(mentorAvailability.userId, userId)).get();
  return c.json({
    mentor: updated ? {
      ...updated,
      expertise: JSON.parse(updated.expertise),
      industries: JSON.parse(updated.industries),
      sessionTypes: JSON.parse(updated.sessionTypes),
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
