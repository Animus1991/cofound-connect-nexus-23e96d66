import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, ChevronRight, Building2, Users, Zap, Shield,
  BarChart3, Globe, Headphones, Star, ArrowRight, Sparkles,
  HelpCircle, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPublicPlans, formatPlanPrice, type BillingPlan } from "@/lib/billing";
import { useAuth } from "@/contexts/AuthContext";

const FEATURE_ROWS: { key: string; label: string; plans: Record<string, string | boolean | null> }[] = [
  { key: "basicMatching",         label: "Basic matching",               plans: { free: true, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "matchesPerMonth",       label: "Matches / month",             plans: { free: "10", premium: "Unlimited", org_starter: "Unlimited", org_pro: "Unlimited", enterprise: "Unlimited" } },
  { key: "premiumMatchFilters",   label: "Premium match filters",        plans: { free: false, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "mentorDiscovery",       label: "Mentor discovery",             plans: { free: true, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "advancedMentorFilters", label: "Advanced mentor filters",      plans: { free: false, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "communities",           label: "Join communities",             plans: { free: false, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "privateCommunities",    label: "Private communities",          plans: { free: false, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "exportCsv",             label: "CSV export",                   plans: { free: false, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "advancedAnalytics",     label: "Advanced analytics",           plans: { free: false, premium: true, org_starter: true, org_pro: true, enterprise: true } },
  { key: "seats",                 label: "Member seats",                 plans: { free: "1", premium: "1", org_starter: "Up to 10", org_pro: "Up to 50", enterprise: "Unlimited" } },
  { key: "orgDashboard",          label: "Organization dashboard",       plans: { free: false, premium: false, org_starter: true, org_pro: true, enterprise: true } },
  { key: "cohortManagement",      label: "Cohort management",            plans: { free: false, premium: false, org_starter: true, org_pro: true, enterprise: true } },
  { key: "sso",                   label: "SSO (SAML/OIDC)",              plans: { free: false, premium: false, org_starter: false, org_pro: true, enterprise: true } },
  { key: "whiteLabelBranding",    label: "White-label branding",         plans: { free: false, premium: false, org_starter: false, org_pro: true, enterprise: true } },
  { key: "apiAccess",             label: "API access",                   plans: { free: false, premium: false, org_starter: false, org_pro: true, enterprise: true } },
  { key: "prioritySupport",       label: "Priority support",             plans: { free: false, premium: false, org_starter: false, org_pro: true, enterprise: true } },
  { key: "customIntegrations",    label: "Custom integrations",          plans: { free: false, premium: false, org_starter: false, org_pro: false, enterprise: true } },
  { key: "slaSupport",            label: "SLA & dedicated account mgr",  plans: { free: false, premium: false, org_starter: false, org_pro: false, enterprise: true } },
];

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  premium: Star,
  org_starter: Users,
  org_pro: Building2,
  enterprise: Shield,
};

const PLAN_GRADIENTS: Record<string, string> = {
  free: "from-slate-500/20 to-slate-500/5",
  premium: "from-primary/20 to-primary/5",
  org_starter: "from-indigo-500/20 to-indigo-500/5",
  org_pro: "from-purple-500/20 to-purple-500/5",
  enterprise: "from-amber-500/20 to-amber-500/5",
};

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  premium: "bg-primary/10 text-primary",
  org_starter: "bg-indigo-500/10 text-indigo-500",
  org_pro: "bg-purple-500/10 text-purple-500",
  enterprise: "bg-amber-500/10 text-amber-500",
};

function FeatureCell({ value }: { value: string | boolean | null }) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
  if (value === false || value === null) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs font-medium text-foreground">{value}</span>;
}

const PLAN_COLUMNS = ["free", "premium", "org_starter", "org_pro", "enterprise"] as const;

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredPlan, setFeaturedPlan] = useState("org_pro");

  useEffect(() => {
    getPublicPlans()
      .then(({ plans: p }) => setPlans(p))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const getPlan = (slug: string) => plans.find((p) => p.slug === slug);

  const handleChoosePlan = (planSlug: string) => {
    if (planSlug === "enterprise") {
      navigate("/enterprise-contact");
      return;
    }
    if (user) {
      navigate(`/billing?plan=${planSlug}&cycle=${cycle}`);
    } else {
      navigate(`/signup?plan=${planSlug}&cycle=${cycle}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Transparent pricing</Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Build your venture,
              <br />
              <span className="text-primary">not your bill</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more. Every plan includes access to the world's most connected founder network.
            </p>

            {/* Monthly / Annual toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1 shadow-sm">
              <button
                onClick={() => setCycle("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${cycle === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle("annual")}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${cycle === "annual" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Annual
                <Badge className="bg-emerald-500/20 text-emerald-600 border-0 text-[10px] px-1.5">Save 20%</Badge>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Pricing cards ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PLAN_COLUMNS.map((slug, i) => {
            const plan = getPlan(slug);
            const Icon = PLAN_ICONS[slug] ?? Zap;
            const isFeatured = slug === featuredPlan;
            const isEnterprise = slug === "enterprise";
            const price = plan ? formatPlanPrice(plan, cycle) : "—";
            const annualBilling = cycle === "annual" && plan?.priceAnnual && plan.priceAnnual > 0;

            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`relative flex flex-col rounded-2xl border transition-all ${
                  isFeatured
                    ? "border-primary/40 shadow-lg shadow-primary/10 bg-card"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`rounded-t-2xl bg-gradient-to-b ${PLAN_GRADIENTS[slug]} p-5`}>
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${PLAN_BADGE_COLORS[slug]}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                    {plan?.name ?? slug}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    {plan?.description ?? ""}
                  </p>
                </div>

                <div className="px-5 pt-4 pb-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={cycle}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      {isEnterprise ? (
                        <div>
                          <span className="font-display text-2xl font-bold text-foreground">Custom</span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Contact us for pricing</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-end gap-1">
                            <span className="font-display text-2xl font-bold text-foreground">{price}</span>
                            {price !== "Free" && price !== "Contact us" && (
                              <span className="text-xs text-muted-foreground mb-0.5">/mo</span>
                            )}
                          </div>
                          {annualBilling && (
                            <p className="text-[11px] text-muted-foreground">
                              Billed {plan?.priceAnnual ? `${formatPlanPrice(plan, "annual")}/yr` : "annually"}
                            </p>
                          )}
                          {plan?.trialDays ? (
                            <p className="text-[11px] text-primary mt-0.5">{plan.trialDays}-day free trial</p>
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="px-5 pb-3 flex-1">
                  <ul className="space-y-1.5">
                    {(plan?.marketingFeatures ?? []).slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-5 pb-5">
                  <Button
                    className={`w-full text-xs ${isFeatured ? "" : "variant-outline"}`}
                    variant={isFeatured ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChoosePlan(slug)}
                    disabled={loading}
                  >
                    {slug === "free" ? "Start for free" : isEnterprise ? "Contact sales" : slug === "premium" && plan?.trialDays ? `Start ${plan.trialDays}-day trial` : "Get started"}
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Feature comparison table ───────────────────────────────────── */}
        <div className="mt-16">
          <h2 className="text-center font-display text-2xl font-semibold text-foreground mb-2">
            Full feature comparison
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-8">
            See exactly what's included in each plan.
          </p>

          <div className="rounded-2xl border border-border overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-6 bg-secondary/40 border-b border-border">
              <div className="px-4 py-3 text-xs font-medium text-muted-foreground">Feature</div>
              {PLAN_COLUMNS.map((slug) => {
                const plan = getPlan(slug);
                return (
                  <div key={slug} className="px-2 py-3 text-center">
                    <span className="text-xs font-semibold text-foreground">{plan?.name ?? slug}</span>
                  </div>
                );
              })}
            </div>

            {FEATURE_ROWS.map((row, i) => (
              <div
                key={row.key}
                className={`grid grid-cols-6 border-b border-border/60 transition-colors hover:bg-secondary/20 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
              >
                <div className="px-4 py-2.5 text-xs text-muted-foreground flex items-center">
                  {row.label}
                </div>
                {PLAN_COLUMNS.map((slug) => (
                  <div key={slug} className="px-2 py-2.5 text-center flex items-center justify-center">
                    <FeatureCell value={row.plans[slug] ?? false} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Enterprise CTA ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background p-8 text-center"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 mb-4">
            <Building2 className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-foreground">Enterprise &amp; Institutions</h3>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-sm">
            Custom contracts, unlimited seats, dedicated onboarding, SLA guarantees, regional procurement workflows, and white-glove support for universities, incubators, accelerators, and corporate innovation labs.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2" onClick={() => handleChoosePlan("enterprise")}>
              <Sparkles className="h-4 w-4" /> Contact Enterprise Sales
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo">Book a demo <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Typically responds within 4 business hours · Custom MSA available · EU data residency available
          </p>
        </motion.div>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <div className="mt-16">
          <h2 className="text-center font-display text-2xl font-semibold text-foreground mb-8">
            Frequently asked questions
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
            {[
              { q: "Can I switch plans at any time?", a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of your billing cycle." },
              { q: "Is there a free trial?", a: "Premium and Organization Starter include a 14-day free trial. No credit card required to start." },
              { q: "How does seat billing work?", a: "Organization plans are billed per-seat up to your plan's limit. Additional seats can be purchased as an add-on." },
              { q: "Can I get a custom enterprise quote?", a: "Yes. Contact our sales team for volume pricing, custom terms, and procurement support." },
              { q: "Do you support annual billing?", a: "Yes. Annual billing saves approximately 20% compared to monthly for all paid plans." },
              { q: "What payment methods are accepted?", a: "We accept all major credit cards, bank transfers (wire), and SEPA direct debit for European customers. Enterprise invoicing is available." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{faq.q}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust badges ──────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
          {[
            { icon: Shield, text: "SOC 2 Type II (planned)" },
            { icon: Globe, text: "GDPR ready" },
            { icon: BadgeCheck, text: "99.9% uptime SLA (Enterprise)" },
            { icon: Headphones, text: "Dedicated support" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs">
              <Icon className="h-4 w-4" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
