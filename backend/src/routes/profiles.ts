import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, profiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { upsertUserInIndex } from "../lib/search.js";
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

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  availability: z.string().max(50).optional(),
  stage: z.string().max(50).optional(),
  commitment: z.string().max(50).optional(),
  compensation: z.string().max(100).optional(),
  lookingFor: z.string().max(100).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  linkedin: z.string().max(200).optional(),
  github: z.string().max(200).optional(),
  website: z.string().max(200).optional(),
});

export const profilesRoutes = new Hono<AppEnv>();
profilesRoutes.use("*", authMiddleware);

profilesRoutes.get("/me", (c) => {
  const userId = c.get("userId") as string;
  const user = db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).get();
  if (!user) return c.json({ error: "User not found" }, 404);

  const profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
  const p = profile ?? { headline: null, bio: null, location: null, availability: null, stage: null, commitment: null, compensation: null, lookingFor: null, skills: "[]", interests: "[]", linkedin: null, github: null, website: null };

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    profile: { ...p, skills: parseJsonArray(p.skills), interests: parseJsonArray(p.interests) },
  });
});

profilesRoutes.get("/:userId", (c) => {
  const targetUserId = c.req.param("userId");
  const user = db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, targetUserId)).get();
  if (!user) return c.json({ error: "Profile not found" }, 404);

  const profile = db.select().from(profiles).where(eq(profiles.userId, targetUserId)).get();
  return c.json({
    name: user.name,
    ...profile,
    skills: parseJsonArray(profile?.skills),
    interests: parseJsonArray(profile?.interests),
  });
});

profilesRoutes.put("/me", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const parseResult = profileUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
  }

  const data = parseResult.data;
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    db.update(users).set({ name: data.name }).where(eq(users.id, userId)).run();
  }
  if (data.headline !== undefined) updateData.headline = data.headline;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.availability !== undefined) updateData.availability = data.availability;
  if (data.stage !== undefined) updateData.stage = data.stage;
  if (data.commitment !== undefined) updateData.commitment = data.commitment;
  if (data.compensation !== undefined) updateData.compensation = data.compensation;
  if (data.lookingFor !== undefined) updateData.lookingFor = data.lookingFor;
  if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
  if (data.interests !== undefined) updateData.interests = JSON.stringify(data.interests);
  if (data.linkedin !== undefined) updateData.linkedin = data.linkedin || null;
  if (data.github !== undefined) updateData.github = data.github || null;
  if (data.website !== undefined) updateData.website = data.website || null;

  // Upsert profile
  const existing = db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).get();
  let profile;
  if (existing) {
    db.update(profiles).set(updateData).where(eq(profiles.userId, userId)).run();
    profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get()!;
  } else {
    profile = db.insert(profiles).values({ userId, ...updateData } as typeof profiles.$inferInsert).returning().get();
  }

  upsertUserInIndex(userId);
  logActivity(userId, "profile_updated", {});

  return c.json({
    ...profile,
    skills: parseJsonArray(profile.skills),
    interests: parseJsonArray(profile.interests),
  });
});
