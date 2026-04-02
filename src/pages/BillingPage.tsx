import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Receipt, Star, ShieldCheck, Zap, Check, X,
  ChevronRight, AlertTriangle, RefreshCw, Loader2, Clock,
  Download, Tag, Users, Building2, Sparkles, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserSubscription, getUserInvoices, getUserPaymentMethods,
  getPublicPlans, subscribeUser, cancelUserSubscription, reactivateUserSubscription,
  deleteUserPaymentMethod, validateCoupon, saveUserCustomer, getUserCustomer,
  formatCents, formatPlanPrice, STATUS_LABELS, STATUS_COLORS, TIER_LABELS,
  type Subscription, type Invoice, type PaymentMethod, type BillingPlan, type FeatureAccess, type CustomerAccount,
} from "@/lib/billing";

type Tab = "overview" | "plans" | "invoices" | "payment" | "billing-contact";

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap, premium: Star, org_starter: Users, org_pro: Building2, enterprise: ShieldCheck,
};

export default function BillingPage() {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab | null) ?? "overview",
  );

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [access, setAccess] = useState<FeatureAccess | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Plan selection
  const [selectedPlanSlug, setSelectedPlanSlug] = useState(searchParams.get("plan") ?? "");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    (searchParams.get("cycle") as "monthly" | "annual") ?? "monthly",
  );
  const [couponInput, setCouponInput] = useState("");
  const [couponValid, setCouponValid] = useState<null | { name: string; discountType: string; discountValue: number }>(null);
  const [couponError, setCouponError] = useState("");

  // Billing contact
  const [contactDraft, setContactDraft] = useState<Partial<CustomerAccount>>({});
  const [savingContact, setSavingContact] = useState(false);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [subRes, invRes, pmRes, plansRes, custRes] = await Promise.all([
        getUserSubscription(token),
        getUserInvoices(token),
        getUserPaymentMethods(token),
        getPublicPlans(),
        getUserCustomer(token),
      ]);
      setSubscription(subRes.subscription);
      setAccess(subRes.access);
      setInvoices(invRes.invoices);
      setPaymentMethods(pmRes.paymentMethods);
      setPlans(plansRes.plans);
      setCustomer(custRes.customer);
      setContactDraft(custRes.customer ?? {});
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void reload(); }, [reload]);

  // If coming from pricing page with a plan pre-selected, jump to plans tab
  useEffect(() => {
    if (searchParams.get("plan")) setActiveTab("plans");
  }, [searchParams]);

  const doSubscribe = async () => {
    if (!token || !selectedPlanSlug) return;
    setActionLoading(true);
    setMsg(null);
    try {
      await subscribeUser(token, { planSlug: selectedPlanSlug, billingCycle, couponCode: couponInput || undefined });
      setMsg({ type: "ok", text: "Subscription updated successfully!" });
      await reload();
      setActiveTab("overview");
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setActionLoading(false); }
  };

  const doCancel = async () => {
    if (!token || !confirm("Cancel your subscription at the end of the current billing period?")) return;
    setActionLoading(true);
    try {
      await cancelUserSubscription(token, { reason: "User requested cancellation" });
      setMsg({ type: "ok", text: "Subscription will cancel at period end." });
      await reload();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setActionLoading(false); }
  };

  const doReactivate = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      await reactivateUserSubscription(token);
      setMsg({ type: "ok", text: "Subscription reactivated!" });
      await reload();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setActionLoading(false); }
  };

  const doDeletePaymentMethod = async (id: string) => {
    if (!token || !confirm("Remove this payment method?")) return;
    await deleteUserPaymentMethod(token, id);
    await reload();
  };

  const doValidateCoupon = async () => {
    if (!token || !couponInput) return;
    setCouponError("");
    try {
      const r = await validateCoupon(token, couponInput);
      if (r.valid && r.coupon) {
        setCouponValid(r.coupon);
      }
    } catch (e) {
      setCouponError((e as Error).message);
      setCouponValid(null);
    }
  };

  const doSaveContact = async () => {
    if (!token) return;
    setSavingContact(true);
    try {
      const res = await saveUserCustomer(token, contactDraft);
      setCustomer(res.customer);
      setMsg({ type: "ok", text: "Billing contact saved." });
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setSavingContact(false); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Zap },
    { id: "plans", label: "Plans", icon: Star },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "billing-contact", label: "Billing Info", icon: Building2 },
  ];

  if (!user) {
    return (
      <AppLayout title="Billing">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please <Link to="/login" className="text-primary underline">sign in</Link> to manage billing.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Billing & Subscription">
      <div className="px-2 py-4 max-w-4xl">
        {/* Tab bar */}
        <div className="flex gap-0.5 overflow-x-auto border-b border-border mb-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Global message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm border ${
                msg.type === "ok"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              }`}
            >
              {msg.type === "ok" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {msg.text}
              <button onClick={() => setMsg(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Current plan card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current plan</p>
                        <div className="flex items-center gap-3">
                          <h2 className="font-display text-xl font-bold text-foreground">
                            {access?.planName ?? "Free"}
                          </h2>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[access?.status ?? "active"]}`}>
                            {STATUS_LABELS[access?.status ?? "active"] ?? "Active"}
                          </Badge>
                          {access?.isTrialing && access.trialEnd && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Trial ends {new Date(access.trialEnd).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        {subscription?.planTier && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {TIER_LABELS[subscription.planTier] ?? subscription.planTier}
                            {subscription.billingCycle !== "custom" && ` · ${subscription.billingCycle}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setActiveTab("plans")}>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          {access?.isOnFreePlan ?? access?.tier === "individual_free" ? "Upgrade" : "Change plan"}
                        </Button>
                        {subscription?.cancelAtPeriodEnd ? (
                          <Button size="sm" variant="outline" onClick={doReactivate} disabled={actionLoading}>
                            Reactivate
                          </Button>
                        ) : subscription && subscription.planSlug !== "free" ? (
                          <Button size="sm" variant="ghost" onClick={doCancel} disabled={actionLoading} className="text-muted-foreground">
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {subscription?.cancelAtPeriodEnd && (
                    <div className="px-5 py-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Subscription cancels on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "period end"}. Reactivate to continue.
                    </div>
                  )}

                  {subscription?.renewalDate && !subscription.cancelAtPeriodEnd && (
                    <div className="px-5 py-3 border-b border-border text-xs text-muted-foreground">
                      Next renewal: <span className="text-foreground font-medium">{new Date(subscription.renewalDate).toLocaleDateString()}</span>
                      {subscription.priceMonthly !== null && subscription.priceMonthly > 0 && (
                        <span className="ml-2">· {formatCents(subscription.billingCycle === "annual" ? (subscription.priceAnnual ?? 0) : subscription.priceMonthly)}</span>
                      )}
                    </div>
                  )}

                  {/* Feature flags grid */}
                  {access && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-medium text-foreground mb-3">Your plan includes</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { flag: "basicMatching", label: "Basic matching" },
                          { flag: "premiumMatchFilters", label: "Premium filters" },
                          { flag: "advancedAnalytics", label: "Advanced analytics" },
                          { flag: "communities", label: "Communities" },
                          { flag: "exportCsv", label: "CSV export" },
                          { flag: "sso", label: "SSO" },
                          { flag: "whiteLabelBranding", label: "White-label" },
                          { flag: "prioritySupport", label: "Priority support" },
                          { flag: "apiAccess", label: "API access" },
                        ].map(({ flag, label }) => {
                          const has = access.flags[flag as keyof typeof access.flags];
                          return (
                            <div key={flag} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${has ? "bg-emerald-500/5 text-foreground border border-emerald-500/20" : "bg-secondary/30 text-muted-foreground border border-border"}`}>
                              {has ? <Check className="h-3 w-3 text-emerald-500 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                              {label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                {access && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Matches / month", value: access.limits.matchesPerMonth === -1 ? "∞" : String(access.limits.matchesPerMonth) },
                      { label: "Saved profiles", value: access.limits.savedProfiles === -1 ? "∞" : String(access.limits.savedProfiles) },
                      { label: "Messages", value: access.limits.messages === -1 ? "∞" : String(access.limits.messages) },
                      { label: "Seats", value: access.seatLimit === null || access.seatLimit === -1 ? "∞" : String(access.seatLimit) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                        <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent invoices */}
                {invoices.length > 0 && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Recent invoices</span>
                      <button onClick={() => setActiveTab("invoices")} className="text-xs text-primary hover:underline">View all</button>
                    </div>
                    <div className="divide-y divide-border">
                      {invoices.slice(0, 3).map((inv) => (
                        <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                          <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs font-medium text-foreground">{formatCents(inv.totalCents, inv.currency)}</span>
                          <Badge variant="outline" className={`text-[10px] ${inv.status === "paid" ? "text-emerald-600 border-emerald-500/30" : ""}`}>
                            {inv.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PLANS ─────────────────────────────────────────────────────── */}
            {activeTab === "plans" && (
              <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">Choose a plan</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Select a plan then confirm below.</p>
                  </div>
                  {/* Monthly/Annual toggle */}
                  <div className="inline-flex items-center gap-1 rounded-full border border-border p-0.5 bg-card">
                    {(["monthly", "annual"] as const).map((c) => (
                      <button key={c} onClick={() => setBillingCycle(c)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all capitalize ${billingCycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        {c}
                        {c === "annual" && <span className="ml-1.5 opacity-70">-20%</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {plans.filter((p) => p.tier !== "enterprise").map((plan) => {
                    const Icon = PLAN_ICONS[plan.slug] ?? Zap;
                    const isCurrent = subscription?.planSlug === plan.slug;
                    const isSelected = selectedPlanSlug === plan.slug;
                    const price = formatPlanPrice(plan, billingCycle);

                    return (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanSlug(plan.slug)}
                        className={`text-left rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                            : isCurrent
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{price}{price !== "Free" && price !== "Contact us" ? "/mo" : ""}</p>
                          </div>
                          {isCurrent && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Current</Badge>}
                          {isSelected && !isCurrent && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><Check className="h-2.5 w-2.5 text-primary-foreground" /></div>}
                        </div>
                        <ul className="space-y-1">
                          {plan.marketingFeatures.slice(0, 4).map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                        {plan.trialDays > 0 && (
                          <p className="mt-2 text-[10px] text-primary font-medium">{plan.trialDays}-day free trial</p>
                        )}
                      </button>
                    );
                  })}

                  {/* Enterprise CTA */}
                  <Link to="/pricing" className="text-left rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <ShieldCheck className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Enterprise</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Custom pricing, unlimited seats, SLA, dedicated support. <span className="text-primary underline">Contact sales</span></p>
                  </Link>
                </div>

                {/* Coupon input */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <p className="text-xs font-medium text-foreground">Have a promo code?</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="pl-8 h-8 text-xs font-mono uppercase"
                        placeholder="PROMO CODE"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponValid(null); setCouponError(""); }}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={doValidateCoupon} disabled={!couponInput}>Apply</Button>
                  </div>
                  {couponValid && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <Check className="h-3.5 w-3.5" />
                      <strong>{couponValid.name}</strong>:
                      {couponValid.discountType === "percentage" ? ` ${couponValid.discountValue}% off` : ""}
                      {couponValid.discountType === "fixed_amount" ? ` ${formatCents(couponValid.discountValue)} off` : ""}
                    </div>
                  )}
                  {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                </div>

                <div className="flex gap-3">
                  <Button
                    disabled={!selectedPlanSlug || actionLoading}
                    onClick={doSubscribe}
                    className="gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                    {subscription ? "Update subscription" : "Subscribe"}
                  </Button>
                  <Link to="/pricing">
                    <Button variant="ghost" size="sm">
                      Full plan comparison <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── INVOICES ──────────────────────────────────────────────────── */}
            {activeTab === "invoices" && (
              <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {invoices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-12 text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No invoices yet</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="divide-y divide-border">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                          <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{inv.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(inv.createdAt).toLocaleDateString()}
                              {inv.periodStart && inv.periodEnd && (
                                <> · {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}</>
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{formatCents(inv.totalCents, inv.currency)}</span>
                          <Badge variant="outline" className={`text-xs ${inv.status === "paid" ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" : inv.status === "void" ? "text-muted-foreground" : "text-amber-600 border-amber-500/30"}`}>
                            {inv.status}
                          </Badge>
                          {inv.providerPdfUrl && (
                            <a href={inv.providerPdfUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PAYMENT METHODS ───────────────────────────────────────────── */}
            {activeTab === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-10 text-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No payment methods on file</p>
                    <p className="text-xs text-muted-foreground mt-1">Payment methods are added during checkout</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map((pm) => (
                      <div key={pm.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground capitalize">
                            {pm.brand ?? pm.methodType}
                            {pm.last4 && <span className="text-muted-foreground"> •••• {pm.last4}</span>}
                          </p>
                          {pm.expMonth && pm.expYear && (
                            <p className="text-xs text-muted-foreground">Expires {pm.expMonth}/{pm.expYear}</p>
                          )}
                        </div>
                        {pm.isDefault && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Default</Badge>}
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => doDeletePaymentMethod(pm.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5 text-xs text-muted-foreground flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  Payment methods are managed securely via our payment provider. Card details are never stored on our servers.
                </div>
              </motion.div>
            )}

            {/* ── BILLING CONTACT ───────────────────────────────────────────── */}
            {activeTab === "billing-contact" && (
              <motion.div key="billing-contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">Billing information</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Used for invoices and tax purposes.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { key: "billingName", label: "Full name / Entity name", placeholder: "John Smith or Acme Corp" },
                    { key: "billingEmail", label: "Billing email", placeholder: "billing@company.com" },
                    { key: "legalEntityName", label: "Legal entity name", placeholder: "Acme Corp Ltd." },
                    { key: "billingAddressLine1", label: "Address", placeholder: "123 Main St" },
                    { key: "billingCity", label: "City", placeholder: "Athens" },
                    { key: "billingState", label: "State / Region", placeholder: "Attica" },
                    { key: "billingPostalCode", label: "Postal code", placeholder: "10552" },
                    { key: "billingCountry", label: "Country", placeholder: "GR" },
                    { key: "vatNumber", label: "VAT number", placeholder: "EL123456789" },
                    { key: "taxId", label: "Tax ID", placeholder: "123456789" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder={placeholder}
                        value={(contactDraft as Record<string, string>)[key] ?? ""}
                        onChange={(e) => setContactDraft((d) => ({ ...d, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={doSaveContact} disabled={savingContact} className="gap-2">
                  {savingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save billing info
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Link to="/pricing" className="text-xs text-primary hover:underline ml-auto">View full pricing page →</Link>
        </div>
      </div>
    </AppLayout>
  );
}
