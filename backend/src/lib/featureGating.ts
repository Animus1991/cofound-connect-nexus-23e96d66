/**
 * Feature gating library.
 *
 * Resolves the effective feature flags and limits for a user or tenant by:
 *   1. Loading their active subscription + plan
 *   2. Merging subscription-level admin overrides (takes precedence)
 *   3. Returning a typed FeatureAccess object used in route guards + API responses
 *
 * All flag names are defined once in FEATURE_KEYS to prevent typos.
 */

import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  subscriptions,
  billingPlans,
  trialPeriods,
} from "../db/schema.js";

// ── Feature keys ──────────────────────────────────────────────────────────
// Single source of truth for every feature flag in the platform.

export const FEATURE_KEYS = [
  "basicMatching",
  "premiumMatchFilters",
  "communities",
  "privateCommunities",
  "mentorDiscovery",
  "advancedMentorFilters",
  "advancedAnalytics",
  "whiteLabelBranding",
  "sso",
  "apiAccess",
  "exportCsv",
  "prioritySupport",
  "orgDashboard",
  "seatManagement",
  "cohortManagement",
  "customIntegrations",
  "slaSupport",
] as const;

export type FeatureKey = typeof FEATURE_KEYS[number];

export type FeatureFlags = Record<FeatureKey, boolean>;

export interface Limits {
  matchesPerMonth: number;   // -1 = unlimited
  savedProfiles: number;
  communities: number;
  messages: number;
  seats: number;
  exportRows: number;
}

export interface FeatureAccess {
  planSlug: string;
  planName: string;
  tier: string;
  status: string;
  isTrialing: boolean;
  trialEnd: string | null;
  billingCycle: string;
  seatLimit: number | null;
  activeSeatCount: number;
  flags: FeatureFlags;
  limits: Limits;
  cancelAtPeriodEnd: boolean;
  renewalDate: string | null;
  currentPeriodEnd: string | null;
}

const FREE_FLAGS: FeatureFlags = {
  basicMatching: true,
  premiumMatchFilters: false,
  communities: false,
  privateCommunities: false,
  mentorDiscovery: true,
  advancedMentorFilters: false,
  advancedAnalytics: false,
  whiteLabelBranding: false,
  sso: false,
  apiAccess: false,
  exportCsv: false,
  prioritySupport: false,
  orgDashboard: false,
  seatManagement: false,
  cohortManagement: false,
  customIntegrations: false,
  slaSupport: false,
};

const FREE_LIMITS: Limits = {
  matchesPerMonth: 10,
  savedProfiles: 20,
  communities: 0,
  messages: 50,
  seats: 1,
  exportRows: 0,
};

const FREE_ACCESS: FeatureAccess = {
  planSlug: "free",
  planName: "Free",
  tier: "individual_free",
  status: "active",
  isTrialing: false,
  trialEnd: null,
  billingCycle: "monthly",
  seatLimit: 1,
  activeSeatCount: 0,
  flags: FREE_FLAGS,
  limits: FREE_LIMITS,
  cancelAtPeriodEnd: false,
  renewalDate: null,
  currentPeriodEnd: null,
};

function mergeFlags(base: FeatureFlags, overrides: Record<string, unknown>): FeatureFlags {
  const merged = { ...base };
  for (const key of FEATURE_KEYS) {
    if (key in overrides && typeof overrides[key] === "boolean") {
      merged[key] = overrides[key] as boolean;
    }
  }
  return merged;
}

function mergeLimits(base: Limits, overrides: Record<string, unknown>): Limits {
  const merged = { ...base };
  for (const key of Object.keys(merged) as (keyof Limits)[]) {
    if (key in overrides && typeof overrides[key] === "number") {
      merged[key] = overrides[key] as number;
    }
  }
  return merged;
}

/**
 * Resolve feature access for a user (B2C).
 * Falls back to FREE_ACCESS if no subscription is found.
 */
