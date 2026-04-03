import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Users,
  X,
  Loader2,
  Brain,
  RefreshCw,
  Sparkles,
  UserCheck,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileCardSkeleton } from "@/components/SkeletonLoaders";
import MatchCard, { type MatchCardProfile } from "@/components/matching/MatchCard";

const MATCH_TYPES = [
  { id: "co-founder", label: "Co-Founders", icon: UserCheck },
  { id: "mentor",     label: "Mentors",     icon: GraduationCap },
  { id: "advisor",    label: "Advisors",    icon: Briefcase },
] as const;
type MatchTypeId = (typeof MATCH_TYPES)[number]["id"];

const MOCK_FALLBACK: MatchCardProfile[] = [
  {
    id: 1, userId: "mock-1", name: "Alex Chen", role: "Founder",
    headline: "Building AI-powered recruitment tools",
    skills: ["Machine Learning", "Python", "Product Strategy"],
    location: "San Francisco, CA", commitment: "Full-time",
    score: 92, stage: "MVP",
    sharedStrengths: ["Product thinking", "Data-driven approach"],
    complementaryStrengths: ["Tech depth + vision & GTM"],
    mismatchFlags: [],
    explanation: "Strong alignment on AI/ML focus and startup stage.",
  },
  {
    id: 2, userId: "mock-2", name: "Maria Santos", role: "Investor",
    headline: "Angel investor — Early-stage SaaS & fintech",
    skills: ["Due Diligence", "Fintech", "SaaS"],
    location: "London, UK", commitment: "Part-time",
    score: 87, stage: "Seed",
    sharedStrengths: ["SaaS expertise"], complementaryStrengths: ["Investor network"],
    mismatchFlags: ["Part-time availability"],
    explanation: "Maria invests in your sector and stage.",
  },
  {
    id: 3, userId: "mock-3", name: "Dimitris Papadopoulos", role: "Co-Founder",
    headline: "Full-stack engineer — React, Node, PostgreSQL",
    skills: ["React", "TypeScript", "Node.js"],
    location: "Athens, Greece", commitment: "20h/week",
    score: 85, stage: "Any",
    sharedStrengths: ["Technical proficiency"], complementaryStrengths: ["Full-stack capability"],
    mismatchFlags: ["Part-time (20h/week)", "Timezone gap"],
    explanation: "Dimitris's full-stack skills complement your business skills.",
  },
  {
    id: 4, userId: "mock-4", name: "Sarah Kim", role: "Mentor",
    headline: "Ex-Google PM — 15y product & growth experience",
    skills: ["Product Management", "Growth", "Strategy"],
    location: "Remote", commitment: "5h/week",
    score: 79, stage: "Any",
    sharedStrengths: ["Strategic thinking"], complementaryStrengths: ["Big-tech experience"],
    mismatchFlags: ["Limited availability"],
    explanation: "Sarah's product management expertise could accelerate your strategy.",
  },
  {
    id: 5, userId: "mock-5", name: "James Okafor", role: "Founder",
    headline: "Climate-tech startup — Carbon tracking for SMBs",
    skills: ["Sustainability", "Business Dev", "Operations"],
    location: "Lagos, Nigeria", commitment: "Full-time",
    score: 76, stage: "Pre-seed",
    sharedStrengths: ["Entrepreneurial drive"], complementaryStrengths: ["Impact + ops expertise"],
    mismatchFlags: ["Different industry", "Geographic distance"],
    explanation: "James is fully committed — if climate-tech interests you.",
  },
];

const ROLES = ["All Roles", "Founder", "Co-Founder", "Investor", "Mentor", "Designer", "Engineer"];
const STAGES = ["All Stages", "Idea", "Pre-seed", "Seed", "MVP", "Traction", "Growth", "Any"];

