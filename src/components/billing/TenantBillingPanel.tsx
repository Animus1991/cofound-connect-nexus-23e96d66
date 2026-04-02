/**
 * TenantBillingPanel — Full B2B billing management UI for tenant admins.
 * Embedded in the tenant admin section.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Receipt, CreditCard, Building2, Star, ShieldCheck,
  Check, X, Plus, Trash2, Loader2, AlertTriangle, RefreshCw,
  Clock, ChevronRight, ArrowUpRight, Info, UserPlus, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTenantSubscription, getTenantInvoices, getTenantSeats, getTenantCustomer,
  getPublicPlans, subscribeTenant, cancelTenantSubscription, reactivateUserSubscription,
  allocateSeat, revokeSeat, saveTenantCustomer, requestTenantUpgrade, requestAdditionalSeats,
  formatCents, formatPlanPrice, STATUS_LABELS, STATUS_COLORS,
  type Subscription, type Invoice, type SeatAllocation, type TenantBillingAccount, type BillingPlan, type FeatureAccess,
} from "@/lib/billing";

type Tab = "overview" | "plans" | "seats" | "invoices" | "contact";

interface TenantBillingPanelProps {
  tenantId: string;
  tenantName?: string;
}

export default function TenantBillingPanel({ tenantId, tenantName }: TenantBillingPanelProps) {
  const { user } = useAuth();
  const token = user?.token ?? null;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [access, setAccess] = useState<FeatureAccess | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [seats, setSeats] = useState<SeatAllocation[]>([]);
  const [seatLimit, setSeatLimit] = useState<number | null>(null);
  const [customer, setCustomer] = useState<TenantBillingAccount | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Plan selection
  const [selectedPlanSlug, setSelectedPlanSlug] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [seatLimitInput, setSeatLimitInput] = useState("");

  // Seat allocation
  const [newSeatEmail, setNewSeatEmail] = useState("");
  const [newSeatRole, setNewSeatRole] = useState("member");
  const [addingSeats, setAddingSeats] = useState(false);
  const [requestSeatCount, setRequestSeatCount] = useState(5);

  // Billing contact
  const [contactDraft, setContactDraft] = useState<Partial<TenantBillingAccount>>({});
  const [savingContact, setSavingContact] = useState(false);

  // Upgrade request
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [sendingUpgrade, setSendingUpgrade] = useState(false);

  const reload = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    try {
      const [subRes, invRes, seatsRes, custRes, plansRes] = await Promise.all([
        getTenantSubscription(token, tenantId),
        getTenantInvoices(token, tenantId),
        getTenantSeats(token, tenantId),
        getTenantCustomer(token, tenantId),
        getPublicPlans(),
      ]);
      setSubscription(subRes.subscription);
      setAccess(subRes.access);
      setInvoices(invRes.invoices);
      setSeats(seatsRes.seats);
      setSeatLimit(seatsRes.seatLimit);
      setCustomer(custRes.customer);
      setContactDraft(custRes.customer ?? {});
      setPlans(plansRes.plans.filter((p) => p.tier !== "individual_free" && p.tier !== "individual_premium"));
    } finally { setLoading(false); }
  }, [token, tenantId]);

  useEffect(() => { void reload(); }, [reload]);

  const doSubscribe = async () => {
    if (!token || !selectedPlanSlug) return;
    setActionLoading(true);
    setMsg(null);
    try {
      await subscribeTenant(token, tenantId, {
        planSlug: selectedPlanSlug,
        billingCycle,
        seatLimit: seatLimitInput ? parseInt(seatLimitInput) : undefined,
      });
      setMsg({ type: "ok", text: "Subscription updated!" });
      await reload();
      setActiveTab("overview");
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setActionLoading(false); }
  };

  const doCancel = async () => {
    if (!token || !confirm("Cancel tenant subscription at period end?")) return;
    setActionLoading(true);
    try {
      await cancelTenantSubscription(token, tenantId, { reason: "Admin requested cancellation" });
      setMsg({ type: "ok", text: "Subscription will cancel at period end." });
      await reload();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setActionLoading(false); }
  };

  const doAllocateSeat = async () => {
    if (!token || !newSeatEmail) return;
    setAddingSeats(true);
    try {
      await allocateSeat(token, tenantId, { inviteEmail: newSeatEmail, role: newSeatRole });
      setNewSeatEmail("");
      setMsg({ type: "ok", text: `Seat allocated to ${newSeatEmail}` });
      await reload();
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setAddingSeats(false); }
  };

  const doRevokeSeat = async (seatId: string) => {
    if (!token || !confirm("Revoke this seat?")) return;
    await revokeSeat(token, tenantId, seatId);
    await reload();
  };

  const doSaveContact = async () => {
    if (!token) return;
    setSavingContact(true);
    try {
      const res = await saveTenantCustomer(token, tenantId, contactDraft);
      setCustomer(res.customer);
      setMsg({ type: "ok", text: "Billing contact saved." });
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setSavingContact(false); }
  };

  const doRequestUpgrade = async () => {
    if (!token) return;
    setSendingUpgrade(true);
    try {
      const r = await requestTenantUpgrade(token, tenantId, { message: upgradeMessage });
      setMsg({ type: "ok", text: r.message });
      setUpgradeMessage("");
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setSendingUpgrade(false); }
  };

  const doRequestSeats = async () => {
    if (!token) return;
    try {
      const r = await requestAdditionalSeats(token, tenantId, requestSeatCount);
      setMsg({ type: "ok", text: r.message });
    } catch (e) { setMsg({ type: "err", text: (e as Error).message }); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Zap },
    { id: "plans", label: "Plans", icon: Star },
    { id: "seats", label: "Seats", icon: Users },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "contact", label: "Billing Info", icon: Building2 },
  ];

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

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Plan summary */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/8 to-primary/3 px-4 py-4 border-b border-border">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          {tenantName ?? "Organization"} · Current Plan
                        </p>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-foreground">{access?.planName ?? "Free"}</h3>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[access?.status ?? "active"]}`}>
                            {STATUS_LABELS[access?.status ?? "active"]}
                          </Badge>
                          {access?.isTrialing && access.trialEnd && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              Trial ends {new Date(access.trialEnd).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        {subscription && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {subscription.billingCycle === "custom" ? "Custom billing" : `Billed ${subscription.billingCycle}`}
                            {subscription.renewalDate && !subscription.cancelAtPeriodEnd && (
                              <> · Renews {new Date(subscription.renewalDate).toLocaleDateString()}</>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setActiveTab("plans")}>
                          <ChevronRight className="h-3.5 w-3.5 mr-1" />
                          {subscription ? "Change plan" : "Subscribe"}
                        </Button>
                        {subscription && !subscription.cancelAtPeriodEnd && subscription.planSlug !== "free" && (
                          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={doCancel} disabled={actionLoading}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {subscription?.cancelAtPeriodEnd && (
                    <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Cancels {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "at period end"}
                    </div>
                  )}

                  {/* Seat usage */}
                  <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Active seats", value: `${seats.filter(s => s.status === "active").length}${seatLimit !== null ? ` / ${seatLimit}` : ""}` },
                      { label: "SSO", value: access?.flags.sso ? "Included" : "Not included" },
                      { label: "White-label", value: access?.flags.whiteLabelBranding ? "Included" : "Not included" },
                      { label: "Analytics", value: access?.flags.advancedAnalytics ? "Advanced" : "Basic" },
                    ].map((s) => (
                      <div key={s.label} className="text-center rounded-lg bg-secondary/30 p-2">
                        <p className="text-sm font-semibold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature access */}
                {access && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <p className="text-xs font-medium text-foreground">Included features</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { flag: "premiumMatchFilters", label: "Premium filters" },
                        { flag: "communities", label: "Communities" },
                        { flag: "cohortManagement", label: "Cohort mgmt" },
                        { flag: "sso", label: "Enterprise SSO" },
                        { flag: "whiteLabelBranding", label: "White-label" },
                        { flag: "apiAccess", label: "API access" },
                        { flag: "prioritySupport", label: "Priority support" },
                        { flag: "advancedAnalytics", label: "Advanced analytics" },
                        { flag: "exportCsv", label: "CSV export" },
                      ].map(({ flag, label }) => {
                        const has = access.flags[flag as keyof typeof access.flags];
                        return (
                          <div key={flag} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] border ${has ? "bg-emerald-500/5 text-foreground border-emerald-500/20" : "bg-secondary/20 text-muted-foreground border-border"}`}>
                            {has ? <Check className="h-3 w-3 text-emerald-500 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Enterprise upgrade CTA */}
                {access && access.tier !== "enterprise" && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Need more?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Request an enterprise upgrade for unlimited seats, custom SLA, and dedicated support.
                        </p>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <Input
                            className="h-7 text-xs max-w-xs"
                            placeholder="Tell us about your needs (optional)"
                            value={upgradeMessage}
                            onChange={(e) => setUpgradeMessage(e.target.value)}
                          />
                          <Button size="sm" variant="outline" onClick={doRequestUpgrade} disabled={sendingUpgrade} className="h-7 text-xs">
                            {sendingUpgrade ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Request upgrade
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PLANS ───────────────────────────────────────────────────── */}
            {activeTab === "plans" && (
              <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Organization plans</h3>
                  <div className="inline-flex items-center gap-0.5 rounded-full border border-border p-0.5">
                    {(["monthly", "annual"] as const).map((c) => (
                      <button key={c} onClick={() => setBillingCycle(c)}
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${billingCycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                        {c}{c === "annual" && " -20%"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => {
                    const isCurrent = subscription?.planSlug === plan.slug;
                    const isSelected = selectedPlanSlug === plan.slug;
                    const price = formatPlanPrice(plan, billingCycle);

                    return (
                      <button key={plan.id} onClick={() => setSelectedPlanSlug(plan.slug)}
                        className={`text-left rounded-xl border p-4 transition-all ${
                          isSelected ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                            : isCurrent ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-border bg-card hover:border-primary/30"
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                          {isCurrent && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0">Current</Badge>}
                          {isSelected && !isCurrent && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1">
                          {price}{price !== "Free" && price !== "Contact us" ? <span className="text-xs font-normal text-muted-foreground">/mo</span> : null}
                        </p>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          {plan.seatLimit ? `Up to ${plan.seatLimit} seats` : "Unlimited seats"}
                        </p>
                        <ul className="space-y-1">
                          {plan.marketingFeatures.slice(0, 3).map((f) => (
                            <li key={f} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Seat limit override (optional)</Label>
                  <Input className="h-8 text-xs max-w-xs" type="number" placeholder="10" value={seatLimitInput} onChange={(e) => setSeatLimitInput(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">Leave blank to use plan default</p>
                </div>

                <Button onClick={doSubscribe} disabled={!selectedPlanSlug || actionLoading} className="gap-2">
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {subscription ? "Update subscription" : "Subscribe"}
                </Button>
              </motion.div>
            )}

            {/* ── SEATS ───────────────────────────────────────────────────── */}
            {activeTab === "seats" && (
              <motion.div key="seats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Seat management</h3>
                    <p className="text-xs text-muted-foreground">
                      {seats.filter(s => s.status === "active").length} active
                      {seatLimit !== null ? ` / ${seatLimit} total seats` : " seats (unlimited)"}
                    </p>
                  </div>
                  {seatLimit !== null && seats.filter(s => s.status === "active").length >= seatLimit && (
                    <div className="flex items-center gap-2">
                      <Input type="number" className="h-7 w-20 text-xs" value={requestSeatCount}
                        onChange={(e) => setRequestSeatCount(parseInt(e.target.value) || 5)} />
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={doRequestSeats}>
                        <Plus className="h-3 w-3 mr-1" /> Request seats
                      </Button>
                    </div>
                  )}
                </div>

                {/* Add seat form */}
                {(seatLimit === null || seats.filter(s => s.status === "active").length < (seatLimit ?? Infinity)) && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <p className="text-xs font-medium text-foreground">Add member</p>
                    <div className="flex gap-2 flex-wrap">
                      <Input className="h-8 text-xs flex-1 min-w-[200px]" type="email" placeholder="member@org.com"
                        value={newSeatEmail} onChange={(e) => setNewSeatEmail(e.target.value)} />
                      <select className="rounded-md border border-border bg-background px-2 text-xs text-foreground h-8 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={newSeatRole} onChange={(e) => setNewSeatRole(e.target.value)}>
                        {["founder", "investor", "mentor", "member", "admin"].map((r) => (
                          <option key={r} value={r} className="capitalize">{r}</option>
                        ))}
                      </select>
                      <Button size="sm" onClick={doAllocateSeat} disabled={addingSeats || !newSeatEmail}>
                        {addingSeats ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* Seat list */}
                {seats.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-8 text-center">
                    <Users className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No seats allocated yet</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="divide-y divide-border">
                      {seats.map((seat) => (
                        <div key={seat.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-medium text-primary">
                              {seat.inviteEmail?.[0]?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {seat.userId ?? seat.inviteEmail ?? "Unknown"}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">{seat.role} · {seat.status}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${seat.status === "active" ? "text-emerald-600 border-emerald-500/30" : seat.status === "pending" ? "text-amber-600 border-amber-500/30" : "text-muted-foreground"}`}>
                            {seat.status}
                          </Badge>
                          {seat.status !== "revoked" && (
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-destructive hover:text-destructive"
                              onClick={() => doRevokeSeat(seat.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground">
                    Pending seats have been invited but haven't accepted yet. Revoked seats free up a seat slot.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── INVOICES ────────────────────────────────────────────────── */}
            {activeTab === "invoices" && (
              <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {invoices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-10 text-center">
                    <Receipt className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No invoices yet</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="divide-y divide-border">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                          <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs font-semibold text-foreground">{formatCents(inv.totalCents, inv.currency)}</span>
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

            {/* ── BILLING CONTACT ──────────────────────────────────────────── */}
            {activeTab === "contact" && (
              <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Organization billing information</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Appears on invoices sent to your organization.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "billingContactName", label: "Billing contact name", placeholder: "Finance Dept / Jane Smith" },
                    { key: "billingContactEmail", label: "Billing email", placeholder: "billing@org.com" },
                    { key: "billingContactPhone", label: "Phone", placeholder: "+30 210 0000000" },
                    { key: "legalEntityName", label: "Legal entity name", placeholder: "Acme Corporation Ltd." },
                    { key: "billingAddressLine1", label: "Address", placeholder: "123 Main Street" },
                    { key: "billingCity", label: "City", placeholder: "Athens" },
                    { key: "billingState", label: "State / Region", placeholder: "Attica" },
                    { key: "billingPostalCode", label: "Postal code", placeholder: "10552" },
                    { key: "billingCountry", label: "Country (ISO)", placeholder: "GR" },
                    { key: "vatNumber", label: "VAT number", placeholder: "EL123456789" },
                    { key: "taxId", label: "Tax ID", placeholder: "123456789" },
                    { key: "purchaseOrderNumber", label: "PO number", placeholder: "PO-2025-001" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input className="h-7 text-xs" placeholder={placeholder}
                        value={(contactDraft as Record<string, string>)[key] ?? ""}
                        onChange={(e) => setContactDraft((d) => ({ ...d, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={doSaveContact} disabled={savingContact} className="gap-2">
                  {savingContact ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save billing info
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        )}

        <div className="mt-4 flex">
          <Button size="sm" variant="ghost" className="text-muted-foreground text-xs" onClick={() => reload()}>
            <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
