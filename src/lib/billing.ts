/**
 * billing.ts — Frontend billing API client + shared types.
 *
 * All functions communicate with the Hono backend billing routes.
 * Payment execution is architecturally mocked (provider abstraction ready).
 */

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ── Shared types ──────────────────────────────────────────────────────────

export type PlanTier =
  | "individual_free"
  | "individual_premium"
  | "org_starter"
  | "org_pro"
  | "enterprise"
  | "custom";

export type SubscriptionStatus =
  | "trialing" | "active" | "past_due" | "canceled"
  | "unpaid" | "paused" | "incomplete" | "incomplete_expired";

export type BillingCycle = "monthly" | "annual" | "one_time" | "custom";

export type CustomerType = "individual" | "tenant" | "enterprise";

export interface FeatureFlags {
  basicMatching: boolean;
  premiumMatchFilters: boolean;
  communities: boolean;
  privateCommunities: boolean;
  mentorDiscovery: boolean;
  advancedMentorFilters: boolean;
  advancedAnalytics: boolean;
  whiteLabelBranding: boolean;
  sso: boolean;
  apiAccess: boolean;
  exportCsv: boolean;
  prioritySupport: boolean;
  orgDashboard: boolean;
  seatManagement: boolean;
  cohortManagement: boolean;
  customIntegrations: boolean;
  slaSupport: boolean;
}

export interface PlanLimits {
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
  tier: PlanTier;
  status: SubscriptionStatus | "active";
  isTrialing: boolean;
  trialEnd: string | null;
  billingCycle: BillingCycle;
  seatLimit: number | null;
  activeSeatCount: number;
  flags: FeatureFlags;
  limits: PlanLimits;
  cancelAtPeriodEnd: boolean;
  renewalDate: string | null;
  currentPeriodEnd: string | null;
}

export interface BillingPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tier: PlanTier;
  billingCycle: BillingCycle;
  priceMonthly: number | null;
  priceAnnual: number | null;
  currency: string;
  seatLimit: number | null;
  featureFlags: Partial<FeatureFlags>;
  limits: Partial<PlanLimits>;
  marketingFeatures: string[];
  overagePolicy: Record<string, unknown>;
  isSsoIncluded: boolean;
  isWhiteLabelIncluded: boolean;
  isAdvancedAnalyticsIncluded: boolean;
  isMentorModuleIncluded: boolean;
  isCommunityModuleIncluded: boolean;
  isCohortModuleIncluded: boolean;
  isPublic: boolean;
  trialDays: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddOn {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  billingCycle: BillingCycle;
  priceMonthly: number | null;
  priceAnnual: number | null;
  currency: string;
  featureFlags: Partial<FeatureFlags>;
  limits: Partial<PlanLimits>;
  compatiblePlanSlugs: string[] | null;
  isPublic: boolean;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  seatLimit: number | null;
  activeSeatCount: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  renewalDate: string | null;
  lastPaymentStatus: string | null;
  failedPaymentCount: number;
  gracePeriodEnd: string | null;
  planId: string;
  planSlug: string;
  planName: string;
  planTier: PlanTier;
  planDescription: string | null;
  priceMonthly: number | null;
  priceAnnual: number | null;
  trialDays: number;
  marketingFeatures: string[];
  isSsoIncluded: boolean;
  isWhiteLabelIncluded: boolean;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitAmountCents: number;
  totalCents: number;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  lineType: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string | null;
  userId: string | null;
  tenantId: string | null;
  invoiceNumber: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  billingName: string | null;
  billingEmail: string | null;
  billingCountry: string | null;
  vatNumber: string | null;
  legalEntityName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  providerInvoiceId: string | null;
  providerHostedUrl: string | null;
  providerPdfUrl: string | null;
  createdAt: string;
  lines?: InvoiceLine[];
}

export interface PaymentMethod {
  id: string;
  methodType: string;
  last4: string | null;
  brand: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
  billingName: string | null;
  billingEmail: string | null;
  createdAt: string;
}

export interface CustomerAccount {
  id: string;
  userId: string;
  customerType: string;
  billingEmail: string | null;
  billingName: string | null;
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  taxId: string | null;
  vatNumber: string | null;
  legalEntityName: string | null;
  currency: string;
}

export interface TenantBillingAccount {
  id: string;
  tenantId: string;
  billingContactName: string | null;
  billingContactEmail: string | null;
  billingContactPhone: string | null;
  billingAddressLine1: string | null;
  billingCity: string | null;
  billingCountry: string | null;
  taxId: string | null;
  vatNumber: string | null;
  legalEntityName: string | null;
  purchaseOrderNumber: string | null;
  currency: string;
}

