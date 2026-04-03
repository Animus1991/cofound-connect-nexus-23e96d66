import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import {
  matchModelVersions,
  matchFeedback,
  matchScores,
  matchInferenceLogs,
  matchOutcomes,
  userBehaviorSignals,
  matchExperiments,
} from "../db/schema.js";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getRecommendations, getActiveModel } from "../lib/matchingEngine.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

app.get("/recommendations", async (c) => {
  const userId = c.get("userId");
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));
  const matchType = c.req.query("matchType") ?? "co-founder";

  const recs = getRecommendations(db as unknown as Parameters<typeof getRecommendations>[0], userId, { limit, matchType });
  return c.json({
    model: getActiveModel(db as unknown as Parameters<typeof getActiveModel>[0]),
    recommendations: recs,
  });
});

const feedbackSchema = z.object({
  targetUserId: z.string().min(1),
  feedbackType: z.enum(["not_relevant", "not_now", "better_fit", "relevant", "hidden", "reported"]),
  feedbackReason: z.string().max(500).optional(),
  matchType: z.string().optional(),
});

app.post("/feedback", async (c) => {
  const userId = c.get("userId");
  const raw = await c.req.json().catch(() => ({}));
  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { targetUserId, feedbackType, feedbackReason, matchType } = parsed.data;
  const { version: modelVersion } = getActiveModel(db as unknown as Parameters<typeof getActiveModel>[0]);
  const now = new Date().toISOString();

  db.insert(matchFeedback).values({
    id: crypto.randomUUID(),
    sourceUserId: userId,
    targetUserId,
    feedbackType,
    feedbackReason: feedbackReason ?? null,
    modelVersion,
    createdAt: now,
  }).onConflictDoUpdate({
    target: [matchFeedback.sourceUserId, matchFeedback.targetUserId],
    set: {
      feedbackType,
      feedbackReason: feedbackReason ?? null,
      modelVersion,
      createdAt: now,
    },
  }).run();

  db.insert(userBehaviorSignals).values({
    id: crypto.randomUUID(),
    userId,
    signalType: "match_feedback",
    targetUserId,
    weight: feedbackType === "relevant" ? 1.2 : feedbackType === "reported" ? 2.0 : 1.0,
    metadata: JSON.stringify({ feedbackType, matchType: matchType ?? (matchType as string | undefined) ?? "co-founder" }),
    createdAt: now,
  }).run();

  return c.json({ ok: true });
});

app.post("/events/shown", async (c) => {
  const userId = c.get("userId");
  const raw = await c.req.json().catch(() => ({}));
  const schemaShown = z.object({
    targetUserId: z.string().min(1),
    matchScoreId: z.string().optional(),
    modelVersion: z.string().optional(),
  });
  const p = schemaShown.safeParse(raw);
  if (!p.success) return c.json({ error: p.error.issues[0]?.message }, 400);

  const now = new Date().toISOString();
  db.insert(matchOutcomes).values({
    id: crypto.randomUUID(),
    sourceUserId: userId,
    targetUserId: p.data.targetUserId,
    matchScoreId: p.data.matchScoreId ?? null,
    modelVersion: p.data.modelVersion ?? null,
    shownAt: now,
    engagementDepth: 1,
    createdAt: now,
  }).run();

  return c.json({ ok: true });
});

app.get("/admin/model-versions", async (c) => {
  const versions = db.select().from(matchModelVersions).orderBy(desc(matchModelVersions.createdAt)).all();
  const active = getActiveModel(db as unknown as Parameters<typeof getActiveModel>[0]);
  return c.json({ versions, active });
});

const setActiveSchema = z.object({ version: z.string().min(1) });

app.put("/admin/model-versions/active", async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  const p = setActiveSchema.safeParse(raw);
  if (!p.success) return c.json({ error: p.error.issues[0]?.message }, 400);

  const v = p.data.version;
  db.update(matchModelVersions).set({ isActive: false }).run();
  db.update(matchModelVersions).set({ isActive: true }).where(eq(matchModelVersions.version, v)).run();
  return c.json({ ok: true, active: getActiveModel(db as unknown as Parameters<typeof getActiveModel>[0]) });
});

