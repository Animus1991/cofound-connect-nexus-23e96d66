import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, opportunities, applications } from "../db/schema.js";
import { eq, and, or, like, desc, inArray, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";
import { upsertOpportunityInIndex } from "../lib/search.js";

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const createOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["cofounder", "job", "freelance"]).optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().max(100).optional(),
  compensation: z.string().max(200).optional(),
  stage: z.string().max(50).optional(),
});

const updateOpportunitySchema = createOpportunitySchema.partial();

const applySchema = z.object({
  message: z.string().max(1000).optional(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export const opportunitiesRoutes = new Hono<AppEnv>();
opportunitiesRoutes.use("*", authMiddleware);

opportunitiesRoutes.get("/", (c) => {
  const search = c.req.query("search");
  const type = c.req.query("type");
  const stage = c.req.query("stage");

  const conditions = [];
  if (type) conditions.push(eq(opportunities.type, type));
  if (stage) conditions.push(eq(opportunities.stage, stage));
  if (search?.trim()) {
    conditions.push(or(like(opportunities.title, `%${search.trim()}%`), like(opportunities.description, `%${search.trim()}%`)));
  }

  const rows = conditions.length > 0
    ? db.select().from(opportunities).where(and(...conditions)).orderBy(desc(opportunities.createdAt)).limit(50).all()
    : db.select().from(opportunities).orderBy(desc(opportunities.createdAt)).limit(50).all();

  // Batch-load owners and application counts
  const ownerIds = [...new Set(rows.map((o) => o.userId))];
  const ownerMap = new Map<string, { id: string; name: string | null }>();
  if (ownerIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ownerIds)).all()
      .forEach((u) => ownerMap.set(u.id, u));
  }
  const oppIds = rows.map((o) => o.id);
  const appCountMap = new Map<string, number>();
  if (oppIds.length > 0) {
    db.select({ opportunityId: applications.opportunityId, count: sql<number>`count(*)` })
      .from(applications).where(inArray(applications.opportunityId, oppIds))
      .groupBy(applications.opportunityId).all()
      .forEach((r) => appCountMap.set(r.opportunityId, r.count));
  }

  return c.json({
    opportunities: rows.map((o) => {
      const owner = ownerMap.get(o.userId);
      return {
        id: o.id, title: o.title, description: o.description, type: o.type,
        skills: parseJsonArray(o.skills), location: o.location, compensation: o.compensation,
        stage: o.stage, orgName: owner?.name ?? "Unknown", applicants: appCountMap.get(o.id) ?? 0, createdAt: o.createdAt,
      };
    }),
  });
});

opportunitiesRoutes.get("/my", (c) => {
  const userId = c.get("userId") as string;
  const rows = db.select().from(opportunities).where(eq(opportunities.userId, userId)).orderBy(desc(opportunities.createdAt)).all();

  // Batch-load application counts
  const myOppIds = rows.map((o) => o.id);
  const myAppCountMap = new Map<string, number>();
  if (myOppIds.length > 0) {
    db.select({ opportunityId: applications.opportunityId, count: sql<number>`count(*)` })
      .from(applications).where(inArray(applications.opportunityId, myOppIds))
      .groupBy(applications.opportunityId).all()
      .forEach((r) => myAppCountMap.set(r.opportunityId, r.count));
  }

  return c.json({
    opportunities: rows.map((o) => ({
      id: o.id, title: o.title, description: o.description, type: o.type,
      skills: parseJsonArray(o.skills), location: o.location, compensation: o.compensation,
      stage: o.stage, applicants: myAppCountMap.get(o.id) ?? 0, createdAt: o.createdAt,
    })),
  });
});

opportunitiesRoutes.post("/", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const parseResult = createOpportunitySchema.safeParse(body);
  if (!parseResult.success) return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);

  const data = parseResult.data;
  const opp = db.insert(opportunities).values({
    userId, title: data.title, description: data.description ?? null,
    type: data.type ?? "cofounder", skills: data.skills ? JSON.stringify(data.skills) : "[]",
    location: data.location ?? null, compensation: data.compensation ?? null, stage: data.stage ?? null,
  }).returning().get();
  logActivity(userId, "opportunity_posted", { opportunityId: opp.id, type: opp.type });
  upsertOpportunityInIndex(opp.id);

  return c.json({ id: opp.id, title: opp.title, type: opp.type, createdAt: opp.createdAt }, 201);
});

opportunitiesRoutes.put("/:id", async (c) => {
  const userId = c.get("userId") as string;
  const id = c.req.param("id");
  const body = await c.req.json();
  const parseResult = updateOpportunitySchema.safeParse(body);
  if (!parseResult.success) return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);

  const existing = db.select({ id: opportunities.id }).from(opportunities).where(and(eq(opportunities.id, id), eq(opportunities.userId, userId))).get();
  if (!existing) return c.json({ error: "Opportunity not found" }, 404);

  const data = parseResult.data;
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
  if (data.location !== undefined) updateData.location = data.location;
  if (data.compensation !== undefined) updateData.compensation = data.compensation;
  if (data.stage !== undefined) updateData.stage = data.stage;

  db.update(opportunities).set(updateData).where(eq(opportunities.id, id)).run();
  upsertOpportunityInIndex(id);
  return c.json({ ok: true });
});

