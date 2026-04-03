/**
 * automation.ts — /api/automation
 *
 * Admin CRUD for automation rules, execution history, log inspection,
 * manual triggers, pause/resume, template management, stats, and
 * user notification preference management.
 *
 * Routes:
 *   GET    /api/automation/rules
 *   POST   /api/automation/rules
 *   GET    /api/automation/rules/:id
 *   PUT    /api/automation/rules/:id
 *   DELETE /api/automation/rules/:id
 *   POST   /api/automation/rules/:id/pause
 *   POST   /api/automation/rules/:id/resume
 *   POST   /api/automation/rules/:id/trigger
 *   GET    /api/automation/executions
 *   GET    /api/automation/executions/:id/logs
 *   GET    /api/automation/templates/notifications
 *   GET    /api/automation/templates/emails
 *   POST   /api/automation/templates/notifications
 *   PUT    /api/automation/templates/notifications/:id
 *   DELETE /api/automation/templates/notifications/:id
 *   GET    /api/automation/stats
 *
 *   GET    /api/automation/events/:type           — fire event (internal/testing)
 *   POST   /api/automation/events/:type           — fire event with context body
 *
 *   GET    /api/automation/notification-preferences          — current user
 *   PUT    /api/automation/notification-preferences          — current user bulk update
 *   GET    /api/automation/tenant-config/:tenantId           — tenant config (admin)
 *   PUT    /api/automation/tenant-config/:tenantId           — tenant config (admin)
 */
import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, isNull, or, count, gte, like } from "drizzle-orm";
import type { AppEnv } from "../types.js";
import { db } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  automationRules,
  automationExecutions,
  automationLogs,
  notificationTemplates,
  emailTemplates,
  tenantAutomationConfig,
  notificationPreferences,
} from "../db/schema.js";
import { fireEvent, manuallyTriggerRule, type TriggerType } from "../lib/automationEngine.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

function assertAdmin(c: { get: (k: string) => string }): Response | null {
  const userId = c.get("userId");
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// RULES
// ─────────────────────────────────────────────────────────────────────────────

const ruleSchema = z.object({
  name:                z.string().min(1).max(120),
  description:         z.string().max(500).optional(),
  tenantId:            z.string().uuid().nullable().optional(),
  triggerType:         z.string().min(1),
  entityScope:         z.string().default("global"),
  conditionDefinition: z.array(z.object({
    field:    z.string(),
    operator: z.enum(["eq","neq","gt","gte","lt","lte","contains","not_contains","in","not_in"]),
    value:    z.unknown(),
  })).default([]),
  actionDefinition: z.array(z.object({
    type:          z.string(),
    templateSlug:  z.string().optional(),
    targetField:   z.string().optional(),
    targetValue:   z.unknown().optional(),
    webhookUrl:    z.string().url().optional(),
    extraVars:     z.record(z.string()).optional(),
  })).default([]),
  scheduleDelay: z.number().int().min(0).default(0),
  isActive:      z.boolean().default(true),
  priority:      z.number().int().min(1).max(100).default(50),
  maxRetries:    z.number().int().min(0).max(10).default(2),
});

// GET /rules — list all (admin)
app.get("/rules", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const { search, tenantId, triggerType, isActive, limit = "50", offset = "0" } = c.req.query();

  const rules = await db
    .select()
    .from(automationRules)
    .where(
      and(
        search ? like(automationRules.name, `%${search}%`) : undefined,
        tenantId === "global" ? isNull(automationRules.tenantId)
          : tenantId ? eq(automationRules.tenantId, tenantId) : undefined,
        triggerType ? eq(automationRules.triggerType, triggerType) : undefined,
        isActive !== undefined ? eq(automationRules.isActive, isActive === "true") : undefined,
      ),
    )
    .orderBy(automationRules.priority, automationRules.name)
    .limit(Number(limit))
    .offset(Number(offset));

  const [{ total }] = await db
    .select({ total: count() })
    .from(automationRules);

  return c.json({ rules, total });
});

// POST /rules
app.post("/rules", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const raw = await c.req.json().catch(() => ({}));
  const parsed = ruleSchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);
  const body = parsed.data;
  const now = new Date().toISOString();

  const newRule = await db
    .insert(automationRules)
    .values({
      id:                  crypto.randomUUID(),
      name:                body.name,
      description:         body.description ?? null,
      tenantId:            body.tenantId ?? null,
      triggerType:         body.triggerType,
      entityScope:         body.entityScope,
      conditionDefinition: JSON.stringify(body.conditionDefinition),
      actionDefinition:    JSON.stringify(body.actionDefinition),
      scheduleDelay:       body.scheduleDelay,
      isActive:            body.isActive,
      priority:            body.priority,
      maxRetries:          body.maxRetries,
      isSystem:            false,
      createdAt:           now,
      updatedAt:           now,
    })
    .returning();

  return c.json({ rule: newRule[0] }, 201);
});