app.get("/admin/metrics", async (c) => {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const byModel = db.select({
    modelVersion: matchScores.modelVersion,
    shown: sql<number>`SUM(CASE WHEN mo.shown_at IS NOT NULL THEN 1 ELSE 0 END)`.as("shown"),
    clicked: sql<number>`SUM(CASE WHEN mo.clicked_at IS NOT NULL THEN 1 ELSE 0 END)`.as("clicked"),
    accepted: sql<number>`SUM(CASE WHEN mo.accepted_at IS NOT NULL THEN 1 ELSE 0 END)`.as("accepted"),
    convStarted: sql<number>`SUM(CASE WHEN mo.conversation_started_at IS NOT NULL THEN 1 ELSE 0 END)`.as("convStarted"),
  })
    .from(matchScores)
    .leftJoin(matchOutcomes, and(eq(matchOutcomes.matchScoreId, matchScores.id)))
    .where(sql`${matchScores.computedAt} >= ${since7d}`)
    .groupBy(matchScores.modelVersion)
    .all();

  const feedback = db.select({
    modelVersion: matchFeedback.modelVersion,
    notRelevant: sql<number>`SUM(CASE WHEN feedback_type = 'not_relevant' THEN 1 ELSE 0 END)`.as("notRelevant"),
    relevant: sql<number>`SUM(CASE WHEN feedback_type = 'relevant' THEN 1 ELSE 0 END)`.as("relevant"),
    hidden: sql<number>`SUM(CASE WHEN feedback_type = 'hidden' THEN 1 ELSE 0 END)`.as("hidden"),
    reported: sql<number>`SUM(CASE WHEN feedback_type = 'reported' THEN 1 ELSE 0 END)`.as("reported"),
  })
    .from(matchFeedback)
    .where(sql`${matchFeedback.createdAt} >= ${since7d}`)
    .groupBy(matchFeedback.modelVersion)
    .all();

  const lastInference = db.select({
    modelVersion: matchInferenceLogs.modelVersion,
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(matchInferenceLogs)
    .where(sql`${matchInferenceLogs.createdAt} >= ${since7d}`)
    .groupBy(matchInferenceLogs.modelVersion)
    .all();

  return c.json({ since7d, byModel, feedback, lastInference });
});

app.post("/events/clicked", async (c) => {
  const userId = c.get("userId");
  const raw = await c.req.json().catch(() => ({}));
  const schema = z.object({
    targetUserId: z.string().min(1),
    matchScoreId: z.string().optional(),
    modelVersion: z.string().optional(),
  });
  const p = schema.safeParse(raw);
  if (!p.success) return c.json({ error: p.error.issues[0]?.message }, 400);
  const now = new Date().toISOString();

  const existing = db.select({ id: matchOutcomes.id })
    .from(matchOutcomes)
    .where(and(eq(matchOutcomes.sourceUserId, userId), eq(matchOutcomes.targetUserId, p.data.targetUserId)))
    .get();

  if (existing) {
    db.update(matchOutcomes)
      .set({ clickedAt: now, engagementDepth: sql`${matchOutcomes.engagementDepth} + 1` })
      .where(eq(matchOutcomes.id, existing.id))
      .run();
  } else {
    db.insert(matchOutcomes).values({
      id: crypto.randomUUID(),
      sourceUserId: userId,
      targetUserId: p.data.targetUserId,
      matchScoreId: p.data.matchScoreId ?? null,
      modelVersion: p.data.modelVersion ?? null,
      clickedAt: now,
      engagementDepth: 2,
      createdAt: now,
    }).run();
  }

  db.insert(userBehaviorSignals).values({
    id: crypto.randomUUID(),
    userId,
    signalType: "match_click",
    targetUserId: p.data.targetUserId,
    weight: 1.0,
    metadata: JSON.stringify({ modelVersion: p.data.modelVersion }),
    createdAt: now,
  }).run();

  return c.json({ ok: true });
});

const outcomeSchema = z.object({
  targetUserId: z.string().min(1),
  outcomeType: z.enum(["accepted", "rejected", "conversation_started", "conversation_sustained", "requested"]),
  matchScoreId: z.string().optional(),
  modelVersion: z.string().optional(),
  qualityFlag: z.string().optional(),
});

app.post("/events/outcome", async (c) => {
  const userId = c.get("userId");
  const raw = await c.req.json().catch(() => ({}));
  const p = outcomeSchema.safeParse(raw);
  if (!p.success) return c.json({ error: p.error.issues[0]?.message }, 400);
  const { targetUserId, outcomeType, matchScoreId, modelVersion, qualityFlag } = p.data;
  const now = new Date().toISOString();

  const OUTCOME_FIELD: Record<string, string> = {
    accepted: "accepted_at",
    rejected: "rejected_at",
    conversation_started: "conversation_started_at",
    conversation_sustained: "conversation_sustained_at",
    requested: "requested_at",
  };
  const OUTCOME_DEPTH: Record<string, number> = {
    requested: 3, accepted: 4, conversation_started: 5, conversation_sustained: 6, rejected: 1,
  };

  const existing = db.select({ id: matchOutcomes.id })
    .from(matchOutcomes)
    .where(and(eq(matchOutcomes.sourceUserId, userId), eq(matchOutcomes.targetUserId, targetUserId)))
    .get();

  if (existing) {
    const setClause: Record<string, unknown> = {
      engagementDepth: OUTCOME_DEPTH[outcomeType] ?? 1,
    };
    if (qualityFlag) setClause.qualityFlag = qualityFlag;
    const col = OUTCOME_FIELD[outcomeType];
    if (col === "accepted_at") setClause.acceptedAt = now;
    else if (col === "rejected_at") setClause.rejectedAt = now;
    else if (col === "conversation_started_at") setClause.conversationStartedAt = now;
    else if (col === "conversation_sustained_at") setClause.conversationSustainedAt = now;
    else if (col === "requested_at") setClause.requestedAt = now;

    db.update(matchOutcomes).set(setClause).where(eq(matchOutcomes.id, existing.id)).run();
  } else {
    const insertVals: typeof matchOutcomes.$inferInsert = {
      id: crypto.randomUUID(),
      sourceUserId: userId,
      targetUserId,
      matchScoreId: matchScoreId ?? null,
      modelVersion: modelVersion ?? null,
      engagementDepth: OUTCOME_DEPTH[outcomeType] ?? 1,
      qualityFlag: qualityFlag ?? null,
      createdAt: now,
    };
    if (outcomeType === "accepted") insertVals.acceptedAt = now;
    else if (outcomeType === "rejected") insertVals.rejectedAt = now;
    else if (outcomeType === "conversation_started") insertVals.conversationStartedAt = now;
    else if (outcomeType === "conversation_sustained") insertVals.conversationSustainedAt = now;
    else if (outcomeType === "requested") insertVals.requestedAt = now;
    db.insert(matchOutcomes).values(insertVals).run();
  }

  const SIGNAL_WEIGHT: Record<string, number> = {
    accepted: 1.4, rejected: -0.8, conversation_started: 1.8,
    conversation_sustained: 2.0, requested: 1.2,
  };
  db.insert(userBehaviorSignals).values({
    id: crypto.randomUUID(),
    userId,
    signalType: `outcome_${outcomeType}`,
    targetUserId,
    weight: SIGNAL_WEIGHT[outcomeType] ?? 1.0,
    metadata: JSON.stringify({ modelVersion, outcomeType }),
    createdAt: now,
  }).run();

  return c.json({ ok: true });
});

app.get("/admin/experiments", async (c) => {
  const experiments = db.select().from(matchExperiments).orderBy(desc(matchExperiments.createdAt)).all();
  return c.json({ experiments });
});

const createExperimentSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  strategyA: z.string().min(1),
  strategyB: z.string().min(1),
  trafficSplit: z.number().min(0.05).max(0.95).default(0.5),
});