opportunitiesRoutes.post("/:id/apply", async (c) => {
  const userId = c.get("userId") as string;
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parseResult = applySchema.safeParse(body);
  if (!parseResult.success) return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);

  const opp = db.select().from(opportunities).where(eq(opportunities.id, id)).get();
  if (!opp) return c.json({ error: "Opportunity not found" }, 404);
  if (opp.userId === userId) return c.json({ error: "Cannot apply to your own opportunity" }, 400);

  const existing = db.select({ id: applications.id }).from(applications)
    .where(and(eq(applications.opportunityId, id), eq(applications.userId, userId))).get();
  if (existing) return c.json({ error: "Already applied" }, 409);

  db.insert(applications).values({ opportunityId: id, userId, message: parseResult.data.message ?? null }).run();
  logActivity(userId, "application_sent", { opportunityId: id, ownerId: opp.userId });
  return c.json({ ok: true }, 201);
});

opportunitiesRoutes.get("/applications", (c) => {
  const userId = c.get("userId") as string;
  const rows = db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt)).all();

  // Batch-load opportunities and their owners
  const appOppIds = [...new Set(rows.map((a) => a.opportunityId))];
  const oppMap = new Map<string, typeof opportunities.$inferSelect>();
  if (appOppIds.length > 0) {
    db.select().from(opportunities).where(inArray(opportunities.id, appOppIds)).all()
      .forEach((o) => oppMap.set(o.id, o));
  }
  const oppOwnerIds = [...new Set([...oppMap.values()].map((o) => o.userId))];
  const oppOwnerMap = new Map<string, { name: string | null }>();
  if (oppOwnerIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, oppOwnerIds)).all()
      .forEach((u) => oppOwnerMap.set(u.id, u));
  }

  return c.json({
    applications: rows.map((a) => {
      const opp = oppMap.get(a.opportunityId);
      const owner = opp ? oppOwnerMap.get(opp.userId) : null;
      return {
        id: a.id, opportunityId: a.opportunityId, opportunityTitle: opp?.title ?? "Unknown",
        orgName: owner?.name ?? "Unknown", message: a.message, status: a.status, createdAt: a.createdAt,
      };
    }),
  });
});

// Applications received on my opportunities (proposals)
opportunitiesRoutes.get("/received-applications", (c) => {
  const userId = c.get("userId") as string;
  const myOpps = db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.userId, userId)).all();
  const oppIds = myOpps.map((o) => o.id);

  if (oppIds.length === 0) return c.json({ proposals: [] });

  const rows = db.select().from(applications)
    .where(inArray(applications.opportunityId, oppIds))
    .orderBy(desc(applications.createdAt)).all();

  // Batch-load applicants and opportunity details
  const applicantIds = [...new Set(rows.map((a) => a.userId))];
  const applicantMap = new Map<string, { id: string; name: string | null }>();
  if (applicantIds.length > 0) {
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, applicantIds)).all()
      .forEach((u) => applicantMap.set(u.id, u));
  }
  const recvOppMap = new Map<string, { id: string; title: string; type: string | null }>();
  db.select({ id: opportunities.id, title: opportunities.title, type: opportunities.type })
    .from(opportunities).where(inArray(opportunities.id, oppIds)).all()
    .forEach((o) => recvOppMap.set(o.id, o));

  return c.json({
    proposals: rows.map((a) => {
      const applicant = applicantMap.get(a.userId);
      const opp = recvOppMap.get(a.opportunityId);
      const name = applicant?.name ?? "?";
      return {
        id: a.id, fromId: a.userId, fromName: name,
        fromInitials: name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?",
        fromRole: opp?.type === "cofounder" ? "Co-founder" : opp?.type === "job" ? "Applicant" : "Freelancer",
        scope: a.message ?? opp?.title ?? "", timeframe: "", compensation: "",
        message: a.message, status: a.status, createdAt: a.createdAt,
      };
    }),
  });
});

opportunitiesRoutes.patch("/applications/:id", async (c) => {
  const userId = c.get("userId") as string;
  const id = c.req.param("id");
  const body = await c.req.json();
  const parseResult = updateApplicationStatusSchema.safeParse(body);
  if (!parseResult.success) return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);

  const appRow = db.select().from(applications).where(eq(applications.id, id)).get();
  if (!appRow) return c.json({ error: "Application not found" }, 404);

  const opp = db.select().from(opportunities).where(eq(opportunities.id, appRow.opportunityId)).get();
  if (!opp || opp.userId !== userId) return c.json({ error: "Only the opportunity owner can update applications" }, 403);

  db.update(applications).set({ status: parseResult.data.status }).where(eq(applications.id, id)).run();
  return c.json({ ok: true });
});