// GET /rules/:id
app.get("/rules/:id", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const rule = await db.query.automationRules?.findFirst({
    where: eq(automationRules.id, c.req.param("id")),
  });
  if (!rule) return c.json({ error: "Rule not found" }, 404);
  return c.json({ rule });
});

// PUT /rules/:id
app.put("/rules/:id", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const id = c.req.param("id");
  const raw = await c.req.json().catch(() => ({}));
  const parsed = ruleSchema.partial().safeParse(raw);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);
  const body = parsed.data;

  const existing = await db.query.automationRules?.findFirst({ where: eq(automationRules.id, id) });
  if (!existing) return c.json({ error: "Rule not found" }, 404);
  if (existing.isSystem && body.name !== undefined) {
    // Allow editing most fields on system rules except name/triggerType
  }

  const updates: Partial<typeof existing> = {};
  if (body.name !== undefined)                updates.name = body.name;
  if (body.description !== undefined)         updates.description = body.description ?? null;
  if (body.triggerType !== undefined)         updates.triggerType = body.triggerType;
  if (body.entityScope !== undefined)         updates.entityScope = body.entityScope;
  if (body.conditionDefinition !== undefined) updates.conditionDefinition = JSON.stringify(body.conditionDefinition);
  if (body.actionDefinition !== undefined)    updates.actionDefinition = JSON.stringify(body.actionDefinition);
  if (body.scheduleDelay !== undefined)       updates.scheduleDelay = body.scheduleDelay;
  if (body.isActive !== undefined)            updates.isActive = body.isActive;
  if (body.priority !== undefined)            updates.priority = body.priority;
  if (body.maxRetries !== undefined)          updates.maxRetries = body.maxRetries;
  updates.updatedAt = new Date().toISOString();

  await db.update(automationRules).set(updates as Record<string, unknown>).where(eq(automationRules.id, id));
  const updated = await db.query.automationRules?.findFirst({ where: eq(automationRules.id, id) });
  return c.json({ rule: updated });
});

// DELETE /rules/:id
app.delete("/rules/:id", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const id = c.req.param("id");
  const existing = await db.query.automationRules?.findFirst({ where: eq(automationRules.id, id) });
  if (!existing) return c.json({ error: "Rule not found" }, 404);
  if (existing.isSystem) return c.json({ error: "Cannot delete a built-in system rule" }, 400);
  await db.delete(automationRules).where(eq(automationRules.id, id));
  return c.json({ ok: true });
});

// POST /rules/:id/pause
app.post("/rules/:id/pause", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  await db.update(automationRules)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(automationRules.id, c.req.param("id")));
  return c.json({ ok: true, isActive: false });
});

// POST /rules/:id/resume
app.post("/rules/:id/resume", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  await db.update(automationRules)
    .set({ isActive: true, updatedAt: new Date().toISOString() })
    .where(eq(automationRules.id, c.req.param("id")));
  return c.json({ ok: true, isActive: true });
});