app.post("/admin/experiments", async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  const p = createExperimentSchema.safeParse(raw);
  if (!p.success) return c.json({ error: p.error.issues[0]?.message }, 400);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.insert(matchExperiments).values({
    id,
    name: p.data.name,
    description: p.data.description ?? null,
    strategyA: p.data.strategyA,
    strategyB: p.data.strategyB,
    trafficSplit: p.data.trafficSplit,
    isActive: false,
    createdAt: now,
  }).run();
  const created = db.select().from(matchExperiments).where(eq(matchExperiments.id, id)).get();
  return c.json({ experiment: created }, 201);
});

app.put("/admin/experiments/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const exp = db.select({ isActive: matchExperiments.isActive }).from(matchExperiments).where(eq(matchExperiments.id, id)).get();
  if (!exp) return c.json({ error: "Not found" }, 404);
  const now = new Date().toISOString();
  const willActivate = !exp.isActive;
  db.update(matchExperiments).set({
    isActive: willActivate,
    startedAt: willActivate ? now : undefined,
    endedAt: !willActivate ? now : undefined,
  }).where(eq(matchExperiments.id, id)).run();
  const updated = db.select().from(matchExperiments).where(eq(matchExperiments.id, id)).get();
  return c.json({ experiment: updated });
});

app.delete("/admin/experiments/:id", async (c) => {
  const id = c.req.param("id");
  db.delete(matchExperiments).where(eq(matchExperiments.id, id)).run();
  return c.json({ ok: true });
});

