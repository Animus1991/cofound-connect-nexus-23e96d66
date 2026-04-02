/**
 * BillingAdminPanel — Super-admin billing management.
 * Tabs: Stats · Plans · Subscriptions · Invoices · Coupons · Events
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Star, Users, Receipt, Tag, Activity,
  Plus, Pencil, Trash2, Check, X, Loader2, AlertTriangle,
  RefreshCw, ChevronDown, TrendingUp, CreditCard, Clock,
  ShieldCheck, Zap, ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminGetBillingStats, adminGetPlans, adminGetSubscriptions, adminGetInvoices,
  adminGetCoupons, adminGetBillingEvents, adminCreateCoupon, adminDeactivateCoupon,
  adminCancelSubscription, adminExtendTrial, adminUpgradeSubscription,
  adminVoidInvoice, adminOverrideFeatures,
  formatCents, STATUS_LABELS, STATUS_COLORS, TIER_LABELS,
  type AdminBillingStats, type BillingPlan, type Subscription,
  type Invoice, type DiscountCoupon, type BillingEvent,
} from "@/lib/billing";

type Tab = "stats" | "plans" | "subscriptions" | "invoices" | "coupons" | "events";

export default function BillingAdminPanel() {
  const { user } = useAuth();
  const token = user?.token ?? null;

  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<AdminBillingStats | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesTotal, setInvoicesTotal] = useState(0);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Subscriptions
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("");
  const [subsPage, setSubsPage] = useState(0);
  const subsLimit = 20;

  // Selected subscription for actions
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [upgradePlanSlug, setUpgradePlanSlug] = useState("");
  const [trialExtendDays, setTrialExtendDays] = useState(7);
  const [overrideNotes, setOverrideNotes] = useState("");

  // Coupon creation
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "", name: "", discountType: "percentage" as "percentage" | "fixed_amount" | "trial_extension",
    discountValue: 0, maxRedemptions: "", durationMonths: "", validUntil: "",
  });

  const loadStats = useCallback(async () => {
    if (!token) return;
    try { setStats(await adminGetBillingStats(token)); } catch {}
  }, [token]);

  const loadPlans = useCallback(async () => {
    if (!token) return;
    try { const r = await adminGetPlans(token); setPlans(r.plans); } catch {}
  }, [token]);

  const loadSubscriptions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await adminGetSubscriptions(token, {
        limit: subsLimit, offset: subsPage * subsLimit,
        search: subSearch || undefined, status: subStatusFilter || undefined,
      });
      setSubscriptions(r.subscriptions);
      setSubsTotal(r.total);
    } finally { setLoading(false); }
  }, [token, subsPage, subSearch, subStatusFilter]);

  const loadInvoices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await adminGetInvoices(token, { limit: 50, offset: 0 });
      setInvoices(r.invoices);
      setInvoicesTotal(r.total);
    } finally { setLoading(false); }
  }, [token]);

  const loadCoupons = useCallback(async () => {
    if (!token) return;
    try { const r = await adminGetCoupons(token); setCoupons(r.coupons); } catch {}
  }, [token]);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await adminGetBillingEvents(token, { limit: 100 });
      setEvents(r.events);
      setEventsTotal(r.total);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (activeTab === "stats") loadStats();
    else if (activeTab === "plans") loadPlans();
    else if (activeTab === "subscriptions") loadSubscriptions();
    else if (activeTab === "invoices") loadInvoices();
    else if (activeTab === "coupons") loadCoupons();
    else if (activeTab === "events") loadEvents();
  }, [activeTab, loadStats, loadPlans, loadSubscriptions, loadInvoices, loadCoupons, loadEvents]);

  const doExtendTrial = async (subId: string) => {
    if (!token) return;
    try {
      const r = await adminExtendTrial(token, subId, trialExtendDays);
      setMsg({ type: "ok", text: `Trial extended to ${new Date(r.newTrialEnd).toLocaleDateString()}` });
      void loadSubscriptions();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const doUpgrade = async (subId: string) => {
    if (!token || !upgradePlanSlug) return;
    try {
      await adminUpgradeSubscription(token, subId, upgradePlanSlug);
      setMsg({ type: "ok", text: "Subscription upgraded." });
      setSelectedSub(null);
      void loadSubscriptions();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const doCancel = async (subId: string) => {
    if (!token || !confirm("Immediately cancel this subscription?")) return;
    try {
      await adminCancelSubscription(token, subId, "Admin cancellation");
      setMsg({ type: "ok", text: "Subscription canceled." });
      void loadSubscriptions();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const doVoidInvoice = async (invId: string) => {
    if (!token || !confirm("Void this invoice?")) return;
    try {
      await adminVoidInvoice(token, invId);
      setMsg({ type: "ok", text: "Invoice voided." });
      void loadInvoices();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const doCreateCoupon = async () => {
    if (!token || !newCoupon.code || !newCoupon.name) return;
    try {
      await adminCreateCoupon(token, {
        ...newCoupon,
        discountValue: Number(newCoupon.discountValue),
        maxRedemptions: newCoupon.maxRedemptions ? Number(newCoupon.maxRedemptions) : undefined,
        durationMonths: newCoupon.durationMonths ? Number(newCoupon.durationMonths) : undefined,
        validUntil: newCoupon.validUntil || undefined,
      } as Parameters<typeof adminCreateCoupon>[1]);
      setMsg({ type: "ok", text: `Coupon ${newCoupon.code} created.` });
      setShowCouponForm(false);
      setNewCoupon({ code: "", name: "", discountType: "percentage", discountValue: 0, maxRedemptions: "", durationMonths: "", validUntil: "" });
      void loadCoupons();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const doDeactivateCoupon = async (id: string, code: string) => {
    if (!token || !confirm(`Deactivate coupon ${code}?`)) return;
    try {
      await adminDeactivateCoupon(token, id);
      setMsg({ type: "ok", text: `Coupon ${code} deactivated.` });
      void loadCoupons();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "plans", label: "Plans", icon: Star },
    { id: "subscriptions", label: "Subscriptions", icon: Users },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "coupons", label: "Coupons", icon: Tag },
    { id: "events", label: "Events", icon: Activity },
  ];

  const EVENT_LABELS: Record<string, string> = {
    subscription_created: "Subscription created",
    subscription_upgraded: "Upgraded",
    subscription_downgraded: "Downgraded",
    subscription_canceled: "Canceled",
    subscription_reactivated: "Reactivated",
    trial_started: "Trial started",
    trial_ended: "Trial ended",
    payment_succeeded: "Payment succeeded",
    payment_failed: "Payment failed",
    invoice_created: "Invoice created",
    seat_added: "Seat added",
    seat_removed: "Seat removed",
    feature_override: "Feature override",
    admin_action: "Admin action",
    coupon_applied: "Coupon applied",
  };

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Global message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
                msg.type === "ok" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-destructive/10 text-destructive border-destructive/30"
              }`}>
              {msg.type === "ok" ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {msg.text}
              <button onClick={() => setMsg(null)} className="ml-auto"><X className="h-3 w-3" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── STATS ──────────────────────────────────────────────────── */}
          {activeTab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Revenue & Subscription Overview</h3>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={loadStats}><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button>
              </div>

              {!stats ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  {/* Revenue card */}
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5">
                    <div className="flex items-center gap-3 mb-1">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Revenue</p>
                    </div>
                    <p className="font-display text-3xl font-bold text-foreground">
                      {formatCents(stats.revenue.totalCents)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">From {stats.invoices.paid} paid invoices</p>
                  </div>

                  {/* Subscription stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Total", value: stats.subscriptions.total, color: "text-foreground" },
                      { label: "Active", value: stats.subscriptions.active, color: "text-emerald-500" },
                      { label: "Trialing", value: stats.subscriptions.trialing, color: "text-blue-500" },
                      { label: "Past Due", value: stats.subscriptions.pastDue, color: "text-amber-500" },
                      { label: "Canceled", value: stats.subscriptions.canceled, color: "text-muted-foreground" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                        <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Invoice stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total invoices", value: stats.invoices.total },
                      { label: "Paid", value: stats.invoices.paid },
                      { label: "Open", value: stats.invoices.open },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                        <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Plan breakdown */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-semibold text-foreground">Subscriptions by plan</p>
                    </div>
                    <div className="divide-y divide-border">
                      {stats.planBreakdown.map((pb) => (
                        <div key={pb.planSlug} className="px-4 py-2.5 flex items-center gap-3">
                          <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-foreground flex-1">{pb.planName}</span>
                          <Badge variant="outline" className="text-xs">{pb.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── PLANS ──────────────────────────────────────────────────── */}
          {activeTab === "plans" && (
            <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Billing plans ({plans.length})</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={loadPlans}><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button>
                </div>
              </div>

              {plans.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                            <code className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{plan.slug}</code>
                            <Badge variant="outline" className="text-[10px] capitalize">{TIER_LABELS[plan.tier] ?? plan.tier}</Badge>
                            {!plan.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Monthly: <strong className="text-foreground">{plan.priceMonthly !== null ? formatCents(plan.priceMonthly) : "N/A"}</strong></span>
                            <span>Annual: <strong className="text-foreground">{plan.priceAnnual !== null ? formatCents(plan.priceAnnual) : "N/A"}</strong></span>
                            <span>Seats: <strong className="text-foreground">{plan.seatLimit ?? "∞"}</strong></span>
                            {plan.trialDays > 0 && <span>Trial: <strong className="text-foreground">{plan.trialDays}d</strong></span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {plan.isSsoIncluded && <Badge className="text-[10px] bg-purple-500/10 text-purple-600 border-0">SSO</Badge>}
                          {plan.isWhiteLabelIncluded && <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-0">WL</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Plan creation and editing coming in the next admin update. Use the API directly for now.</p>
            </motion.div>
          )}

          {/* ── SUBSCRIPTIONS ──────────────────────────────────────────── */}
          {activeTab === "subscriptions" && (
            <motion.div key="subscriptions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <Input className="h-8 text-xs max-w-xs" placeholder="Search user/tenant…" value={subSearch}
                  onChange={(e) => { setSubSearch(e.target.value); setSubsPage(0); }} />
                <select className="rounded-md border border-border bg-background px-2 text-xs text-foreground h-8 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={subStatusFilter} onChange={(e) => { setSubStatusFilter(e.target.value); setSubsPage(0); }}>
                  <option value="">All statuses</option>
                  {["active", "trialing", "past_due", "canceled", "unpaid"].map((s) => (
                    <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>
                  ))}
                </select>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={loadSubscriptions}><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button>
              </div>

              <p className="text-xs text-muted-foreground">{subsTotal} total subscriptions</p>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="px-4 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[sub.status]}`}>
                              {STATUS_LABELS[sub.status] ?? sub.status}
                            </Badge>
                            <span className="text-xs font-medium text-foreground">
                              {sub.planName}
                            </span>
                            <code className="text-[10px] font-mono text-muted-foreground">
                              {sub.userId ? `user:${sub.userId.slice(0, 8)}` : `tenant:${sub.tenantId?.slice(0, 8)}`}
                            </code>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                            {sub.currentPeriodEnd && <span>Ends {new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>}
                            {sub.trialEnd && sub.status === "trialing" && (
                              <span className="text-blue-500">Trial until {new Date(sub.trialEnd).toLocaleDateString()}</span>
                            )}
                            {sub.seatLimit && <span>{sub.activeSeatCount}/{sub.seatLimit} seats</span>}
                            {sub.cancelAtPeriodEnd && <span className="text-amber-500">Cancels at period end</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSub(selectedSub === sub.id ? null : sub.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${selectedSub === sub.id ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {selectedSub === sub.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          className="border-t border-border px-4 py-3 bg-secondary/20 space-y-3">
                          <p className="text-xs font-medium text-foreground">Admin actions</p>
                          <div className="flex flex-wrap gap-2">
                            {/* Upgrade */}
                            <div className="flex gap-1.5">
                              <select className="rounded-md border border-border bg-background px-2 text-xs h-7 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                value={upgradePlanSlug} onChange={(e) => setUpgradePlanSlug(e.target.value)}>
                                <option value="">Select plan…</option>
                                {plans.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                              </select>
                              <Button size="sm" className="h-7 text-xs" onClick={() => doUpgrade(sub.id)} disabled={!upgradePlanSlug}>
                                <ArrowUpDown className="h-3 w-3 mr-1" />Force plan
                              </Button>
                            </div>

                            {/* Extend trial */}
                            {(sub.status === "trialing" || sub.trialEnd) && (
                              <div className="flex gap-1.5">
                                <Input type="number" className="h-7 w-16 text-xs" value={trialExtendDays}
                                  onChange={(e) => setTrialExtendDays(parseInt(e.target.value) || 7)} />
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => doExtendTrial(sub.id)}>
                                  <Clock className="h-3 w-3 mr-1" />Extend trial
                                </Button>
                              </div>
                            )}

                            {/* Cancel */}
                            {sub.status !== "canceled" && (
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => doCancel(sub.id)}>
                                <X className="h-3 w-3 mr-1" />Cancel now
                              </Button>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Admin notes</Label>
                            <Input className="h-7 text-xs" placeholder="Internal note…" value={overrideNotes}
                              onChange={(e) => setOverrideNotes(e.target.value)} />
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={async () => {
                              if (!token) return;
                              try {
                                await adminOverrideFeatures(token, sub.id, { adminNotes: overrideNotes });
                                setMsg({ type: "ok", text: "Notes saved." });
                              } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
                            }}>Save notes</Button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={subsPage === 0} onClick={() => setSubsPage((p) => p - 1)} className="h-7 text-xs">Prev</Button>
                <span className="text-xs text-muted-foreground">Page {subsPage + 1} of {Math.ceil(subsTotal / subsLimit)}</span>
                <Button size="sm" variant="outline" disabled={(subsPage + 1) * subsLimit >= subsTotal} onClick={() => setSubsPage((p) => p + 1)} className="h-7 text-xs">Next</Button>
              </div>
            </motion.div>
          )}

          {/* ── INVOICES ───────────────────────────────────────────────── */}
          {activeTab === "invoices" && (
            <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{invoicesTotal} total invoices</p>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={loadInvoices}><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="divide-y divide-border">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(inv.createdAt).toLocaleDateString()}
                            {inv.userId && ` · user:${inv.userId.slice(0, 8)}`}
                            {inv.tenantId && ` · tenant:${inv.tenantId.slice(0, 8)}`}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-foreground">{formatCents(inv.totalCents, inv.currency)}</span>
                        <Badge variant="outline" className={`text-[10px] ${inv.status === "paid" ? "text-emerald-600 border-emerald-500/30" : inv.status === "void" ? "text-muted-foreground" : "text-amber-600 border-amber-500/30"}`}>
                          {inv.status}
                        </Badge>
                        {inv.status !== "void" && inv.status !== "paid" && (
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive hover:text-destructive" onClick={() => doVoidInvoice(inv.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── COUPONS ────────────────────────────────────────────────── */}
          {activeTab === "coupons" && (
            <motion.div key="coupons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Coupons & Promo codes</h3>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowCouponForm(!showCouponForm)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />New coupon
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={loadCoupons}><RefreshCw className="h-3 w-3" /></Button>
                </div>
              </div>

              {/* Create coupon form */}
              <AnimatePresence>
                {showCouponForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 overflow-hidden">
                    <p className="text-xs font-medium text-foreground">Create coupon</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { key: "code", label: "Code *", placeholder: "SAVE20", transform: (v: string) => v.toUpperCase() },
                        { key: "name", label: "Name *", placeholder: "20% off for 3 months" },
                      ].map(({ key, label, placeholder, transform }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input className="h-7 text-xs font-mono" placeholder={placeholder}
                            value={(newCoupon as Record<string, string>)[key]}
                            onChange={(e) => setNewCoupon((d) => ({ ...d, [key]: transform ? transform(e.target.value) : e.target.value }))} />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <Label className="text-xs">Discount type</Label>
                        <select className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          value={newCoupon.discountType} onChange={(e) => setNewCoupon((d) => ({ ...d, discountType: e.target.value as typeof d.discountType }))}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed_amount">Fixed amount (cents)</option>
                          <option value="trial_extension">Trial extension (days)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Value {newCoupon.discountType === "percentage" ? "(0–100%)" : newCoupon.discountType === "fixed_amount" ? "(cents)" : "(days)"}</Label>
                        <Input type="number" className="h-7 text-xs" placeholder="20"
                          value={newCoupon.discountValue}
                          onChange={(e) => setNewCoupon((d) => ({ ...d, discountValue: Number(e.target.value) }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max redemptions (blank = unlimited)</Label>
                        <Input type="number" className="h-7 text-xs" placeholder="100"
                          value={newCoupon.maxRedemptions}
                          onChange={(e) => setNewCoupon((d) => ({ ...d, maxRedemptions: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Duration months (blank = forever)</Label>
                        <Input type="number" className="h-7 text-xs" placeholder="3"
                          value={newCoupon.durationMonths}
                          onChange={(e) => setNewCoupon((d) => ({ ...d, durationMonths: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valid until (blank = no expiry)</Label>
                        <Input type="date" className="h-7 text-xs"
                          value={newCoupon.validUntil}
                          onChange={(e) => setNewCoupon((d) => ({ ...d, validUntil: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={doCreateCoupon} disabled={!newCoupon.code || !newCoupon.name}>Create</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowCouponForm(false)}>Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {coupons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center">
                  <Tag className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No coupons yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {coupons.map((c) => (
                    <div key={c.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono font-semibold text-foreground">{c.code}</code>
                          <span className="text-xs text-muted-foreground">{c.name}</span>
                          {!c.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {c.discountType === "percentage" ? `${c.discountValue}% off` : c.discountType === "fixed_amount" ? `${formatCents(c.discountValue)} off` : `+${c.discountValue} trial days`}
                          {c.durationMonths ? ` · ${c.durationMonths} months` : " · forever"}
                          {c.maxRedemptions ? ` · ${c.redemptionCount}/${c.maxRedemptions} used` : ` · ${c.redemptionCount} used`}
                          {c.validUntil ? ` · expires ${new Date(c.validUntil).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      {c.isActive && (
                        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive hover:text-destructive"
                          onClick={() => doDeactivateCoupon(c.id, c.code)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── EVENTS ─────────────────────────────────────────────────── */}
          {activeTab === "events" && (
            <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{eventsTotal} billing events</p>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={loadEvents}><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center">
                  <Activity className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No billing events yet</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                    {events.map((evt) => (
                      <div key={evt.id} className="px-4 py-2.5 flex items-start gap-2.5">
                        <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${evt.outcome === "success" ? "bg-emerald-500" : evt.outcome === "failure" ? "bg-destructive" : "bg-amber-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-foreground">
                              {EVENT_LABELS[evt.eventType] ?? evt.eventType}
                            </span>
                            <Badge variant="outline" className={`text-[10px] ${evt.actor === "admin" ? "border-amber-500/40 text-amber-600" : ""}`}>
                              {evt.actor}
                            </Badge>
                            {evt.userId && <code className="text-[10px] text-muted-foreground font-mono">user:{evt.userId.slice(0, 8)}</code>}
                            {evt.tenantId && <code className="text-[10px] text-muted-foreground font-mono">tenant:{evt.tenantId.slice(0, 8)}</code>}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(evt.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
