/**
 * /api/admin/billing — super-admin billing management routes
 *
 * GET    /plans                       — list all plans (including inactive)
 * POST   /plans                       — create billing plan
 * PUT    /plans/:id                   — update billing plan
 * DELETE /plans/:id                   — deactivate plan
 * GET    /subscriptions               — list all subscriptions (paginated)
 * GET    /subscriptions/:id           — subscription detail + billing events
 * POST   /subscriptions/:id/override-features — override feature flags
 * POST   /subscriptions/:id/upgrade   — force plan change
 * POST   /subscriptions/:id/cancel    — immediate cancel
 * POST   /subscriptions/:id/extend-trial — extend trial by N days
 * GET    /invoices                    — list all invoices
 * GET    /invoices/:id                — invoice detail with lines
 * POST   /invoices/:id/void           — void invoice
 * GET    /coupons                     — list coupons
 * POST   /coupons                     — create coupon
 * PUT    /coupons/:id                 — update coupon
 * DELETE /coupons/:id                 — deactivate coupon
 * GET    /events                      — billing event log (paginated)
 * GET    /stats                       — revenue / subscription stats
 * GET    /add-ons                     — list add-ons
 * POST   /add-ons                     — create add-on
 * PUT    /add-ons/:id                 — update add-on
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  billingPlans, subscriptions, invoices, invoiceLines,
  discountCoupons, billingEvents, addOns, trialPeriods, users,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { generateInvoiceNumber, addDays } from "../lib/featureGating.js";
import type { AppEnv } from "../types.js";

const adminBilling = new Hono<AppEnv>();
adminBilling.use("*", authMiddleware);

// ── Plans ──────────────────────────────────────────────────────────────────

adminBilling.get("/plans", async (c) => {
  const plans = db.select().from(billingPlans).orderBy(billingPlans.sortOrder).all();
  return c.json({
    plans: plans.map((p) => ({
      ...p,
      featureFlags: JSON.parse(p.featureFlags),
      limits: JSON.parse(p.limits),
      marketingFeatures: JSON.parse(p.marketingFeatures),
      overagePolicy: JSON.parse(p.overagePolicy),
    })),
  });
});

const planSchema = z.object({
  slug: z.string().min(2).max(60),
  name: z.string().min(1),
  description: z.string().optional(),
  tier: z.enum(["individual_free", "individual_premium", "org_starter", "org_pro", "enterprise", "custom"]),
  billingCycle: z.enum(["monthly", "annual", "one_time", "custom"]).default("monthly"),
  priceMonthly: z.number().int().min(0).nullable().optional(),
  priceAnnual: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).default("USD"),
  seatLimit: z.number().int().nullable().optional(),
  featureFlags: z.record(z.boolean()).optional(),
  limits: z.record(z.number()).optional(),
  marketingFeatures: z.array(z.string()).optional(),
  isSsoIncluded: z.boolean().default(false),
  isWhiteLabelIncluded: z.boolean().default(false),
  isAdvancedAnalyticsIncluded: z.boolean().default(false),
  isMentorModuleIncluded: z.boolean().default(true),
  isCommunityModuleIncluded: z.boolean().default(true),
  isCohortModuleIncluded: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  trialDays: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

adminBilling.post("/plans", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const now = new Date().toISOString();
  const { featureFlags, limits, marketingFeatures, ...data } = parsed.data;

  const plan = db.insert(billingPlans).values({
    ...data,
    featureFlags: JSON.stringify(featureFlags ?? {}),
    limits: JSON.stringify(limits ?? {}),
    marketingFeatures: JSON.stringify(marketingFeatures ?? []),
    createdAt: now,
    updatedAt: now,
  }).returning().get();

  return c.json({ plan }, 201);
});

adminBilling.put("/plans/:id", async (c) => {
  const { id } = c.req.param();
  const plan = db.select().from(billingPlans).where(eq(billingPlans.id, id)).get();
  if (!plan) return c.json({ error: "Plan not found" }, 404);

  const body = await c.req.json().catch(() => ({}));
  const parsed = planSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { featureFlags, limits, marketingFeatures, ...data } = parsed.data;
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  if (featureFlags) updates.featureFlags = JSON.stringify(featureFlags);
  if (limits) updates.limits = JSON.stringify(limits);
  if (marketingFeatures) updates.marketingFeatures = JSON.stringify(marketingFeatures);

  db.update(billingPlans).set(updates).where(eq(billingPlans.id, id)).run();

  const updated = db.select().from(billingPlans).where(eq(billingPlans.id, id)).get();
  return c.json({ plan: updated });
});

adminBilling.delete("/plans/:id", async (c) => {
  const { id } = c.req.param();
  db.update(billingPlans).set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(billingPlans.id, id)).run();
  return c.json({ success: true });
});

// ── Subscriptions ──────────────────────────────────────────────────────────

adminBilling.get("/subscriptions", async (c) => {
  const limitQ = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offsetQ = parseInt(c.req.query("offset") ?? "0");
  const search = c.req.query("search") ?? "";
  const statusFilter = c.req.query("status") ?? "";

  const subs = db.select({
    id: subscriptions.id,
    status: subscriptions.status,
    customerType: subscriptions.customerType,
    billingCycle: subscriptions.billingCycle,
    userId: subscriptions.userId,
    tenantId: subscriptions.tenantId,
    seatLimit: subscriptions.seatLimit,
    activeSeatCount: subscriptions.activeSeatCount,
    cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    renewalDate: subscriptions.renewalDate,
    trialEnd: subscriptions.trialEnd,
    lastPaymentStatus: subscriptions.lastPaymentStatus,
    failedPaymentCount: subscriptions.failedPaymentCount,
    createdAt: subscriptions.createdAt,
    planSlug: billingPlans.slug,
    planName: billingPlans.name,
    planTier: billingPlans.tier,
    priceMonthly: billingPlans.priceMonthly,
    priceAnnual: billingPlans.priceAnnual,
  })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, subscriptions.planId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(limitQ)
    .offset(offsetQ)
    .all();

  const total = (db.select({ n: sql<number>`count(*)` }).from(subscriptions).get() as { n: number }).n;

  return c.json({ subscriptions: subs, total, limit: limitQ, offset: offsetQ });
});

adminBilling.get("/subscriptions/:id", async (c) => {
  const { id } = c.req.param();

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.id, id))
    .get();
  if (!sub) return c.json({ error: "Subscription not found" }, 404);

  const plan = db.select().from(billingPlans)
    .where(eq(billingPlans.id, sub.planId))
    .get();

  const events = db.select().from(billingEvents)
    .where(eq(billingEvents.subscriptionId, id))
    .orderBy(desc(billingEvents.createdAt))
    .limit(50)
    .all();

  const invList = db.select().from(invoices)
    .where(eq(invoices.subscriptionId, id))
    .orderBy(desc(invoices.createdAt))
    .all();

  return c.json({
    subscription: {
      ...sub,
      featureFlagOverrides: JSON.parse(sub.featureFlagOverrides),
      limitOverrides: JSON.parse(sub.limitOverrides),
    },
    plan: plan ? {
      ...plan,
      featureFlags: JSON.parse(plan.featureFlags),
      limits: JSON.parse(plan.limits),
      marketingFeatures: JSON.parse(plan.marketingFeatures),
    } : null,
    events: events.map((e) => ({ ...e, payload: JSON.parse(e.payload) })),
    invoices: invList,
  });
});

const overrideFeaturesSchema = z.object({
  featureFlagOverrides: z.record(z.boolean()).optional(),
  limitOverrides: z.record(z.number()).optional(),
  adminNotes: z.string().optional(),
});

adminBilling.post("/subscriptions/:id/override-features", async (c) => {
  const { id } = c.req.param();
  const adminId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = overrideFeaturesSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const now = new Date().toISOString();
  const updates: Record<string, string | null> = { updatedAt: now };
  if (parsed.data.featureFlagOverrides) updates.featureFlagOverrides = JSON.stringify(parsed.data.featureFlagOverrides);
  if (parsed.data.limitOverrides) updates.limitOverrides = JSON.stringify(parsed.data.limitOverrides);
  if (parsed.data.adminNotes !== undefined) updates.adminNotes = parsed.data.adminNotes;

  db.update(subscriptions).set(updates).where(eq(subscriptions.id, id)).run();

  db.insert(billingEvents).values({
    subscriptionId: id,
    eventType: "feature_override",
    outcome: "success",
    actor: "admin",
    actorId: adminId,
    payload: JSON.stringify(parsed.data),
  }).run();

  return c.json({ success: true });
});

adminBilling.post("/subscriptions/:id/upgrade", async (c) => {
  const { id } = c.req.param();
  const adminId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const planSlug = (body as { planSlug?: string }).planSlug;
  if (!planSlug) return c.json({ error: "planSlug required" }, 400);

  const plan = db.select().from(billingPlans)
    .where(and(eq(billingPlans.slug, planSlug), eq(billingPlans.isActive, true)))
    .get();
  if (!plan) return c.json({ error: "Plan not found" }, 404);

  const sub = db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
  if (!sub) return c.json({ error: "Subscription not found" }, 404);

  const now = new Date().toISOString();
  db.update(subscriptions).set({
    planId: plan.id,
    status: "active",
    updatedAt: now,
  }).where(eq(subscriptions.id, id)).run();

  db.insert(billingEvents).values({
    subscriptionId: id,
    userId: sub.userId,
    tenantId: sub.tenantId,
    eventType: "subscription_upgraded",
    outcome: "success",
    actor: "admin",
    actorId: adminId,
    payload: JSON.stringify({ fromPlan: sub.planId, toPlan: plan.id, adminAction: true }),
  }).run();

  return c.json({ success: true });
});

adminBilling.post("/subscriptions/:id/cancel", async (c) => {
  const { id } = c.req.param();
  const adminId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const reason = (body as { reason?: string }).reason ?? "Admin cancellation";

  const sub = db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
  if (!sub) return c.json({ error: "Subscription not found" }, 404);

  const now = new Date().toISOString();
  db.update(subscriptions).set({
    status: "canceled",
    canceledAt: now,
    cancelReason: reason,
    updatedAt: now,
  }).where(eq(subscriptions.id, id)).run();

  db.insert(billingEvents).values({
    subscriptionId: id,
    userId: sub.userId,
    tenantId: sub.tenantId,
    eventType: "subscription_canceled",
    outcome: "success",
    actor: "admin",
    actorId: adminId,
    payload: JSON.stringify({ reason, adminAction: true }),
  }).run();

  return c.json({ success: true });
});

adminBilling.post("/subscriptions/:id/extend-trial", async (c) => {
  const { id } = c.req.param();
  const adminId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const days = (body as { days?: number }).days ?? 7;

  const sub = db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
  if (!sub) return c.json({ error: "Subscription not found" }, 404);

  const currentEnd = sub.trialEnd ?? new Date().toISOString();
  const newEnd = addDays(currentEnd, days);
  const now = new Date().toISOString();

  db.update(subscriptions).set({
    trialEnd: newEnd,
    status: "trialing",
    updatedAt: now,
  }).where(eq(subscriptions.id, id)).run();

  const trial = db.select().from(trialPeriods)
    .where(eq(trialPeriods.subscriptionId, id)).get();
  if (trial) {
    db.update(trialPeriods).set({
      endDate: newEnd,
      extendedAt: now,
      extensionDays: trial.extensionDays + days,
      extendedBy: adminId,
    }).where(eq(trialPeriods.subscriptionId, id)).run();
  }

  db.insert(billingEvents).values({
    subscriptionId: id,
    userId: sub.userId,
    tenantId: sub.tenantId,
    eventType: "admin_action",
    outcome: "success",
    actor: "admin",
    actorId: adminId,
    payload: JSON.stringify({ action: "trial_extended", days, newTrialEnd: newEnd }),
  }).run();

  return c.json({ success: true, newTrialEnd: newEnd });
});

// ── Invoices ───────────────────────────────────────────────────────────────

adminBilling.get("/invoices", async (c) => {
  const limitQ = Math.min(parseInt(c.req.query("limit") ?? "50"), 200);
  const offsetQ = parseInt(c.req.query("offset") ?? "0");
  const statusFilter = c.req.query("status") ?? "";

  const allInvoices = db.select().from(invoices)
    .orderBy(desc(invoices.createdAt))
    .limit(limitQ)
    .offset(offsetQ)
    .all();

  const total = (db.select({ n: sql<number>`count(*)` }).from(invoices).get() as { n: number }).n;

  return c.json({ invoices: allInvoices, total, limit: limitQ, offset: offsetQ });
});

adminBilling.get("/invoices/:id", async (c) => {
  const { id } = c.req.param();
  const inv = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (!inv) return c.json({ error: "Invoice not found" }, 404);

  const lines = db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, id)).all();
  return c.json({ invoice: inv, lines });
});

adminBilling.post("/invoices/:id/void", async (c) => {
  const { id } = c.req.param();
  const adminId = c.get("userId");
  const inv = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (!inv) return c.json({ error: "Invoice not found" }, 404);
  if (inv.status === "void") return c.json({ error: "Invoice already voided" }, 400);

  const now = new Date().toISOString();
  db.update(invoices).set({ status: "void", voidedAt: now, updatedAt: now })
    .where(eq(invoices.id, id)).run();

  if (inv.subscriptionId) {
    db.insert(billingEvents).values({
      subscriptionId: inv.subscriptionId,
      userId: inv.userId,
      tenantId: inv.tenantId,
      eventType: "admin_action",
      outcome: "success",
      actor: "admin",
      actorId: adminId,
      payload: JSON.stringify({ action: "invoice_voided", invoiceId: id }),
    }).run();
  }

  return c.json({ success: true });
});

// ── Coupons ────────────────────────────────────────────────────────────────

adminBilling.get("/coupons", async (c) => {
  const coupons = db.select().from(discountCoupons)
    .orderBy(desc(discountCoupons.createdAt))
    .all();
  return c.json({ coupons });
});

const couponSchema = z.object({
  code: z.string().min(3).max(32).transform((v) => v.toUpperCase()),
  name: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed_amount", "trial_extension"]),
  discountValue: z.number().int().min(0),
  currency: z.string().optional(),
  applicablePlanSlugs: z.array(z.string()).optional().nullable(),
  applicableCustomerType: z.enum(["individual", "tenant"]).optional().nullable(),
  maxRedemptions: z.number().int().min(1).optional().nullable(),
  durationMonths: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

adminBilling.post("/coupons", async (c) => {
  const adminId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { applicablePlanSlugs, ...data } = parsed.data;
  const existing = db.select().from(discountCoupons)
    .where(eq(discountCoupons.code, data.code)).get();
  if (existing) return c.json({ error: "Coupon code already exists" }, 409);

  const coupon = db.insert(discountCoupons).values({
    ...data,
    applicablePlanSlugs: applicablePlanSlugs ? JSON.stringify(applicablePlanSlugs) : null,
    createdBy: adminId,
  }).returning().get();

  return c.json({ coupon }, 201);
});

adminBilling.put("/coupons/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const parsed = couponSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { applicablePlanSlugs, ...data } = parsed.data;
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  if (applicablePlanSlugs !== undefined) {
    updates.applicablePlanSlugs = applicablePlanSlugs ? JSON.stringify(applicablePlanSlugs) : null;
  }

  db.update(discountCoupons).set(updates).where(eq(discountCoupons.id, id)).run();
  const coupon = db.select().from(discountCoupons).where(eq(discountCoupons.id, id)).get();
  return c.json({ coupon });
});

adminBilling.delete("/coupons/:id", async (c) => {
  const { id } = c.req.param();
  db.update(discountCoupons).set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(discountCoupons.id, id)).run();
  return c.json({ success: true });
});

// ── Billing Events ─────────────────────────────────────────────────────────

adminBilling.get("/events", async (c) => {
  const limitQ = Math.min(parseInt(c.req.query("limit") ?? "100"), 500);
  const offsetQ = parseInt(c.req.query("offset") ?? "0");

  const events = db.select().from(billingEvents)
    .orderBy(desc(billingEvents.createdAt))
    .limit(limitQ)
    .offset(offsetQ)
    .all();

  const total = (db.select({ n: sql<number>`count(*)` }).from(billingEvents).get() as { n: number }).n;

  return c.json({
    events: events.map((e) => ({ ...e, payload: JSON.parse(e.payload) })),
    total,
  });
});

// ── Stats ──────────────────────────────────────────────────────────────────

adminBilling.get("/stats", async (c) => {
  const totalSubs = (db.select({ n: sql<number>`count(*)` }).from(subscriptions).get() as { n: number }).n;
  const activeSubs = (db.select({ n: sql<number>`count(*)` }).from(subscriptions)
    .where(eq(subscriptions.status, "active")).get() as { n: number }).n;
  const trialingSubs = (db.select({ n: sql<number>`count(*)` }).from(subscriptions)
    .where(eq(subscriptions.status, "trialing")).get() as { n: number }).n;
  const canceledSubs = (db.select({ n: sql<number>`count(*)` }).from(subscriptions)
    .where(eq(subscriptions.status, "canceled")).get() as { n: number }).n;
  const pastDueSubs = (db.select({ n: sql<number>`count(*)` }).from(subscriptions)
    .where(eq(subscriptions.status, "past_due")).get() as { n: number }).n;

  const totalRevenueCents = (db.select({ s: sql<number>`COALESCE(SUM(amount_paid_cents), 0)` })
    .from(invoices).where(eq(invoices.status, "paid")).get() as { s: number }).s;

  const totalInvoices = (db.select({ n: sql<number>`count(*)` }).from(invoices).get() as { n: number }).n;
  const paidInvoices = (db.select({ n: sql<number>`count(*)` }).from(invoices)
    .where(eq(invoices.status, "paid")).get() as { n: number }).n;
  const openInvoices = (db.select({ n: sql<number>`count(*)` }).from(invoices)
    .where(eq(invoices.status, "open")).get() as { n: number }).n;

  const planBreakdown = db.select({
    planName: billingPlans.name,
    planSlug: billingPlans.slug,
    count: sql<number>`count(*)`,
  })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, subscriptions.planId))
    .all();

  return c.json({
    subscriptions: { total: totalSubs, active: activeSubs, trialing: trialingSubs, canceled: canceledSubs, pastDue: pastDueSubs },
    revenue: { totalCents: totalRevenueCents, totalDollars: totalRevenueCents / 100 },
    invoices: { total: totalInvoices, paid: paidInvoices, open: openInvoices },
    planBreakdown,
  });
});

// ── Add-ons ────────────────────────────────────────────────────────────────

adminBilling.get("/add-ons", async (c) => {
  const list = db.select().from(addOns).orderBy(addOns.slug).all();
  return c.json({
    addOns: list.map((a) => ({
      ...a,
      featureFlags: JSON.parse(a.featureFlags),
      limits: JSON.parse(a.limits),
      compatiblePlanSlugs: a.compatiblePlanSlugs ? JSON.parse(a.compatiblePlanSlugs) : null,
    })),
  });
});

const addOnSchema = z.object({
  slug: z.string().min(2).max(60),
  name: z.string().min(1),
  description: z.string().optional(),
  billingCycle: z.enum(["one_time", "monthly", "annual"]).default("monthly"),
  priceMonthly: z.number().int().min(0).nullable().optional(),
  priceAnnual: z.number().int().min(0).nullable().optional(),
  currency: z.string().length(3).default("USD"),
  featureFlags: z.record(z.boolean()).optional(),
  limits: z.record(z.number()).optional(),
  compatiblePlanSlugs: z.array(z.string()).nullable().optional(),
  isPublic: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

adminBilling.post("/add-ons", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = addOnSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { featureFlags, limits, compatiblePlanSlugs, ...data } = parsed.data;

  const addOn = db.insert(addOns).values({
    ...data,
    featureFlags: JSON.stringify(featureFlags ?? {}),
    limits: JSON.stringify(limits ?? {}),
    compatiblePlanSlugs: compatiblePlanSlugs ? JSON.stringify(compatiblePlanSlugs) : null,
  }).returning().get();

  return c.json({ addOn }, 201);
});

adminBilling.put("/add-ons/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const parsed = addOnSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { featureFlags, limits, compatiblePlanSlugs, ...data } = parsed.data;
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  if (featureFlags) updates.featureFlags = JSON.stringify(featureFlags);
  if (limits) updates.limits = JSON.stringify(limits);
  if (compatiblePlanSlugs !== undefined) {
    updates.compatiblePlanSlugs = compatiblePlanSlugs ? JSON.stringify(compatiblePlanSlugs) : null;
  }

  db.update(addOns).set(updates).where(eq(addOns.id, id)).run();
  const addOn = db.select().from(addOns).where(eq(addOns.id, id)).get();
  return c.json({ addOn });
});

export default adminBilling;