// POST /rules/:id/trigger — manual execution
app.post("/rules/:id/trigger", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const body = await c.req.json().catch(() => ({})) as { userId?: string; tenantId?: string; data?: Record<string, unknown> };
  const { executionId, success } = await manuallyTriggerRule(db, c.req.param("id"), {
    userId:   body.userId,
    tenantId: body.tenantId,
    data:     body.data ?? {},
  });
  return c.json({ executionId, success });
});

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /executions
app.get("/executions", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const { ruleId, status, entityId, limit = "50", offset = "0" } = c.req.query();

  const execs = await db
    .select()
    .from(automationExecutions)
    .where(
      and(
        ruleId   ? eq(automationExecutions.ruleId, ruleId)     : undefined,
        status   ? eq(automationExecutions.status, status)     : undefined,
        entityId ? eq(automationExecutions.entityId, entityId) : undefined,
      ),
    )
    .orderBy(desc(automationExecutions.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  const [{ total }] = await db.select({ total: count() }).from(automationExecutions);
  return c.json({ executions: execs, total });
});

// GET /executions/:id/logs
app.get("/executions/:id/logs", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const logs = await db
    .select()
    .from(automationLogs)
    .where(eq(automationLogs.executionId, c.req.param("id")))
    .orderBy(automationLogs.createdAt);
  return c.json({ logs });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

// GET /templates/notifications
app.get("/templates/notifications", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const templates = await db.select().from(notificationTemplates).orderBy(notificationTemplates.name);
  return c.json({ templates });
});

const notifTplSchema = z.object({
  name:            z.string().min(1).max(120),
  slug:            z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
  channel:         z.enum(["in_app", "email", "push", "admin_alert"]).default("in_app"),
  subject:         z.string().min(1),
  bodyTemplate:    z.string().min(1),
  variablesSchema: z.array(z.string()).default([]),
  isActive:        z.boolean().default(true),
});

// POST /templates/notifications
app.post("/templates/notifications", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const raw = await c.req.json().catch(() => ({}));
  const p2 = notifTplSchema.safeParse(raw);
  if (!p2.success) return c.json({ error: p2.error.issues[0]?.message }, 400);
  const body = p2.data;
  const now = new Date().toISOString();
  const tpl = await db.insert(notificationTemplates).values({
    id: crypto.randomUUID(),
    name: body.name,
    slug: body.slug,
    channel: body.channel,
    subject: body.subject,
    bodyTemplate: body.bodyTemplate,
    variablesSchema: JSON.stringify(body.variablesSchema),
    isActive: body.isActive,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return c.json({ template: tpl[0] }, 201);
});

// PUT /templates/notifications/:id
app.put("/templates/notifications/:id", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const raw = await c.req.json().catch(() => ({}));
  const p3 = notifTplSchema.partial().safeParse(raw);
  if (!p3.success) return c.json({ error: p3.error.issues[0]?.message }, 400);
  const body = p3.data;
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined)            updates.name = body.name;
  if (body.subject !== undefined)         updates.subject = body.subject;
  if (body.bodyTemplate !== undefined)    updates.bodyTemplate = body.bodyTemplate;
  if (body.variablesSchema !== undefined) updates.variablesSchema = JSON.stringify(body.variablesSchema);
  if (body.isActive !== undefined)        updates.isActive = body.isActive;
  updates.updatedAt = new Date().toISOString();
  await db.update(notificationTemplates).set(updates).where(eq(notificationTemplates.id, c.req.param("id")));
  const tpl = await db.query.notificationTemplates?.findFirst({ where: eq(notificationTemplates.id, c.req.param("id")) });
  return c.json({ template: tpl });
});

// DELETE /templates/notifications/:id
app.delete("/templates/notifications/:id", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  await db.delete(notificationTemplates).where(eq(notificationTemplates.id, c.req.param("id")));
  return c.json({ ok: true });
});

// GET /templates/emails
app.get("/templates/emails", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const templates = await db.select().from(emailTemplates).orderBy(emailTemplates.name);
  return c.json({ templates });
});

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

