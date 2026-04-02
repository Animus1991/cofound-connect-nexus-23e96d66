import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Globe,
  ExternalLink,
  MapPin,
  Zap,
  Target,
  Briefcase,
  GraduationCap,
  Users,
  Shield,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────
interface Organization {
  id: string;
  name: string;
  slug?: string;
  type: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  city?: string | null;
  plan?: string;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  accelerator: { label: "Accelerator",     icon: Zap,          color: "text-orange-500", bg: "bg-orange-500/10" },
  incubator:   { label: "Incubator",       icon: Target,       color: "text-purple-400", bg: "bg-purple-400/10" },
  vc:          { label: "VC / Investor",   icon: Briefcase,    color: "text-blue-400",   bg: "bg-blue-400/10"   },
  corporate:   { label: "Corporate",       icon: Building2,    color: "text-muted-foreground", bg: "bg-secondary" },
  university:  { label: "University",      icon: GraduationCap,color: "text-accent",     bg: "bg-accent/10"     },
  hub:         { label: "Innovation Hub",  icon: Globe,        color: "text-primary",    bg: "bg-primary/10"    },
  cluster:     { label: "Startup Cluster", icon: Users,        color: "text-primary",    bg: "bg-primary/10"    },
  public_body: { label: "Public Body",     icon: Shield,       color: "text-muted-foreground", bg: "bg-secondary" },
  community:   { label: "Community",       icon: Users,        color: "text-green-400",  bg: "bg-green-400/10"  },
};

// What value props each org type typically offers (scaffold content)
const TYPE_VALUE_PROPS: Record<string, string[]> = {
  accelerator: ["Equity-based funding", "Structured 12-week programs", "Demo Day investor access", "Mentorship network"],
  incubator:   ["Workspace & infrastructure", "Long-term support", "Seed funding access", "Local ecosystem connections"],
  vc:          ["Early-stage investment", "Portfolio network", "Strategic guidance", "Follow-on funding"],
  university:  ["Student founder support", "Research collaboration", "IP licensing", "Academic network"],
  hub:         ["Co-working space", "Community events", "Partner ecosystem", "Corporate collaboration"],
  cluster:     ["Industry verticals", "Networking events", "Collective representation", "Market access"],
  corporate:   ["Corporate venture", "Pilots & POCs", "Distribution channels", "Strategic partnerships"],
  public_body: ["Grants & funding", "Regulatory support", "Public procurement", "Policy access"],
  community:   ["Peer learning", "Open networking", "Resource sharing", "Events & meetups"],
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-5">
      <div className="h-7 w-36 rounded bg-secondary animate-pulse" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-secondary animate-pulse mx-auto" />
          <div className="h-5 w-36 rounded bg-secondary animate-pulse mx-auto" />
          <div className="h-4 w-24 rounded bg-secondary animate-pulse mx-auto" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-full rounded bg-secondary animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-secondary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.admin.getOrganizations().catch(() => ({ organizations: [] }));
      const found = res.organizations.find((o: { id: string }) => o.id === id);
      if (!found) { setNotFound(true); } else { setOrg(found as Organization); }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <AppLayout title="Organization"><Skeleton /></AppLayout>;

  if (notFound || !org) {
    return (
      <AppLayout title="Organization">
        <div className="px-2 py-4">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Organization not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">This organization may not exist or has been removed.</p>
            <Link to="/organizations">
              <Button variant="outline" className="mt-6 gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to organizations
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const meta = TYPE_META[org.type] ?? { label: org.type, icon: Building2, color: "text-muted-foreground", bg: "bg-secondary" };
  const Icon = meta.icon;
  const valueProps = TYPE_VALUE_PROPS[org.type] ?? [];

  return (
    <AppLayout title={org.name}>
      <div className="px-2 py-4">
        <Link
          to="/organizations"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to organizations
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ── Left: Identity card ─────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/60 p-6 text-center"
            >
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold ${meta.bg} ${meta.color}`}>
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  initials(org.name)
                )}
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">{org.name}</h2>
              <div className="mt-2">
                <Badge className={`text-xs border ${meta.bg} ${meta.color} border-transparent`}>
                  <Icon className="h-3 w-3 mr-1.5" />
                  {meta.label}
                </Badge>
              </div>
              {(org.city || org.country) && (
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[org.city, org.country].filter(Boolean).join(", ")}
                </div>
              )}
              {org.plan && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs capitalize">{org.plan} plan</Badge>
                </div>
              )}
              {org.websiteUrl && (
                <a
                  href={org.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" /> Visit website
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              )}
            </motion.div>

            {/* Quick info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card/60 p-4 space-y-3"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Member since
                </span>
                <span className="text-foreground font-medium text-xs">
                  {new Date(org.createdAt).getFullYear()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Type
                </span>
                <span className="text-foreground font-medium text-xs">{meta.label}</span>
              </div>
            </motion.div>
          </div>

          {/* ── Right: Details ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description */}
            {org.description ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <h3 className="mb-3 font-display text-sm font-semibold text-foreground">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{org.description}</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <h3 className="mb-3 font-display text-sm font-semibold text-foreground">About</h3>
                <p className="text-sm text-muted-foreground italic">
                  This organization hasn't added a description yet.
                </p>
              </motion.div>
            )}

            {/* What they offer */}
            {valueProps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <h3 className="mb-4 font-display text-sm font-semibold text-foreground">
                  What {meta.label}s typically offer
                </h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {valueProps.map((prop) => (
                    <div key={prop} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {prop}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-5"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">
                    Interested in {org.name}?
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Connect with founders and professionals from this organization.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {org.websiteUrl && (
                    <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" /> Website
                      </Button>
                    </a>
                  )}
                  <Link to="/discover">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Users className="h-3.5 w-3.5" /> Find members
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