export default function DiscoverPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [savedProfiles, setSavedProfiles] = useState<Set<string | number>>(new Set());
  const [introSent, setIntroSent] = useState<Set<string>>(new Set());
  const [introLoading, setIntroLoading] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<MatchCardProfile[]>(MOCK_FALLBACK);
  const [searchResults, setSearchResults] = useState<MatchCardProfile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeMatchType, setActiveMatchType] = useState<MatchTypeId>("co-founder");
  const [modelVersion, setModelVersion] = useState<string | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 350);

  const fetchRecommendations = useCallback(async (matchType: MatchTypeId) => {
    setIsLoading(true);
    try {
      const ai = await api.matching.getRecommendations({ limit: 24, matchType });
      setModelVersion(ai.model?.version ?? null);
      if (ai.recommendations.length > 0) {
        const mapped: MatchCardProfile[] = ai.recommendations.map((r, i) => ({
          id: i + 100,
          userId: r.userId,
          name: r.name,
          headline: r.headline,
          location: r.location,
          stage: r.stage,
          commitment: r.commitment,
          skills: r.skills,
          score: r.score,
          breakdown: {
            ...r.breakdown,
            matchType,
            modelVersion: ai.model?.version ?? "v1-hybrid",
          },
          sharedStrengths: r.breakdown.sharedDimensions,
          complementaryStrengths: r.breakdown.complementaryDimensions,
          mismatchFlags: r.breakdown.frictionDimensions,
          explanation: r.breakdown.recommendationReason,
        }));
        setProfiles(mapped);
        for (const r of ai.recommendations.slice(0, 12)) {
          api.matching.markShown({ targetUserId: r.userId, modelVersion: ai.model?.version }).catch(() => {});
        }
        return;
      }
      const { suggested } = await api.connections.getSuggested().catch(() => ({ suggested: [] }));
      if (suggested.length > 0) {
        const mapped: MatchCardProfile[] = suggested.map((u, i) => ({
          id: i + 100,
          userId: u.id,
          name: u.name,
          headline: u.headline ?? null,
          location: null,
          stage: null,
          commitment: null,
          skills: u.skills ?? [],
          score: u.matchScore ?? 50,
          explanation: u.reason ?? "Potential fit worth exploring.",
          sharedStrengths: [],
          complementaryStrengths: [],
          mismatchFlags: [],
        }));
        setProfiles(mapped.length > 0 ? mapped : MOCK_FALLBACK);
        return;
      }
      setProfiles(MOCK_FALLBACK);
    } catch {
      setProfiles(MOCK_FALLBACK);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations(activeMatchType);
  }, [activeMatchType, fetchRecommendations]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) { setSearchResults(null); return; }
    let cancelled = false;
    setIsSearching(true);
    api.search.query(debouncedQuery.trim(), "users", 30)
      .then(({ users: hits }) => {
        if (cancelled) return;
        const results: MatchCardProfile[] = hits.map((h, i) => ({
          id: i + 1000, userId: h.id, name: h.name || "Unknown",
          headline: h.headline || null, location: h.location || null,
          stage: null, commitment: null,
          skills: h.skills ? h.skills.split(" ").filter(Boolean) : [],
          score: Math.round((h.score ?? 0.5) * 100),
          explanation: "Matched by full-text search.",
          sharedStrengths: [], complementaryStrengths: [], mismatchFlags: [],
        }));
        setSearchResults(results);
      })
      .catch(() => setSearchResults(null))
      .finally(() => { if (!cancelled) setIsSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const sourceList = searchResults !== null ? searchResults : profiles;
  const filtered = sourceList.filter((p) => {
    if (searchResults !== null) return true;
    const q = searchQuery.toLowerCase();
    const matchesQ = !q || p.name.toLowerCase().includes(q) ||
      (p.headline ?? "").toLowerCase().includes(q) ||
      p.skills.some((s) => s.toLowerCase().includes(q));
    const matchesRole = roleFilter === "All Roles" || (p.role ?? "").includes(roleFilter);
    const matchesStage = stageFilter === "All Stages" || p.stage === stageFilter;
    return matchesQ && matchesRole && matchesStage;
  });

  const sendIntro = useCallback(async (profile: MatchCardProfile) => {
    const uid = profile.userId ?? String(profile.id);
    if (introSent.has(uid) || introLoading.has(uid)) return;
    setIntroLoading((prev) => new Set(prev).add(uid));
    if (profile.userId && !profile.userId.startsWith("mock-")) {
      try { await api.connections.requestConnection(profile.userId, `Hi ${profile.name}, I'd love to connect!`); } catch { }
      api.matching.recordOutcome({ targetUserId: profile.userId, outcomeType: "requested", modelVersion: modelVersion ?? undefined }).catch(() => {});
    }
    setIntroSent((prev) => new Set(prev).add(uid));
    setIntroLoading((prev) => { const s = new Set(prev); s.delete(uid); return s; });
  }, [introSent, introLoading, modelVersion]);

  const handleFeedback = useCallback((profile: MatchCardProfile, type: string) => {
    const uid = profile.userId ?? String(profile.id);
    if (type === "hidden" || type === "not_relevant") {
      setProfiles((prev) => prev.filter((p) => (p.userId ?? String(p.id)) !== uid));
      setSearchResults((prev) => prev ? prev.filter((p) => (p.userId ?? String(p.id)) !== uid) : prev);
    }
  }, []);

  const toggleSave = useCallback((id: string | number) => {
    setSavedProfiles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const hasFilters = roleFilter !== "All Roles" || stageFilter !== "All Stages";

  return (
    <AppLayout title="Discover">
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        {/* ── Filter sidebar ── */}
        <div className="hidden lg:flex flex-col w-[200px] shrink-0 border-r border-border/50 bg-background overflow-y-auto">
          <div className="p-4 space-y-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</p>
            {hasFilters && (
              <button className="text-xs text-primary hover:underline" onClick={() => { setRoleFilter("All Roles"); setStageFilter("All Stages"); }}>
                Clear filters
              </button>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Stage</label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">View</label>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`flex-1 flex items-center justify-center py-1.5 text-xs ${viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}>
                  <Grid3X3 className="h-3.5 w-3.5 mr-1" /> Grid
                </button>
                <button onClick={() => setViewMode("list")} className={`flex-1 flex items-center justify-center py-1.5 text-xs ${viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}>
                  <List className="h-3.5 w-3.5 mr-1" /> List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-3 space-y-3">

            {/* AI header + matchType tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI Matching</span>
                  {modelVersion && <span className="text-[9px] text-primary/60 font-mono">{modelVersion}</span>}
                </div>
                <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
                  {MATCH_TYPES.map((mt) => {
                    const Icon = mt.icon;
                    return (
                      <button
                        key={mt.id}
                        onClick={() => setActiveMatchType(mt.id)}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${activeMatchType === mt.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Icon className="h-3 w-3" />
                        {mt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => fetchRecommendations(activeMatchType)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={`Search ${MATCH_TYPES.find((m) => m.id === activeMatchType)?.label.toLowerCase() ?? "matches"}...`} className="pl-10 pr-9 h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />}
              </div>
              <div className="flex lg:hidden gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[100px] h-9 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{isLoading ? "Loading…" : `${filtered.length} ${activeMatchType} match${filtered.length !== 1 ? "es" : ""}${searchResults !== null ? " (search)" : " ranked by AI"}`}</span>
            </div>

            {/* Cards grid */}
            {isLoading ? (
              <div className={viewMode === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
                {Array.from({ length: 6 }).map((_, i) => <ProfileCardSkeleton key={i} />)}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <p className="text-base font-medium text-foreground">No matches found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try changing the match type or adjusting filters</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearchQuery(""); setRoleFilter("All Roles"); setStageFilter("All Stages"); }}>
                      Clear Filters
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key={activeMatchType + viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={viewMode === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
                    {filtered.map((profile) => (
                      <MatchCard
                        key={profile.userId ?? profile.id}
                        profile={profile}
                        onSendIntro={sendIntro}
                        onFeedback={handleFeedback}
                        onSave={toggleSave}
                        introSent={introSent.has(profile.userId ?? String(profile.id))}
                        introLoading={introLoading.has(profile.userId ?? String(profile.id))}
                        saved={savedProfiles.has(profile.id)}
                        modelVersion={modelVersion ?? undefined}
                        viewMode={viewMode}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

