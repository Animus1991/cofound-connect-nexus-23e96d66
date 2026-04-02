import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Globe,
  ExternalLink,
  ChevronRight,
  Users,
  Target,
  Zap,
  GraduationCap,
  Briefcase,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────
interface Organization {
  id: string;
  name: string;
  type: string;
  status?: string;
  country?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  createdAt: string;
}

// ── Helpers ─────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  accelerator:  { label: "Accelerator",    icon: Zap,          color: "text-orange-500", bg: "bg-orange-500/10" },
  incubator:    { label: "Incubator",      icon: Target,       color: "text-purple-400", bg: "bg-purple-400/10" },
  vc:           { label: "VC",             icon: Briefcase,    color: "text-blue-400",   bg: "bg-blue-400/10"   },
  corporate:    { label: "Corporate",      icon: Building2,    color: "text-muted-foreground", bg: "bg-secondary" },
  university:   { label: "University",     icon: GraduationCap,color: "text-accent",     bg: "bg-accent/10"     },
  hub:          { label: "Innovation Hub", icon: Globe,        color: "text-primary",    bg: "bg-primary/10"    },
  cluster:      { label: "Cluster",        icon: Users,        color: "text-primary",    bg: "bg-primary/10"    },
  public_body:  { label: "Public Body",    icon: Shield,       color: "text-muted-foreground", bg: "bg-secondary" },
  community:    { label: "Community",      icon: Users,        color: "text-green-400",  bg: "bg-green-400/10"  },
};

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "accelerator", label: "Accelerators" },
  { value: "incubator", label: "Incubators" },
  { value: "vc", label: "VCs" },
  { value: "university", label: "Universities" },
  { value: "hub", label: "Innovation Hubs" },
  { value: "corporate", label: "Corporates" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Skeleton ─────────────────────────────────────────────────
function OrgCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 rounded bg-secondary animate-pulse" />
          <div className="h-3 w-20 rounded bg-secondary animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-secondary animate-pulse" />
      <div className="h-3 w-5/6 rounded bg-secondary animate-pulse" />
    </div>
  );
}

// ── Org Card ─────────────────────────────────────────────────
function OrgCard({ org }: { org: Organization }) {
  const meta = TYPE_META[org.type] ?? { label: org.type, icon: Building2, color: "text-muted-foreground", bg: "bg-secondary" };
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-border bg-card/60 p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-[0_2px_12px_hsl(var(--primary)/0.06)]"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${meta.bg} ${meta.color}`}>
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            initials(org.name)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {org.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge className={`text-[10px] border px-1.5 py-0 h-4 ${meta.bg} ${meta.color} border-transparent`}>
              <Icon className="h-2.5 w-2.5 mr-1" />
              {meta.label}
            </Badge>
            {org.country && (
              <span className="text-[11px] text-muted-foreground">{org.country}</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary/60 transition-colors mt-1" />
      </div>

      {org.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {org.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {org.websiteUrl ? (
          <a
            href={org.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Globe className="h-3 w-3" /> Website <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : (
          <span />
        )}
        <Link
          to={`/organizations/${org.id}`}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          View details →
        </Link>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function OrganizationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getOrganizations().catch(() => ({ organizations: [] }));
      setOrganizations(res.organizations as Organization[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);

  const filtered = organizations.filter((o) => {
    const matchesSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      o.country?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || o.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: organizations.length,
    accelerators: organizations.filter((o) => o.type === "accelerator").length,
    incubators: organizations.filter((o) => o.type === "incubator").length,
    vcs: organizations.filter((o) => o.type === "vc").length,
  };

  return (
    <AppLayout title="Organizations">
      <div className="px-2 py-4">

        {/* Hero / stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Organizations", value: loading ? "—" : stats.total, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
            { label: "Accelerators", value: loading ? "—" : stats.accelerators, icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Incubators", value: loading ? "—" : stats.incubators, icon: Target, color: "text-purple-400", bg: "bg-purple-400/10" },
            { label: "VCs", value: loading ? "—" : stats.vcs, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-400/10" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card/60 p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search organizations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                  typeFilter === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} organization${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <OrgCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-display text-base font-semibold text-foreground">
              {search || typeFilter !== "all" ? "No results found" : "No organizations yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || typeFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Organizations will appear here as they join the platform."}
            </p>
            {(search || typeFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { setSearch(""); setTypeFilter("all"); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
