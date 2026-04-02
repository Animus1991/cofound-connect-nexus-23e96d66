/**
 * /api/billing — authenticated user billing routes (B2C)
 *
 * GET  /plans                      — list all public billing plans + add-ons
 * GET  /my/subscription            — current user subscription + feature access
 * POST /my/subscribe               — create or upgrade subscription
 * POST /my/cancel                  — cancel at period end
 * POST /my/reactivate              — un-cancel (before period end)
 * GET  /my/invoices                — invoice history
 * GET  /my/payment-methods         — list payment methods
 * POST /my/payment-methods         — add payment method (mocked)
 * DELETE /my/payment-methods/:id   — remove payment method
 * POST /my/apply-coupon            — validate + apply coupon
 * GET  /my/features                — current feature access JSON
 * POST /my/customer                — upsert billing contact details
 * GET  /my/customer                — get billing contact details
 * GET  /public/plans               — unauthenticated plan list for pricing page
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  billingPlans, subscriptions, customerAccounts,
  invoices, invoiceLines, paymentMethods, discountCoupons,
  billingEvents, addOns, trialPeriods,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  getUserFeatureAccess, generateInvoiceNumber, addMonths, addDays,
} from "../lib/featureGating.js";
import type { AppEnv } from "../types.js";

const billing = new Hono<AppEnv>();

// ── Public: plan list (used by pricing page, no auth needed) ──────────────
billing.get("/public/plans", async (c) => {
  const plans = db.select().from(billingPlans)
    .where(and(eq(billingPlans.isPublic, true), eq(billingPlans.isActive, true)))
    .orderBy(billingPlans.sortOrder)
    .all();

  const addOnsList = db.select().from(addOns)
    .where(and(eq(addOns.isPublic, true), eq(addOns.isActive, true)))
    .all();

  return c.json({
    plans: plans.map((p) => ({
      ...p,
      featureFlags: JSON.parse(p.featureFlags),
      limits: JSON.parse(p.limits),
      marketingFeatures: JSON.parse(p.marketingFeatures),
      overagePolicy: JSON.parse(p.overagePolicy),
    })),
    addOns: addOnsList.map((a) => ({
      ...a,
      featureFlags: JSON.parse(a.featureFlags),
      limits: JSON.parse(a.limits),
      compatiblePlanSlugs: a.compatiblePlanSlugs ? JSON.parse(a.compatiblePlanSlugs) : null,
    })),
  });
});

// ── All routes below require auth ─────────────────────────────────────────
billing.use("*", authMiddleware);

// ── GET /plans (authenticated alias) ──────────────────────────────────────
billing.get("/plans", async (c) => {
  const plans = db.select().from(billingPlans)
    .where(and(eq(billingPlans.isPublic, true), eq(billingPlans.isActive, true)))
    .orderBy(billingPlans.sortOrder)
    .all();

  const addOnsList = db.select().from(addOns)
    .where(and(eq(addOns.isPublic, true), eq(addOns.isActive, true)))
    .all();

  return c.json({
    plans: plans.map((p) => ({
      ...p,
      featureFlags: JSON.parse(p.featureFlags),
      limits: JSON.parse(p.limits),
      marketingFeatures: JSON.parse(p.marketingFeatures),
      overagePolicy: JSON.parse(p.overagePolicy),
    })),
    addOns: addOnsList.map((a) => ({
      ...a,
      featureFlags: JSON.parse(a.featureFlags),
      limits: JSON.parse(a.limits),
    })),
  });
});

// ── GET /my/features ──────────────────────────────────────────────────────
billing.get("/my/features", async (c) => {
  const userId = c.get("userId");
  const access = await getUserFeatureAccess(userId);
  return c.json({ access });
});

// ── GET /my/subscription ──────────────────────────────────────────────────
billing.get("/my/subscription", async (c) => {
  const userId = c.get("userId");

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
    lastPaymentAt: subscriptions.lastPaymentAt,
    failedPaymentCount: subscriptions.failedPaymentCount,
    gracePeriodEnd: subscriptions.gracePeriodEnd,
    planId: billingPlans.id,
    planSlug: billingPlans.slug,
    planName: billingPlans.name,
    planTier: billingPlans.tier,
    planDescription: billingPlans.description,
    priceMonthly: billingPlans.priceMonthly,
    priceAnnual: billingPlans.priceAnnual,
    trialDays: billingPlans.trialDays,
    marketingFeatures: billingPlans.marketingFeatures,
    isSsoIncluded: billingPlans.isSsoIncluded,
    isWhiteLabelIncluded: billingPlans.isWhiteLabelIncluded,
  })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, subscriptions.planId))
    .where(eq(subscriptions.userId, userId))
    .get();

  if (!sub) {
    return c.json({ subscription: null, access: await getUserFeatureAccess(userId) });
  }

  const access = await getUserFeatureAccess(userId);
  return c.json({
    subscription: { ...sub, marketingFeatures: JSON.parse(sub.marketingFeatures) },
    access,
  });
});

// ── POST /my/subscribe ────────────────────────────────────────────────────
const subscribeSchema = z.object({
  planSlug: z.string(),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  couponCode: z.string().optional(),
});

billing.post("/my/subscribe", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { planSlug, billingCycle, couponCode } = parsed.data;

  const plan = db.select().from(billingPlans)
    .where(and(eq(billingPlans.slug, planSlug), eq(billingPlans.isActive, true)))
    .get();
  if (!plan) return c.json({ error: "Plan not found" }, 404);

  // Validate coupon if provided
  let coupon = null;
  if (couponCode) {
    coupon = db.select().from(discountCoupons)
      .where(and(eq(discountCoupons.code, couponCode.toUpperCase()), eq(discountCoupons.isActive, true)))
      .get();
    if (!coupon) return c.json({ error: "Invalid or expired coupon code" }, 400);
    if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
      return c.json({ error: "This coupon has reached its maximum redemptions" }, 400);
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return c.json({ error: "This coupon has expired" }, 400);
    }
  }

  // Deactivate existing subscription
  const existing = db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .get();

  const now = new Date().toISOString();
  const periodEnd = billingCycle === "annual" ? addMonths(now, 12) : addMonths(now, 1);

  // Determine trial
  const trialStart = plan.trialDays > 0 ? now : null;
  const trialEnd = plan.trialDays > 0 ? addDays(now, plan.trialDays) : null;
  const status = plan.trialDays > 0 ? "trialing" : "active";

  if (existing) {
    // Upgrade/downgrade — log event
    db.update(subscriptions).set({
      planId: plan.id,
      status,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      trialStart,
      trialEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      updatedAt: now,
    }).where(eq(subscriptions.userId, userId)).run();

    db.insert(billingEvents).values({
      subscriptionId: existing.id,
      userId,
      eventType: existing.planId === plan.id ? "subscription_reactivated" : "subscription_upgraded",
      outcome: "success",
      actor: "user",
      actorId: userId,
      payload: JSON.stringify({ fromPlan: existing.planId, toPlan: plan.id, billingCycle }),
    }).run();

    // Create invoice record
    const priceAmount = billingCycle === "annual" ? (plan.priceAnnual ?? 0) : (plan.priceMonthly ?? 0);
    if (priceAmount > 0) {
      const invId = crypto.randomUUID();
      db.insert(invoices).values({
        id: invId,
        subscriptionId: existing.id,
        userId,
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
  } else {
    // New subscription
    const subId = crypto.randomUUID();
    db.insert(subscriptions).values({
      id: subId,
      planId: plan.id,
      userId,
      customerType: "individual",
      status,
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      trialStart,
      trialEnd,
    }).run();

    db.insert(billingEvents).values({
      subscriptionId: subId,
      userId,
      eventType: "subscription_created",
      outcome: "success",
      actor: "user",
      actorId: userId,
      payload: JSON.stringify({ planSlug, billingCycle }),
    }).run();

    if (trialStart && trialEnd) {
      db.insert(trialPeriods).values({
        subscriptionId: subId,
        userId,
        trialPlanId: plan.id,
        startDate: trialStart,
        endDate: trialEnd,
        status: "active",
      }).run();

      db.insert(billingEvents).values({
        subscriptionId: subId,
        userId,
        eventType: "trial_started",
        outcome: "success",
        actor: "system",
        payload: JSON.stringify({ trialEnd, days: plan.trialDays }),
      }).run();
    }

    // Create invoice only for paid plans
    const priceAmount = billingCycle === "annual" ? (plan.priceAnnual ?? 0) : (plan.priceMonthly ?? 0);
    if (priceAmount > 0 && !trialStart) {
      const invId = crypto.randomUUID();
      db.insert(invoices).values({
        id: invId,
        subscriptionId: subId,
        userId,
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

  // Increment coupon redemption counter
  if (coupon) {
    db.update(discountCoupons).set({
      redemptionCount: coupon.redemptionCount + 1,
    }).where(eq(discountCoupons.id, coupon.id)).run();
  }

  const access = await getUserFeatureAccess(userId);
  return c.json({ success: true, access }, 201);
});

// ── POST /my/cancel ───────────────────────────────────────────────────────
billing.post("/my/cancel", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const reason = (body as { reason?: string }).reason ?? "";
  const immediate = (body as { immediate?: boolean }).immediate === true;

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .get();
  if (!sub) return c.json({ error: "No active subscription" }, 404);

  const now = new Date().toISOString();

  if (immediate) {
    db.update(subscriptions).set({
      status: "canceled",
      canceledAt: now,
      cancelReason: reason,
      updatedAt: now,
    }).where(eq(subscriptions.userId, userId)).run();
  } else {
    db.update(subscriptions).set({
      cancelAtPeriodEnd: true,
      cancelReason: reason,
      updatedAt: now,
    }).where(eq(subscriptions.userId, userId)).run();
  }

  db.insert(billingEvents).values({
    subscriptionId: sub.id,
    userId,
    eventType: "subscription_canceled",
    outcome: "success",
    actor: "user",
    actorId: userId,
    payload: JSON.stringify({ reason, immediate }),
  }).run();

  return c.json({ success: true, immediate });
});

// ── POST /my/reactivate ───────────────────────────────────────────────────
billing.post("/my/reactivate", async (c) => {
  const userId = c.get("userId");

  const sub = db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .get();
  if (!sub) return c.json({ error: "No subscription found" }, 404);
  if (sub.status === "canceled") return c.json({ error: "Subscription already canceled. Please subscribe again." }, 400);

  const now = new Date().toISOString();
  db.update(subscriptions).set({
    cancelAtPeriodEnd: false,
    cancelReason: null,
    updatedAt: now,
  }).where(eq(subscriptions.userId, userId)).run();

  db.insert(billingEvents).values({
    subscriptionId: sub.id,
    userId,
    eventType: "subscription_reactivated",
    outcome: "success",
    actor: "user",
    actorId: userId,
    payload: "{}",
  }).run();

  return c.json({ success: true });
});

// ── GET /my/invoices ──────────────────────────────────────────────────────
billing.get("/my/invoices", async (c) => {
  const userId = c.get("userId");

  const invList = db.select().from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt))
    .all();

  const result = invList.map((inv) => ({
    ...inv,
    lines: db.select().from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, inv.id))
      .all(),
  }));

  return c.json({ invoices: result });
});

// ── GET /my/payment-methods ───────────────────────────────────────────────
billing.get("/my/payment-methods", async (c) => {
  const userId = c.get("userId");
  const methods = db.select().from(paymentMethods)
    .where(and(eq(paymentMethods.userId, userId), isNull(paymentMethods.tenantId)))
    .all();
  return c.json({ paymentMethods: methods });
});

// ── POST /my/payment-methods ──────────────────────────────────────────────
const addPaymentSchema = z.object({
  methodType: z.enum(["card", "bank_transfer", "sepa_debit", "paypal", "invoice"]).default("card"),
  last4: z.string().length(4).optional(),
  brand: z.string().optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().optional(),
  billingName: z.string().optional(),
  billingEmail: z.string().email().optional(),
  makeDefault: z.boolean().default(false),
});

billing.post("/my/payment-methods", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = addPaymentSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const { makeDefault, ...data } = parsed.data;

  if (makeDefault) {
    db.update(paymentMethods).set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId)).run();
  }

  const existing = db.select().from(paymentMethods)
    .where(eq(paymentMethods.userId, userId)).all();

  const method = db.insert(paymentMethods).values({
    userId,
    methodType: data.methodType,
    last4: data.last4,
    brand: data.brand,
    expMonth: data.expMonth,
    expYear: data.expYear,
    billingName: data.billingName,
    billingEmail: data.billingEmail,
    isDefault: makeDefault || existing.length === 0,
  }).returning().get();

  return c.json({ paymentMethod: method }, 201);
});

// ── DELETE /my/payment-methods/:id ────────────────────────────────────────
billing.delete("/my/payment-methods/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const method = db.select().from(paymentMethods)
    .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)))
    .get();
  if (!method) return c.json({ error: "Payment method not found" }, 404);

  db.delete(paymentMethods).where(eq(paymentMethods.id, id)).run();
  return c.json({ success: true });
});

// ── POST /my/apply-coupon ─────────────────────────────────────────────────
billing.post("/my/apply-coupon", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const code = ((body as { code?: string }).code ?? "").trim().toUpperCase();
  if (!code) return c.json({ error: "Coupon code required" }, 400);

  const coupon = db.select().from(discountCoupons)
    .where(and(eq(discountCoupons.code, code), eq(discountCoupons.isActive, true)))
    .get();

  if (!coupon) return c.json({ error: "Invalid or expired coupon code" }, 400);
  if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
    return c.json({ error: "This coupon has reached its maximum redemptions" }, 400);
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
    return c.json({ error: "This coupon has expired" }, 400);
  }

  return c.json({
    valid: true,
    coupon: {
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      durationMonths: coupon.durationMonths,
    },
  });
});

// ── GET /my/customer ──────────────────────────────────────────────────────
billing.get("/my/customer", async (c) => {
  const userId = c.get("userId");
  const customer = db.select().from(customerAccounts)
    .where(eq(customerAccounts.userId, userId))
    .get();
  return c.json({ customer: customer ?? null });
});

// ── POST /my/customer ─────────────────────────────────────────────────────
const customerSchema = z.object({
  billingEmail: z.string().email().optional(),
  billingName: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  taxId: z.string().optional(),
  vatNumber: z.string().optional(),
  legalEntityName: z.string().optional(),
});

billing.post("/my/customer", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const now = new Date().toISOString();
  const existing = db.select().from(customerAccounts)
    .where(eq(customerAccounts.userId, userId))
    .get();

  if (existing) {
    db.update(customerAccounts).set({ ...parsed.data, updatedAt: now })
      .where(eq(customerAccounts.userId, userId)).run();
  } else {
    db.insert(customerAccounts).values({ userId, ...parsed.data }).run();
  }

  const customer = db.select().from(customerAccounts)
    .where(eq(customerAccounts.userId, userId))
    .get();

  return c.json({ customer });
});

export default billing;
