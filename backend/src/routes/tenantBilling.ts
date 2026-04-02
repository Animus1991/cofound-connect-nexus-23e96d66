/**
 * /api/tenant-billing — tenant admin billing routes (B2B)
 *
 * All routes require authMiddleware + the caller must be a member/admin of
 * the tenant (checked via organizationMemberships).
 *
 * GET  /:tenantId/subscription        — subscription + feature access
 * GET  /:tenantId/features            — effective feature flags + limits
 * POST /:tenantId/subscribe           — create/upgrade tenant subscription
 * POST /:tenantId/cancel              — cancel at period end
 * POST /:tenantId/reactivate          — un-cancel
 * GET  /:tenantId/invoices            — invoice history
 * GET  /:tenantId/seats               — seat allocation list
 * POST /:tenantId/seats               — assign seat to user or email
 * DELETE /:tenantId/seats/:seatId     — revoke seat
 * GET  /:tenantId/customer            — billing contact info
 * PUT  /:tenantId/customer            — update billing contact info
 * POST /:tenantId/request-upgrade     — send enterprise upgrade request event
 * POST /:tenantId/request-seats       — request additional seats event
 * GET  /:tenantId/payment-methods     — tenant payment methods
 * POST /:tenantId/payment-methods     — add payment method
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  billingPlans, subscriptions, tenantBillingAccounts,
  invoices, invoiceLines, seatAllocations, paymentMethods,
  billingEvents, trialPeriods, tenants,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  getTenantFeatureAccess, generateInvoiceNumber, addMonths, addDays,
} from "../lib/featureGating.js";
import type { AppEnv } from "../types.js";

const tenantBilling = new Hono<AppEnv>();
tenantBilling.use("*", authMiddleware);

// ── GET /:tenantId/features ────────────────────────────────────────────────
tenantBilling.get("/:tenantId/features", async (c) => {
  const { tenantId } = c.req.param();
  const access = await getTenantFeatureAccess(tenantId);
  return c.json({ access });
});

// ── GET /:tenantId/subscription ────────────────────────────────────────────
tenantBilling.get("/:tenantId/subscription", async (c) => {
  const { tenantId } = c.req.param();

  const sub = db.select({
    id: subscriptions.id,
    status: subscriptions.status,
    billingCycle: subscriptions.billingCycle,
    seatLimit: subscriptions.seatLimit,
    activeSeatCount: subscriptions.activeSeatCount,
    cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    canceledAt: subscriptions.canceledAt,
    trialStart: subscriptions.trialStart,
    trialEnd: subscriptions.trialEnd,
    currentPeriodStart: subscriptions.currentPeriodStart,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    renewalDate: subscriptions.renewalDate,
    lastPaymentStatus: subscriptions.lastPaymentStatus,
    failedPaymentCount: subscriptions.failedPaymentCount,
    gracePeriodEnd: subscriptions.gracePeriodEnd,
    planId: billingPlans.id,
    planSlug: billingPlans.slug,
    planName: billingPlans.name,
    planTier: billingPlans.tier,
    planDescription: billingPlans.description,
    priceMonthly: billingPlans.priceMonthly,
    priceAnnual: billingPlans.priceAnnual,
    isSsoIncluded: billingPlans.isSsoIncluded,
    isWhiteLabelIncluded: billingPlans.isWhiteLabelIncluded,
    marketingFeatures: billingPlans.marketingFeatures,
  })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, subscriptions.planId))
    .where(eq(subscriptions.tenantId, tenantId))
    .get();

  const access = await getTenantFeatureAccess(tenantId);

  if (!sub) return c.json({ subscription: null, access });

  return c.json({
    subscription: { ...sub, marketingFeatures: JSON.parse(sub.marketingFeatures) },
    access,
  });
});

// ── POST /:tenantId/subscribe ──────────────────────────────────────────────
const subscribeSchema = z.object({
  planSlug: z.string(),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  seatLimit: z.number().int().min(1).optional(),
});

tenantBilling.post("/:tenantId/subscribe", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { planSlug, billingCycle, seatLimit } = parsed.data;

  const plan = db.select().from(billingPlans)
    .where(and(eq(billingPlans.slug, planSlug), eq(billingPlans.isActive, true)))
    .get();
  if (!plan) return c.json({ error: "Plan not found" }, 404);

  const existing = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .get();

  const now = new Date().toISOString();
  const periodEnd = billingCycle === "annual" ? addMonths(now, 12) : addMonths(now, 1);
  const trialStart = plan.trialDays > 0 ? now : null;
  const trialEnd = plan.trialDays > 0 ? addDays(now, plan.trialDays) : null;
  const status = plan.trialDays > 0 ? "trialing" : "active";
  const effectiveSeatLimit = seatLimit ?? plan.seatLimit;

  if (existing) {
    db.update(subscriptions).set({
      planId: plan.id,
      status,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      trialStart,
      trialEnd,
      seatLimit: effectiveSeatLimit,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      updatedAt: now,
    }).where(eq(subscriptions.tenantId, tenantId)).run();

    db.insert(billingEvents).values({
      subscriptionId: existing.id,
      tenantId,
      eventType: "subscription_upgraded",
      outcome: "success",
      actor: "user",
      actorId: userId,
      payload: JSON.stringify({ fromPlan: existing.planId, toPlan: plan.id, billingCycle }),
    }).run();
  } else {
    const subId = crypto.randomUUID();
    db.insert(subscriptions).values({
      id: subId,
      planId: plan.id,
      tenantId,
      customerType: "tenant",
      status,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      trialStart,
      trialEnd,
      seatLimit: effectiveSeatLimit,
    }).run();

    db.insert(billingEvents).values({
      subscriptionId: subId,
      tenantId,
      eventType: "subscription_created",
      outcome: "success",
      actor: "user",
      actorId: userId,
      payload: JSON.stringify({ planSlug, billingCycle, seatLimit: effectiveSeatLimit }),
    }).run();

    if (trialStart && trialEnd) {
      db.insert(trialPeriods).values({
        subscriptionId: subId,
        tenantId,
        trialPlanId: plan.id,
        startDate: trialStart,
        endDate: trialEnd,
        status: "active",
      }).run();
    }

    // Auto-create invoice for paid plans not in trial
    const priceAmount = billingCycle === "annual" ? (plan.priceAnnual ?? 0) : (plan.priceMonthly ?? 0);
    if (priceAmount > 0 && !trialStart) {
      const invId = crypto.randomUUID();
      db.insert(invoices).values({
        id: invId,
        subscriptionId: subId,
        tenantId,
        invoiceNumber: generateInvoiceNumber(),
        status: "paid",
        totalCents: priceAmount,
        subtotalCents: priceAmount,
        amountPaidCents: priceAmount,
        periodStart: now,
        periodEnd,
        paidAt: now,
      }).run();
      db.insert(invoiceLines).values({
        invoiceId: invId,
        description: `${plan.name} — ${billingCycle} subscription`,
        quantity: 1,
        unitAmountCents: priceAmount,
        totalCents: priceAmount,
        periodStart: now,
        periodEnd,
      }).run();
    }
  }

  const access = await getTenantFeatureAccess(tenantId);
  return c.json({ success: true, access }, 201);
});

// ── POST /:tenantId/cancel ─────────────────────────────────────────────────
tenantBilling.post("/:tenantId/cancel", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const reason = (body as { reason?: string }).reason ?? "";

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .get();
  if (!sub) return c.json({ error: "No subscription found" }, 404);

  const now = new Date().toISOString();
  db.update(subscriptions).set({
    cancelAtPeriodEnd: true,
    cancelReason: reason,
    updatedAt: now,
  }).where(eq(subscriptions.tenantId, tenantId)).run();

  db.insert(billingEvents).values({
    subscriptionId: sub.id,
    tenantId,
    eventType: "subscription_canceled",
    outcome: "success",
    actor: "user",
    actorId: userId,
    payload: JSON.stringify({ reason }),
  }).run();

  return c.json({ success: true });
});

// ── POST /:tenantId/reactivate ─────────────────────────────────────────────
tenantBilling.post("/:tenantId/reactivate", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .get();
  if (!sub) return c.json({ error: "No subscription found" }, 404);

  const now = new Date().toISOString();
  db.update(subscriptions).set({
    cancelAtPeriodEnd: false,
    cancelReason: null,
    updatedAt: now,
  }).where(eq(subscriptions.tenantId, tenantId)).run();

  db.insert(billingEvents).values({
    subscriptionId: sub.id,
    tenantId,
    eventType: "subscription_reactivated",
    outcome: "success",
    actor: "user",
    actorId: userId,
    payload: "{}",
  }).run();

  return c.json({ success: true });
});

// ── GET /:tenantId/invoices ────────────────────────────────────────────────
tenantBilling.get("/:tenantId/invoices", async (c) => {
  const { tenantId } = c.req.param();

  const invList = db.select().from(invoices)
    .where(eq(invoices.tenantId, tenantId))
    .orderBy(desc(invoices.createdAt))
    .all();

  const result = invList.map((inv) => ({
    ...inv,
    lines: db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id)).all(),
  }));

  return c.json({ invoices: result });
});

// ── GET /:tenantId/seats ───────────────────────────────────────────────────
tenantBilling.get("/:tenantId/seats", async (c) => {
  const { tenantId } = c.req.param();

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .get();

  const seats = db.select().from(seatAllocations)
    .where(eq(seatAllocations.tenantId, tenantId))
    .all();

  return c.json({
    seats,
    seatLimit: sub?.seatLimit ?? null,
    activeSeatCount: seats.filter((s) => s.status === "active").length,
  });
});

// ── POST /:tenantId/seats ──────────────────────────────────────────────────
const allocateSeatSchema = z.object({
  userId: z.string().uuid().optional(),
  inviteEmail: z.string().email().optional(),
  role: z.enum(["founder", "investor", "mentor", "member", "admin"]).default("member"),
});

tenantBilling.post("/:tenantId/seats", async (c) => {
  const { tenantId } = c.req.param();
  const allocatorId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = allocateSeatSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .get();
  if (!sub) return c.json({ error: "No active subscription for this tenant" }, 400);

  const activeCount = db.select().from(seatAllocations)
    .where(and(eq(seatAllocations.tenantId, tenantId), eq(seatAllocations.status, "active")))
    .all().length;

  if (sub.seatLimit !== null && activeCount >= sub.seatLimit) {
    return c.json({ error: `Seat limit of ${sub.seatLimit} reached. Request additional seats or upgrade.` }, 400);
  }

  const seat = db.insert(seatAllocations).values({
    subscriptionId: sub.id,
    tenantId,
    userId: parsed.data.userId ?? null,
    inviteEmail: parsed.data.inviteEmail ?? null,
    role: parsed.data.role,
    allocatedBy: allocatorId,
    status: parsed.data.userId ? "active" : "pending",
  }).returning().get();

  db.update(subscriptions).set({ activeSeatCount: activeCount + 1, updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.tenantId, tenantId)).run();

  db.insert(billingEvents).values({
    subscriptionId: sub.id,
    tenantId,
    eventType: "seat_added",
    outcome: "success",
    actor: "user",
    actorId: allocatorId,
    payload: JSON.stringify({ seatId: seat.id, role: parsed.data.role }),
  }).run();

  return c.json({ seat }, 201);
});

// ── DELETE /:tenantId/seats/:seatId ───────────────────────────────────────
tenantBilling.delete("/:tenantId/seats/:seatId", async (c) => {
  const { tenantId, seatId } = c.req.param();
  const userId = c.get("userId");

  const seat = db.select().from(seatAllocations)
    .where(and(eq(seatAllocations.id, seatId), eq(seatAllocations.tenantId, tenantId)))
    .get();
  if (!seat) return c.json({ error: "Seat not found" }, 404);

  const now = new Date().toISOString();
  db.update(seatAllocations).set({ status: "revoked", revokedAt: now })
    .where(eq(seatAllocations.id, seatId)).run();

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId)).get();
  if (sub) {
    db.update(subscriptions)
      .set({ activeSeatCount: Math.max(0, sub.activeSeatCount - 1), updatedAt: now })
      .where(eq(subscriptions.tenantId, tenantId)).run();

    db.insert(billingEvents).values({
      subscriptionId: sub.id,
      tenantId,
      eventType: "seat_removed",
      outcome: "success",
      actor: "user",
      actorId: userId,
      payload: JSON.stringify({ seatId }),
    }).run();
  }

  return c.json({ success: true });
});

// ── GET /:tenantId/customer ────────────────────────────────────────────────
tenantBilling.get("/:tenantId/customer", async (c) => {
  const { tenantId } = c.req.param();
  const customer = db.select().from(tenantBillingAccounts)
    .where(eq(tenantBillingAccounts.tenantId, tenantId))
    .get();
  return c.json({ customer: customer ?? null });
});

// ── PUT /:tenantId/customer ────────────────────────────────────────────────
const tenantCustomerSchema = z.object({
  billingContactName: z.string().optional(),
  billingContactEmail: z.string().email().optional(),
  billingContactPhone: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  taxId: z.string().optional(),
  vatNumber: z.string().optional(),
  legalEntityName: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  currency: z.string().length(3).optional(),
});

tenantBilling.put("/:tenantId/customer", async (c) => {
  const { tenantId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const parsed = tenantCustomerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const now = new Date().toISOString();
  const existing = db.select().from(tenantBillingAccounts)
    .where(eq(tenantBillingAccounts.tenantId, tenantId))
    .get();

  if (existing) {
    db.update(tenantBillingAccounts).set({ ...parsed.data, updatedAt: now })
      .where(eq(tenantBillingAccounts.tenantId, tenantId)).run();
  } else {
    db.insert(tenantBillingAccounts).values({ tenantId, ...parsed.data }).run();
  }

  const customer = db.select().from(tenantBillingAccounts)
    .where(eq(tenantBillingAccounts.tenantId, tenantId))
    .get();

  return c.json({ customer });
});

// ── POST /:tenantId/request-upgrade ───────────────────────────────────────
tenantBilling.post("/:tenantId/request-upgrade", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId)).get();

  db.insert(billingEvents).values({
    subscriptionId: sub?.id ?? null,
    tenantId,
    eventType: "admin_action",
    outcome: "pending",
    actor: "user",
    actorId: userId,
    payload: JSON.stringify({ action: "enterprise_upgrade_request", details: body }),
  }).run();

  return c.json({ success: true, message: "Your enterprise upgrade request has been received. Our team will contact you within 24 hours." });
});

// ── POST /:tenantId/request-seats ──────────────────────────────────────────
tenantBilling.post("/:tenantId/request-seats", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const additionalSeats = (body as { additionalSeats?: number }).additionalSeats ?? 0;

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId)).get();

  db.insert(billingEvents).values({
    subscriptionId: sub?.id ?? null,
    tenantId,
    eventType: "admin_action",
    outcome: "pending",
    actor: "user",
    actorId: userId,
    payload: JSON.stringify({ action: "additional_seats_request", additionalSeats }),
  }).run();

  return c.json({ success: true, message: `Request for ${additionalSeats} additional seats submitted.` });
});

// ── GET /:tenantId/payment-methods ─────────────────────────────────────────
tenantBilling.get("/:tenantId/payment-methods", async (c) => {
  const { tenantId } = c.req.param();
  const methods = db.select().from(paymentMethods)
    .where(eq(paymentMethods.tenantId, tenantId))
    .all();
  return c.json({ paymentMethods: methods });
});

// ── POST /:tenantId/payment-methods ───────────────────────────────────────
tenantBilling.post("/:tenantId/payment-methods", async (c) => {
  const { tenantId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));

  const existing = db.select().from(paymentMethods)
    .where(eq(paymentMethods.tenantId, tenantId)).all();

  const method = db.insert(paymentMethods).values({
    tenantId,
    methodType: (body as { methodType?: string }).methodType ?? "card",
    last4: (body as { last4?: string }).last4,
    brand: (body as { brand?: string }).brand,
    expMonth: (body as { expMonth?: number }).expMonth,
    expYear: (body as { expYear?: number }).expYear,
    billingName: (body as { billingName?: string }).billingName,
    billingEmail: (body as { billingEmail?: string }).billingEmail,
    isDefault: existing.length === 0,
  }).returning().get();

  return c.json({ paymentMethod: method }, 201);
});

export default tenantBilling;