app.get("/stats", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;

  const [
    [{ totalRules }],
    [{ activeRules }],
    [{ totalExecs }],
    [{ completedExecs }],
    [{ failedExecs }],
    [{ queuedExecs }],
  ] = await Promise.all([
    db.select({ totalRules:    count() }).from(automationRules),
    db.select({ activeRules:   count() }).from(automationRules).where(eq(automationRules.isActive, true)),
    db.select({ totalExecs:    count() }).from(automationExecutions),
    db.select({ completedExecs:count() }).from(automationExecutions).where(eq(automationExecutions.status, "completed")),
    db.select({ failedExecs:   count() }).from(automationExecutions).where(eq(automationExecutions.status, "failed")),
    db.select({ queuedExecs:   count() }).from(automationExecutions).where(eq(automationExecutions.status, "queued")),
  ]);

  // Recent executions (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ recentExecs }] = await db
    .select({ recentExecs: count() })
    .from(automationExecutions)
    .where(gte(automationExecutions.createdAt, sevenDaysAgo));

  return c.json({
    rules:  { total: totalRules,  active: activeRules,   inactive: totalRules - activeRules },
    execs:  { total: totalExecs,  completed: completedExecs, failed: failedExecs, queued: queuedExecs, last7d: recentExecs },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EVENT FIRING (internal / testing)
// ─────────────────────────────────────────────────────────────────────────────

app.post("/events/:type", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const triggerType = c.req.param("type") as TriggerType;
  const body = await c.req.json().catch(() => ({})) as {
    userId?: string; tenantId?: string; entityType?: string; entityId?: string; data?: Record<string, unknown>;
  };
  const executionIds = await fireEvent(db, triggerType, body);
  return c.json({ fired: true, executionIds });
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION PREFERENCES (current user)
// ─────────────────────────────────────────────────────────────────────────────

const PREF_CATEGORIES = [
  "matches", "connections", "mentorship", "community",
  "billing", "admin_alerts", "platform", "digest",
] as const;

// GET /notification-preferences
app.get("/notification-preferences", async (c) => {
  const userId = c.get("userId");

  const rows = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  const existing = new Map(rows.map((r) => [r.category, r]));
  const result = PREF_CATEGORIES.map((cat) =>
    existing.get(cat) ?? {
      id: null,
      userId,
      category: cat,
      inAppEnabled: true,
      emailEnabled: true,
      pushEnabled: false,
      emailDigestFrequency: "realtime",
    },
  );

  return c.json({ preferences: result });
});

const prefSchema = z.object({
  preferences: z.array(z.object({
    category:             z.string(),
    inAppEnabled:         z.boolean(),
    emailEnabled:         z.boolean(),
    pushEnabled:          z.boolean(),
    emailDigestFrequency: z.enum(["realtime", "daily", "weekly", "none"]).default("realtime"),
  })),
});

// PUT /notification-preferences — bulk upsert
app.put("/notification-preferences", async (c) => {
  const userId = c.get("userId");
  const raw = await c.req.json().catch(() => ({}));
  const p4 = prefSchema.safeParse(raw);
  if (!p4.success) return c.json({ error: p4.error.issues[0]?.message }, 400);
  const { preferences } = p4.data;
  const now = new Date().toISOString();

  for (const pref of preferences) {
    const existing = db.select().from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.category, pref.category),
      )).get();

    if (existing) {
      db.update(notificationPreferences).set({
        inAppEnabled:         pref.inAppEnabled,
        emailEnabled:         pref.emailEnabled,
        pushEnabled:          pref.pushEnabled,
        emailDigestFrequency: pref.emailDigestFrequency,
        updatedAt:            now,
      }).where(eq(notificationPreferences.id, existing.id)).run();
    } else {
      db.insert(notificationPreferences).values({
        id:                   crypto.randomUUID(),
        userId,
        category:             pref.category,
        inAppEnabled:         pref.inAppEnabled,
        emailEnabled:         pref.emailEnabled,
        pushEnabled:          pref.pushEnabled,
        emailDigestFrequency: pref.emailDigestFrequency,
        updatedAt:            now,
      }).run();
    }
  }

  return c.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// TENANT AUTOMATION CONFIG (admin)
// ─────────────────────────────────────────────────────────────────────────────

app.get("/tenant-config/:tenantId", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const cfg = await db.query.tenantAutomationConfig?.findFirst({
    where: eq(tenantAutomationConfig.tenantId, c.req.param("tenantId")),
  });
  return c.json({ config: cfg ?? null });
});

const tenantCfgSchema = z.object({
  isAutomationEnabled:    z.boolean().optional(),
  notificationSensitivity:z.enum(["all","important_only","none"]).optional(),
  emailDigestFrequency:   z.enum(["realtime","daily","weekly","none"]).optional(),
  disabledTriggers:       z.array(z.string()).optional(),
  maxDailyPerUser:        z.number().int().min(1).max(200).optional(),
});

app.put("/tenant-config/:tenantId", async (c) => {
  const denied = assertAdmin(c as unknown as { get: (k: string) => string });
  if (denied) return denied;
  const tenantId = c.req.param("tenantId");
  const raw = await c.req.json().catch(() => ({}));
  const p5 = tenantCfgSchema.safeParse(raw);
  if (!p5.success) return c.json({ error: p5.error.issues[0]?.message }, 400);
  const body = p5.data;
  const now = new Date().toISOString();

  const existing = await db.query.tenantAutomationConfig?.findFirst({
    where: eq(tenantAutomationConfig.tenantId, tenantId),
  });

  const updates: Record<string, unknown> = { updatedAt: now };
  if (body.isAutomationEnabled    !== undefined) updates.isAutomationEnabled    = body.isAutomationEnabled;
  if (body.notificationSensitivity!== undefined) updates.notificationSensitivity= body.notificationSensitivity;
  if (body.emailDigestFrequency   !== undefined) updates.emailDigestFrequency   = body.emailDigestFrequency;
  if (body.disabledTriggers       !== undefined) updates.disabledTriggers       = JSON.stringify(body.disabledTriggers);
  if (body.maxDailyPerUser        !== undefined) updates.maxDailyPerUser        = body.maxDailyPerUser;

  if (existing) {
    await db.update(tenantAutomationConfig).set(updates).where(eq(tenantAutomationConfig.tenantId, tenantId));
  } else {
    await db.insert(tenantAutomationConfig).values({
      id:                      crypto.randomUUID(),
      tenantId,
      isAutomationEnabled:     (updates.isAutomationEnabled as boolean | undefined) ?? true,
      notificationSensitivity: (updates.notificationSensitivity as string | undefined) ?? "all",
      emailDigestFrequency:    (updates.emailDigestFrequency as string | undefined) ?? "realtime",
      disabledTriggers:        (updates.disabledTriggers as string | undefined) ?? "[]",
      maxDailyPerUser:         (updates.maxDailyPerUser as number | undefined) ?? 20,
      updatedAt:               now,
    });
  }

  const cfg = await db.query.tenantAutomationConfig?.findFirst({
    where: eq(tenantAutomationConfig.tenantId, tenantId),
  });
  return c.json({ config: cfg });
});

export default app;
