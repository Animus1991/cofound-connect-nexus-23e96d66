import { Hono } from "hono";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { milestones } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";
import { logActivity } from "../lib/activity.js";

export const milestonesRoutes = new Hono<AppEnv>();

milestonesRoutes.use("*", authMiddleware);

// ── List user's milestones ────────────────────────────────────────────────────
milestonesRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const status = c.req.query("status");

  const rows = await db
    .select()
    .from(milestones)
    .where(
      status && status !== "all"
        ? and(eq(milestones.userId, userId), eq(milestones.status, status))
        : eq(milestones.userId, userId)
    )
    .orderBy(asc(milestones.sortOrder), asc(milestones.createdAt));

  return c.json({ milestones: rows });
});

// ── Create milestone ──────────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["Product", "Business", "Team", "Fundraising", "Marketing", "Legal"]).default("Product"),
  status: z.enum(["completed", "in-progress", "upcoming", "at-risk"]).default("upcoming"),
  targetDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  progress: z.number().min(0).max(100).default(0),
});

milestonesRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const raw = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400);
  const body = parsed.data;

  // Sort order = max existing + 1
  const existing = await db
    .select({ sortOrder: milestones.sortOrder })
    .from(milestones)
    .where(eq(milestones.userId, userId))
    .orderBy(asc(milestones.sortOrder));

  const maxOrder = existing.length > 0 ? Math.max(...existing.map((r) => r.sortOrder)) + 1 : 0;

  const [row] = await db
    .insert(milestones)
    .values({
      userId,
      title: body.title,
      category: body.category,
      status: body.status,
      targetDate: body.targetDate ?? null,
      notes: body.notes ?? null,
      progress: body.progress,
      sortOrder: maxOrder,
    })
    .returning();

  await logActivity(userId, "milestone_created", { milestoneId: row.id, title: row.title });

  return c.json({ milestone: row }, 201);
});

// ── Update milestone ──────────────────────────────────────────────────────────
const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.enum(["Product", "Business", "Team", "Fundraising", "Marketing", "Legal"]).optional(),
  status: z.enum(["completed", "in-progress", "upcoming", "at-risk"]).optional(),
  targetDate: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

milestonesRoutes.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();
  const raw = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400);
  const body = parsed.data;

  const [existing] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.id, id), eq(milestones.userId, userId)));

  if (!existing) return c.json({ error: "Not found" }, 404);

  const [updated] = await db
    .update(milestones)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.targetDate !== undefined && { targetDate: body.targetDate }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(milestones.id, id), eq(milestones.userId, userId)))
    .returning();

  return c.json({ milestone: updated });
});

// ── Delete milestone ──────────────────────────────────────────────────────────
milestonesRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.id, id), eq(milestones.userId, userId)));

  if (!existing) return c.json({ error: "Not found" }, 404);

  await db.delete(milestones).where(and(eq(milestones.id, id), eq(milestones.userId, userId)));

  return c.json({ success: true });
});