app.get("/admin/fairness", async (c) => {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const totalShown = db.select({ count: count() }).from(matchOutcomes)
    .where(sql`${matchOutcomes.shownAt} >= ${since7d}`)
    .get();
  const totalExploration = db.select({ count: count() }).from(matchScores)
    .where(and(sql`${matchScores.computedAt} >= ${since7d}`, eq(matchScores.isExplorationMatch, true)))
    .get();
  const totalNewUserBoost = db.select({ count: count() }).from(matchScores)
    .where(and(sql`${matchScores.computedAt} >= ${since7d}`, eq(matchScores.isNewUserBoost, true)))
    .get();
  const totalScores = db.select({ count: count() }).from(matchScores)
    .where(sql`${matchScores.computedAt} >= ${since7d}`)
    .get();
  const totalFeedback = db.select({ count: count() }).from(matchFeedback)
    .where(sql`${matchFeedback.createdAt} >= ${since30d}`)
    .get();
  const negativeFeedback = db.select({ count: count() }).from(matchFeedback)
    .where(and(
      sql`${matchFeedback.createdAt} >= ${since30d}`,
      sql`${matchFeedback.feedbackType} IN ('not_relevant','hidden','reported')`,
    ))
    .get();

  const total = totalScores?.count ?? 0;
  const explorationCount = totalExploration?.count ?? 0;
  const newUserBoostCount = totalNewUserBoost?.count ?? 0;
  const feedbackTotal = totalFeedback?.count ?? 0;
  const negFeedbackTotal = negativeFeedback?.count ?? 0;

  return c.json({
    since7d,
    since30d,
    explorationRate: total > 0 ? explorationCount / total : 0,
    newUserBoostRate: total > 0 ? newUserBoostCount / total : 0,
    negativeFeedbackRate: feedbackTotal > 0 ? negFeedbackTotal / feedbackTotal : 0,
    totalShown: totalShown?.count ?? 0,
    totalScores: total,
    totalFeedback: feedbackTotal,
  });
});

const updateWeightsSchema = z.object({
  weights: z.object({
    explicitWeight: z.number().min(0).max(1),
    semanticWeight: z.number().min(0).max(1),
    behavioralWeight: z.number().min(0).max(1),
    outcomeWeight: z.number().min(0).max(1),
    explorationRate: z.number().min(0).max(0.5),
  }),
  description: z.string().max(500).optional(),
});

app.put("/admin/model-versions/:version/weights", async (c) => {
  const version = c.req.param("version");
  const raw = await c.req.json().catch(() => ({}));
  const p = updateWeightsSchema.safeParse(raw);
  if (!p.success) return c.json({ error: p.error.issues[0]?.message }, 400);
  const existing = db.select({ id: matchModelVersions.id })
    .from(matchModelVersions)
    .where(eq(matchModelVersions.version, version))
    .get();
  if (!existing) return c.json({ error: "Model version not found" }, 404);
  const setVals: Record<string, unknown> = { weights: JSON.stringify(p.data.weights) };
  if (p.data.description) setVals.description = p.data.description;
  db.update(matchModelVersions).set(setVals).where(eq(matchModelVersions.version, version)).run();
  const updated = db.select().from(matchModelVersions).where(eq(matchModelVersions.version, version)).get();
  return c.json({ modelVersion: updated });
});

export default app;