export interface SeatAllocation {
  id: string;
  subscriptionId: string;
  tenantId: string;
  userId: string | null;
  inviteEmail: string | null;
  status: "active" | "pending" | "revoked";
  role: string;
  allocatedAt: string;
  revokedAt: string | null;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: "percentage" | "fixed_amount" | "trial_extension";
  discountValue: number;
  durationMonths: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  applicablePlanSlugs: string[] | null;
  applicableCustomerType: string | null;
  createdAt: string;
}

export interface BillingEvent {
  id: string;
  subscriptionId: string | null;
  userId: string | null;
  tenantId: string | null;
  eventType: string;
  outcome: string;
  actor: string;
  actorId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AdminBillingStats {
  subscriptions: { total: number; active: number; trialing: number; canceled: number; pastDue: number };
  revenue: { totalCents: number; totalDollars: number };
  invoices: { total: number; paid: number; open: number };
  planBreakdown: { planName: string; planSlug: string; count: number }[];
}

// ── HTTP helper ────────────────────────────────────────────────────────────

async function apiReq<T>(
  path: string,
  opts?: RequestInit & { token?: string | null },
): Promise<T> {
  const { token, ...rest } = opts ?? {};
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...rest,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(b.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Public plans (no auth) ─────────────────────────────────────────────────

export async function getPublicPlans(): Promise<{ plans: BillingPlan[]; addOns: AddOn[] }> {
  return apiReq("/api/billing/public/plans");
}

// ── User billing ───────────────────────────────────────────────────────────

export async function getUserFeatures(token: string): Promise<{ access: FeatureAccess }> {
  return apiReq("/api/billing/my/features", { token });
}

export async function getUserSubscription(token: string): Promise<{ subscription: Subscription | null; access: FeatureAccess }> {
  return apiReq("/api/billing/my/subscription", { token });
}

export async function subscribeUser(
  token: string,
  payload: { planSlug: string; billingCycle: "monthly" | "annual"; couponCode?: string },
): Promise<{ success: boolean; access: FeatureAccess }> {
  return apiReq("/api/billing/my/subscribe", { method: "POST", token, body: JSON.stringify(payload) });
}

export async function cancelUserSubscription(
  token: string,
  payload: { reason?: string; immediate?: boolean },
): Promise<{ success: boolean }> {
  return apiReq("/api/billing/my/cancel", { method: "POST", token, body: JSON.stringify(payload) });
}

export async function reactivateUserSubscription(token: string): Promise<{ success: boolean }> {
  return apiReq("/api/billing/my/reactivate", { method: "POST", token, body: "{}" });
}

export async function getUserInvoices(token: string): Promise<{ invoices: Invoice[] }> {
  return apiReq("/api/billing/my/invoices", { token });
}

export async function getUserPaymentMethods(token: string): Promise<{ paymentMethods: PaymentMethod[] }> {
  return apiReq("/api/billing/my/payment-methods", { token });
}

export async function addUserPaymentMethod(
  token: string,
  payload: Partial<PaymentMethod> & { makeDefault?: boolean },
): Promise<{ paymentMethod: PaymentMethod }> {
  return apiReq("/api/billing/my/payment-methods", { method: "POST", token, body: JSON.stringify(payload) });
}

export async function deleteUserPaymentMethod(token: string, id: string): Promise<{ success: boolean }> {
  return apiReq(`/api/billing/my/payment-methods/${id}`, { method: "DELETE", token });
}

export async function validateCoupon(
  token: string,
  code: string,
): Promise<{ valid: boolean; coupon?: { code: string; name: string; discountType: string; discountValue: number; durationMonths: number | null } }> {
  return apiReq("/api/billing/my/apply-coupon", { method: "POST", token, body: JSON.stringify({ code }) });
}

export async function getUserCustomer(token: string): Promise<{ customer: CustomerAccount | null }> {
  return apiReq("/api/billing/my/customer", { token });
}

export async function saveUserCustomer(
  token: string,
  payload: Partial<CustomerAccount>,
): Promise<{ customer: CustomerAccount }> {
  return apiReq("/api/billing/my/customer", { method: "POST", token, body: JSON.stringify(payload) });
}

// ── Tenant billing ─────────────────────────────────────────────────────────

export async function getTenantSubscription(
  token: string,
  tenantId: string,
): Promise<{ subscription: Subscription | null; access: FeatureAccess }> {
  return apiReq(`/api/tenant-billing/${tenantId}/subscription`, { token });
}

export async function getTenantFeatures(
  token: string,
  tenantId: string,
): Promise<{ access: FeatureAccess }> {
  return apiReq(`/api/tenant-billing/${tenantId}/features`, { token });
}

export async function subscribeTenant(
  token: string,
  tenantId: string,
  payload: { planSlug: string; billingCycle: "monthly" | "annual"; seatLimit?: number },
): Promise<{ success: boolean; access: FeatureAccess }> {
  return apiReq(`/api/tenant-billing/${tenantId}/subscribe`, { method: "POST", token, body: JSON.stringify(payload) });
}

export async function cancelTenantSubscription(
  token: string,
  tenantId: string,
  payload: { reason?: string },
): Promise<{ success: boolean }> {
  return apiReq(`/api/tenant-billing/${tenantId}/cancel`, { method: "POST", token, body: JSON.stringify(payload) });
}

export async function getTenantInvoices(
  token: string,
  tenantId: string,
): Promise<{ invoices: Invoice[] }> {
  return apiReq(`/api/tenant-billing/${tenantId}/invoices`, { token });
}

export async function getTenantSeats(
  token: string,
  tenantId: string,
): Promise<{ seats: SeatAllocation[]; seatLimit: number | null; activeSeatCount: number }> {
  return apiReq(`/api/tenant-billing/${tenantId}/seats`, { token });
}

export async function allocateSeat(
  token: string,
  tenantId: string,
  payload: { userId?: string; inviteEmail?: string; role?: string },
): Promise<{ seat: SeatAllocation }> {
  return apiReq(`/api/tenant-billing/${tenantId}/seats`, { method: "POST", token, body: JSON.stringify(payload) });
}

export async function revokeSeat(
  token: string,
  tenantId: string,
  seatId: string,
): Promise<{ success: boolean }> {
  return apiReq(`/api/tenant-billing/${tenantId}/seats/${seatId}`, { method: "DELETE", token });
}

export async function getTenantCustomer(
  token: string,
  tenantId: string,
): Promise<{ customer: TenantBillingAccount | null }> {
  return apiReq(`/api/tenant-billing/${tenantId}/customer`, { token });
}

export async function saveTenantCustomer(
  token: string,
  tenantId: string,
  payload: Partial<TenantBillingAccount>,
): Promise<{ customer: TenantBillingAccount }> {
  return apiReq(`/api/tenant-billing/${tenantId}/customer`, { method: "PUT", token, body: JSON.stringify(payload) });
}

export async function requestTenantUpgrade(
  token: string,
  tenantId: string,
  details: Record<string, unknown>,
): Promise<{ success: boolean; message: string }> {
  return apiReq(`/api/tenant-billing/${tenantId}/request-upgrade`, { method: "POST", token, body: JSON.stringify(details) });
}

export async function requestAdditionalSeats(
  token: string,
  tenantId: string,
  additionalSeats: number,
): Promise<{ success: boolean; message: string }> {
  return apiReq(`/api/tenant-billing/${tenantId}/request-seats`, { method: "POST", token, body: JSON.stringify({ additionalSeats }) });
}

// ── Admin billing ──────────────────────────────────────────────────────────

export async function adminGetPlans(token: string): Promise<{ plans: BillingPlan[] }> {
  return apiReq("/api/admin/billing/plans", { token });
}

export async function adminCreatePlan(token: string, payload: Partial<BillingPlan>): Promise<{ plan: BillingPlan }> {
  return apiReq("/api/admin/billing/plans", { method: "POST", token, body: JSON.stringify(payload) });
}

export async function adminUpdatePlan(token: string, id: string, payload: Partial<BillingPlan>): Promise<{ plan: BillingPlan }> {
  return apiReq(`/api/admin/billing/plans/${id}`, { method: "PUT", token, body: JSON.stringify(payload) });
}

export async function adminDeletePlan(token: string, id: string): Promise<{ success: boolean }> {
  return apiReq(`/api/admin/billing/plans/${id}`, { method: "DELETE", token });
}

export async function adminGetSubscriptions(
  token: string,
  params?: { limit?: number; offset?: number; search?: string; status?: string },
): Promise<{ subscriptions: Subscription[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  return apiReq(`/api/admin/billing/subscriptions?${q}`, { token });
}

export async function adminGetSubscription(token: string, id: string): Promise<{ subscription: Subscription; plan: BillingPlan; events: BillingEvent[]; invoices: Invoice[] }> {
  return apiReq(`/api/admin/billing/subscriptions/${id}`, { token });
}

export async function adminOverrideFeatures(
  token: string,
  id: string,
  payload: { featureFlagOverrides?: Partial<FeatureFlags>; limitOverrides?: Partial<PlanLimits>; adminNotes?: string },
): Promise<{ success: boolean }> {
  return apiReq(`/api/admin/billing/subscriptions/${id}/override-features`, { method: "POST", token, body: JSON.stringify(payload) });
}

export async function adminUpgradeSubscription(token: string, id: string, planSlug: string): Promise<{ success: boolean }> {
  return apiReq(`/api/admin/billing/subscriptions/${id}/upgrade`, { method: "POST", token, body: JSON.stringify({ planSlug }) });
}

export async function adminCancelSubscription(token: string, id: string, reason?: string): Promise<{ success: boolean }> {
  return apiReq(`/api/admin/billing/subscriptions/${id}/cancel`, { method: "POST", token, body: JSON.stringify({ reason }) });
}

export async function adminExtendTrial(token: string, id: string, days: number): Promise<{ success: boolean; newTrialEnd: string }> {
  return apiReq(`/api/admin/billing/subscriptions/${id}/extend-trial`, { method: "POST", token, body: JSON.stringify({ days }) });
}

export async function adminGetInvoices(token: string, params?: { limit?: number; offset?: number }): Promise<{ invoices: Invoice[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  return apiReq(`/api/admin/billing/invoices?${q}`, { token });
}

export async function adminVoidInvoice(token: string, id: string): Promise<{ success: boolean }> {
  return apiReq(`/api/admin/billing/invoices/${id}/void`, { method: "POST", token, body: "{}" });
}

export async function adminGetCoupons(token: string): Promise<{ coupons: DiscountCoupon[] }> {
  return apiReq("/api/admin/billing/coupons", { token });
}

export async function adminCreateCoupon(token: string, payload: Partial<DiscountCoupon>): Promise<{ coupon: DiscountCoupon }> {
  return apiReq("/api/admin/billing/coupons", { method: "POST", token, body: JSON.stringify(payload) });
}

export async function adminUpdateCoupon(token: string, id: string, payload: Partial<DiscountCoupon>): Promise<{ coupon: DiscountCoupon }> {
  return apiReq(`/api/admin/billing/coupons/${id}`, { method: "PUT", token, body: JSON.stringify(payload) });
}

export async function adminDeactivateCoupon(token: string, id: string): Promise<{ success: boolean }> {
  return apiReq(`/api/admin/billing/coupons/${id}`, { method: "DELETE", token });
}

export async function adminGetBillingStats(token: string): Promise<AdminBillingStats> {
  return apiReq("/api/admin/billing/stats", { token });
}

export async function adminGetBillingEvents(token: string, params?: { limit?: number; offset?: number }): Promise<{ events: BillingEvent[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  return apiReq(`/api/admin/billing/events?${q}`, { token });
}

// ── Formatting helpers ─────────────────────────────────────────────────────

export function formatCents(cents: number, currency = "USD"): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatPlanPrice(plan: BillingPlan, cycle: "monthly" | "annual"): string {
  if (plan.tier === "enterprise" || plan.billingCycle === "custom") return "Contact us";
  const cents = cycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
  if (cents === null || cents === undefined) return "Contact us";
  if (cents === 0) return "Free";
  const monthly = cycle === "annual" ? Math.round(cents / 12) : cents;
  return formatCents(monthly, plan.currency);
}

export function formatLimit(value: number): string {
  return value === -1 ? "Unlimited" : String(value);
}

export const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past Due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  paused: "Paused",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
};

export const STATUS_COLORS: Record<string, string> = {
  trialing: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  past_due: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  canceled: "bg-muted text-muted-foreground border-border",
  unpaid: "bg-destructive/10 text-destructive border-destructive/30",
};

export const TIER_LABELS: Record<string, string> = {
  individual_free: "Free",
  individual_premium: "Premium",
  org_starter: "Organization Starter",
  org_pro: "Organization Pro",
  enterprise: "Enterprise",
  custom: "Custom",
};

export const TIER_COLORS: Record<string, string> = {
  individual_free: "text-muted-foreground",
  individual_premium: "text-primary",
  org_starter: "text-indigo-500",
  org_pro: "text-purple-500",
  enterprise: "text-amber-500",
  custom: "text-rose-500",
};