export async function getUserFeatureAccess(userId: string): Promise<FeatureAccess> {
  const sub = db.select({
    id: subscriptions.id,
    status: subscriptions.status,
    billingCycle: subscriptions.billingCycle,
    seatLimit: subscriptions.seatLimit,
    activeSeatCount: subscriptions.activeSeatCount,
    cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    renewalDate: subscriptions.renewalDate,
    trialStart: subscriptions.trialStart,
    trialEnd: subscriptions.trialEnd,
    featureFlagOverrides: subscriptions.featureFlagOverrides,
    limitOverrides: subscriptions.limitOverrides,
    planSlug: billingPlans.slug,
    planName: billingPlans.name,
    tier: billingPlans.tier,
    planFlags: billingPlans.featureFlags,
    planLimits: billingPlans.limits,
  })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, subscriptions.planId))
    .where(and(
      eq(subscriptions.userId, userId),
      // Treat both active and trialing subscriptions as valid
    ))
    .get();

  if (!sub) return { ...FREE_ACCESS };

  // Only honor active/trialing; past_due gets limited grace
  const validStatuses = new Set(["active", "trialing", "past_due"]);
  if (!validStatuses.has(sub.status)) return { ...FREE_ACCESS, status: sub.status };

  const baseFlags = mergeFlags(FREE_FLAGS, JSON.parse(sub.planFlags) as Record<string, unknown>);
  const baseLimit = mergeLimits(FREE_LIMITS, JSON.parse(sub.planLimits) as Record<string, unknown>);

  const flagOverrides = JSON.parse(sub.featureFlagOverrides) as Record<string, unknown>;
  const limitOverrides = JSON.parse(sub.limitOverrides) as Record<string, unknown>;

  const isTrialing = sub.status === "trialing" || (!!sub.trialEnd && new Date(sub.trialEnd) > new Date());

  return {
    planSlug: sub.planSlug,
    planName: sub.planName,
    tier: sub.tier,
    status: sub.status,
    isTrialing,
    trialEnd: sub.trialEnd,
    billingCycle: sub.billingCycle,
    seatLimit: sub.seatLimit,
    activeSeatCount: sub.activeSeatCount,
    flags: mergeFlags(baseFlags, flagOverrides),
    limits: mergeLimits(baseLimit, limitOverrides),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    renewalDate: sub.renewalDate,
    currentPeriodEnd: sub.currentPeriodEnd,
  };
}

/**
 * Resolve feature access for a tenant (B2B).
 * Falls back to FREE_ACCESS if no subscription exists.
 */
export async function getTenantFeatureAccess(tenantId: string): Promise<FeatureAccess> {
  const sub = db.select({
    id: subscriptions.id,
    status: subscriptions.status,
    billingCycle: subscriptions.billingCycle,
    seatLimit: subscriptions.seatLimit,
    activeSeatCount: subscriptions.activeSeatCount,
    cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    renewalDate: subscriptions.renewalDate,
    trialStart: subscriptions.trialStart,
    trialEnd: subscriptions.trialEnd,
    featureFlagOverrides: subscriptions.featureFlagOverrides,
    limitOverrides: subscriptions.limitOverrides,
    planSlug: billingPlans.slug,
    planName: billingPlans.name,
    tier: billingPlans.tier,
    planFlags: billingPlans.featureFlags,
    planLimits: billingPlans.limits,
  })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(billingPlans.id, subscriptions.planId))
    .where(eq(subscriptions.tenantId, tenantId))
    .get();

  if (!sub) return { ...FREE_ACCESS };

  const validStatuses = new Set(["active", "trialing", "past_due"]);
  if (!validStatuses.has(sub.status)) return { ...FREE_ACCESS, status: sub.status };

  const baseFlags = mergeFlags(FREE_FLAGS, JSON.parse(sub.planFlags) as Record<string, unknown>);
  const baseLimit = mergeLimits(FREE_LIMITS, JSON.parse(sub.planLimits) as Record<string, unknown>);
  const flagOverrides = JSON.parse(sub.featureFlagOverrides) as Record<string, unknown>;
  const limitOverrides = JSON.parse(sub.limitOverrides) as Record<string, unknown>;
  const isTrialing = sub.status === "trialing" || (!!sub.trialEnd && new Date(sub.trialEnd) > new Date());

  return {
    planSlug: sub.planSlug,
    planName: sub.planName,
    tier: sub.tier,
    status: sub.status,
    isTrialing,
    trialEnd: sub.trialEnd,
    billingCycle: sub.billingCycle,
    seatLimit: sub.seatLimit,
    activeSeatCount: sub.activeSeatCount,
    flags: mergeFlags(baseFlags, flagOverrides),
    limits: mergeLimits(baseLimit, limitOverrides),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    renewalDate: sub.renewalDate,
    currentPeriodEnd: sub.currentPeriodEnd,
  };
}

/**
 * Convenience: require a feature flag or throw 403.
 * Usage in route handlers:
 *   const access = await getUserFeatureAccess(userId);
 *   requireFeature(access, "premiumMatchFilters");
 */
export function requireFeature(access: FeatureAccess, feature: FeatureKey): void {
  if (!access.flags[feature]) {
    const err = new Error(`Feature '${feature}' is not included in your current plan (${access.planName}). Upgrade to unlock.`);
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}

/** Generate a human-readable invoice number: INV-YYYY-NNNNNN */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `INV-${year}-${rand}`;
}

/** Add N months to an ISO date string, return ISO string */
export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

/** Add N days to an ISO date string, return ISO string */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
