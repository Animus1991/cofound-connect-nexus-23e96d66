import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Filter,
  Grid3X3,
  List,
  Bookmark,
  MessageSquare,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Target,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileCardSkeleton } from "@/components/SkeletonLoaders";

interface CompatibilityDimension {
  label: string;
  score: number;
  weight: number;
}

interface MatchProfile {
  id: number;
  name: string;
  role: string;
  headline: string;
  skills: string[];
  location: string;
  availability: string;
  matchScore: number;
  stage: string;
  lookingFor: string;
  compatibility: CompatibilityDimension[];
  sharedStrengths: string[];
  complementaryStrengths: string[];
  mismatchFlags: string[];
  explanation: string;
}

const mockProfiles: MatchProfile[] = [
  {
    id: 1, name: "Alex Chen", role: "Founder",
    headline: "Building AI-powered recruitment tools",
    skills: ["Machine Learning", "Python", "Product Strategy"],
    location: "San Francisco, CA", availability: "Full-time",
    matchScore: 92, stage: "MVP", lookingFor: "Technical Co-founder",
    compatibility: [
      { label: "Skills", score: 95, weight: 25 },
      { label: "Role Fit", score: 90, weight: 20 },
      { label: "Stage", score: 88, weight: 15 },
      { label: "Industry", score: 94, weight: 15 },
      { label: "Commitment", score: 92, weight: 10 },
      { label: "Values", score: 90, weight: 10 },
      { label: "Location", score: 85, weight: 5 },
    ],
    sharedStrengths: ["Product thinking", "Data-driven approach"],
    complementaryStrengths: ["You bring tech depth; they bring vision & GTM"],
    mismatchFlags: [],
    explanation: "Strong alignment on AI/ML focus and startup stage. Alex needs technical depth — your skills are a great complement.",
  },
  {
    id: 2, name: "Maria Santos", role: "Investor",
    headline: "Angel investor — Early-stage SaaS & fintech",
    skills: ["Due Diligence", "Fintech", "SaaS"],
    location: "London, UK", availability: "Part-time",
    matchScore: 87, stage: "Seed", lookingFor: "Deal flow",
    compatibility: [
      { label: "Skills", score: 80, weight: 25 },
      { label: "Role Fit", score: 92, weight: 20 },
      { label: "Stage", score: 90, weight: 15 },
      { label: "Industry", score: 88, weight: 15 },
      { label: "Commitment", score: 82, weight: 10 },
      { label: "Values", score: 86, weight: 10 },
      { label: "Location", score: 78, weight: 5 },
    ],
    sharedStrengths: ["SaaS expertise", "Growth mindset"],
    complementaryStrengths: ["Investor network + capital access"],
    mismatchFlags: ["Part-time availability may limit involvement"],
    explanation: "Maria invests in your sector and stage. She can provide funding connections and strategic advice for your SaaS venture.",
  },
  {
    id: 3, name: "Dimitris Papadopoulos", role: "Co-Founder",
    headline: "Full-stack engineer — React, Node, PostgreSQL",
    skills: ["React", "TypeScript", "Node.js"],
    location: "Athens, Greece", availability: "20h/week",
    matchScore: 85, stage: "Any", lookingFor: "Equity-based role",
    compatibility: [
      { label: "Skills", score: 92, weight: 25 },
      { label: "Role Fit", score: 88, weight: 20 },
      { label: "Stage", score: 80, weight: 15 },
      { label: "Industry", score: 82, weight: 15 },
      { label: "Commitment", score: 75, weight: 10 },
      { label: "Values", score: 88, weight: 10 },
      { label: "Location", score: 70, weight: 5 },
    ],
    sharedStrengths: ["Technical proficiency", "Startup experience"],
    complementaryStrengths: ["Full-stack capability fills your engineering gap"],
    mismatchFlags: ["Part-time commitment (20h/week)", "Timezone difference"],
    explanation: "Dimitris's full-stack skills complement your business skills. Watch out for part-time commitment alignment.",
  },
  {
    id: 4, name: "Sarah Kim", role: "Mentor",
    headline: "Ex-Google PM — 15y product & growth experience",
    skills: ["Product Management", "Growth", "Strategy"],
    location: "Remote", availability: "5h/week",
    matchScore: 79, stage: "Any", lookingFor: "Mentoring sessions",
    compatibility: [
      { label: "Skills", score: 85, weight: 25 },
      { label: "Role Fit", score: 82, weight: 20 },
      { label: "Stage", score: 75, weight: 15 },
      { label: "Industry", score: 78, weight: 15 },
      { label: "Commitment", score: 70, weight: 10 },
      { label: "Values", score: 80, weight: 10 },
      { label: "Location", score: 90, weight: 5 },
    ],
    sharedStrengths: ["Strategic thinking"],
    complementaryStrengths: ["Big-tech product experience + growth frameworks"],
    mismatchFlags: ["Limited availability (5h/week)"],
    explanation: "Sarah's product management expertise from Google could accelerate your product strategy and growth execution.",
  },
  {
    id: 5, name: "James Okafor", role: "Founder",
    headline: "Climate-tech startup — Carbon tracking for SMBs",
    skills: ["Sustainability", "Business Dev", "Operations"],
    location: "Lagos, Nigeria", availability: "Full-time",
    matchScore: 76, stage: "Pre-seed", lookingFor: "CTO Co-founder",
    compatibility: [
      { label: "Skills", score: 70, weight: 25 },
      { label: "Role Fit", score: 85, weight: 20 },
      { label: "Stage", score: 72, weight: 15 },
      { label: "Industry", score: 65, weight: 15 },
      { label: "Commitment", score: 90, weight: 10 },
      { label: "Values", score: 82, weight: 10 },
      { label: "Location", score: 60, weight: 5 },
    ],
    sharedStrengths: ["Entrepreneurial drive", "Full-time commitment"],
    complementaryStrengths: ["Impact focus + operational expertise"],
    mismatchFlags: ["Different industry focus", "Geographic distance"],
    explanation: "James is fully committed and looking for a CTO. If climate-tech interests you, this could be a strong partnership despite the distance.",
  },
  {
    id: 6, name: "Lena Müller", role: "Co-Founder",
    headline: "Brand designer — Helping startups stand out",
    skills: ["Brand Design", "UI/UX", "Figma"],
    location: "Berlin, Germany", availability: "Freelance",
    matchScore: 73, stage: "Any", lookingFor: "Startup projects",
    compatibility: [
      { label: "Skills", score: 78, weight: 25 },
      { label: "Role Fit", score: 72, weight: 20 },
      { label: "Stage", score: 70, weight: 15 },
      { label: "Industry", score: 68, weight: 15 },
      { label: "Commitment", score: 65, weight: 10 },
      { label: "Values", score: 76, weight: 10 },
      { label: "Location", score: 72, weight: 5 },
    ],
    sharedStrengths: ["Design thinking"],
    complementaryStrengths: ["Visual branding expertise you may lack"],
    mismatchFlags: ["Freelance basis — may not commit long-term"],
    explanation: "Lena's design skills are valuable for early branding. Consider whether freelance arrangement fits your co-founder expectations.",
  },
];

const roleColor: Record<string, string> = {
  Founder: "bg-accent/20 text-accent",
  Investor: "bg-primary/20 text-primary",
  "Co-Founder": "bg-secondary text-secondary-foreground",
  Mentor: "bg-primary/10 text-primary",
};

const roles = ["All Roles", "Founder", "Co-Founder", "Investor", "Mentor"];
const stages = ["All Stages", "Pre-seed", "Seed", "MVP", "Series A", "Any"];

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? "bg-primary" : score >= 70 ? "bg-accent" : "bg-destructive/60";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-[10px] font-medium text-foreground w-8 text-right">{score}%</span>
    </div>
  );
}

export default function DiscoverPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [savedProfiles, setSavedProfiles] = useState<number[]>([]);
  const [introSent, setIntroSent] = useState<Set<string>>(new Set());
  const [introLoading, setIntroLoading] = useState<Set<string>>(new Set());
  const [expandedProfile, setExpandedProfile] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<MatchProfile[]>(mockProfiles);
  const [searchResults, setSearchResults] = useState<MatchProfile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 350);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch real suggested users and merge with mock compatibility data
  const fetchSuggested = useCallback(async () => {
    setIsLoading(true);
    try {
      const { suggested } = await api.connections.getSuggested();
      if (suggested.length > 0) {
        const real: MatchProfile[] = suggested.map((u, i) => {
          const mock = mockProfiles[i % mockProfiles.length];
          return {
            ...mock,
            id: i + 100,
            _realId: u.id,
            name: u.name,
            headline: u.headline ?? mock.headline,
            skills: u.skills.length > 0 ? u.skills : mock.skills,
            matchScore: u.matchScore,
            explanation: u.reason,
          } as MatchProfile & { _realId: string };
        });
        setProfiles(real.length > 0 ? real : mockProfiles);
      }
    } catch {
      // Fallback to mock data — backend may be offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchSuggested();
  }, [isAuthenticated, fetchSuggested]);

  // Live backend search when query ≥ 2 chars
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    api.search.query(debouncedQuery.trim(), "users", 30)
      .then(({ users: hits }) => {
        if (cancelled) return;
        const results: MatchProfile[] = hits.map((h, i) => {
          const mock = mockProfiles[i % mockProfiles.length];
          return {
            ...mock,
            id: i + 1000,
            _realId: h.id,
            name: h.name || "Unknown",
            headline: h.headline || mock.headline,
            skills: h.skills ? h.skills.split(" ").filter(Boolean) : mock.skills,
            location: h.location || mock.location,
            matchScore: Math.round((h.score ?? 0.5) * 100),
            explanation: `Matched by full-text search`,
          } as MatchProfile & { _realId: string };
        });
        setSearchResults(results);
      })
      .catch(() => setSearchResults(null))
      .finally(() => { if (!cancelled) setIsSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const sourceList = searchResults !== null ? searchResults : profiles;
  const filtered = sourceList.filter((p) => {
    const matchesSearch = searchResults !== null
      ? true // already filtered by backend
      : p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "All Roles" || p.role === roleFilter;
    const matchesStage = stageFilter === "All Stages" || p.stage === stageFilter;
    return matchesSearch && matchesRole && matchesStage;
  });

  const activeFilters = [
    roleFilter !== "All Roles" ? roleFilter : null,
    stageFilter !== "All Stages" ? stageFilter : null,
  ].filter(Boolean);

  const toggleSave = (id: number) =>
    setSavedProfiles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const sendIntro = useCallback(async (profile: MatchProfile) => {
    const realId = (profile as MatchProfile & { _realId?: string })._realId;
    const key = realId ?? String(profile.id);
    if (introSent.has(key) || introLoading.has(key)) return;
    setIntroLoading((prev) => new Set(prev).add(key));
    if (realId) {
      try {
        await api.connections.requestConnection(realId, `Hi ${profile.name}, I'd love to connect!`);
      } catch {
        // Silently degrade — still mark as sent in UI
      }
    }
    setIntroSent((prev) => new Set(prev).add(key));
    setIntroLoading((prev) => { const s = new Set(prev); s.delete(key); return s; });
  }, [introSent, introLoading]);

  return (
    <AppLayout title="Discover">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search founders, co-founders, mentors..." className="pl-10 pr-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />}
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <div className="hidden sm:flex border border-border rounded-lg">
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{filtered.length} {searchResults !== null ? "search result" : "match"}{filtered.length !== 1 ? "s" : ""}</span>
              {activeFilters.map((f) => (
                <Badge key={f} variant="secondary" className="gap-1 text-xs">
                  {f}
                  <button onClick={() => { if (roles.includes(f!)) setRoleFilter("All Roles"); else setStageFilter("All Stages"); }}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {activeFilters.length > 0 && (
                <button className="text-xs text-primary hover:underline" onClick={() => { setRoleFilter("All Roles"); setStageFilter("All Stages"); }}>Clear all</button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ProfileCardSkeleton key={i} />)}</div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode + roleFilter + stageFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}
              >
                {filtered.map((profile) => {
                  const isExpanded = expandedProfile === profile.id;
                  return (
                    <motion.div
                      key={profile.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group rounded-2xl border border-border/50 bg-card-gradient transition-all duration-300 hover:border-primary/30 hover:shadow-glow ${
                        viewMode === "list" ? "p-4" : "p-5"
                      }`}
                    >
                      <div className={viewMode === "list" ? "flex items-center gap-4" : ""}>
                        <div className={viewMode === "list" ? "flex items-center gap-3 flex-1 min-w-0" : "flex items-start justify-between"}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                              <span className="text-sm font-semibold text-primary">{profile.name.split(" ").map((n) => n[0]).join("")}</span>
                            </div>
                            <div>
                              <h3 className="font-display font-semibold text-foreground">{profile.name}</h3>
                              <Badge variant="secondary" className={`text-[10px] ${roleColor[profile.role] || ""}`}>{profile.role}</Badge>
                            </div>
                          </div>
                          {viewMode === "grid" && (
                            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                              <Zap className="h-3 w-3 text-primary" />
                              <span className="text-xs font-bold text-primary">{profile.matchScore}%</span>
                            </div>
                          )}
                        </div>

                        {viewMode === "list" && (
                          <>
                            <p className="text-sm text-muted-foreground truncate flex-1">{profile.headline}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                                <span className="text-xs font-semibold text-primary">{profile.matchScore}%</span>
                              </div>
                              {introSent.has((profile as MatchProfile & { _realId?: string })._realId ?? String(profile.id)) ? (
                                <Button variant="outline" size="sm" className="text-xs" disabled>Sent</Button>
                              ) : (
                                <Button variant="default" size="sm" className="text-xs" disabled={introLoading.has((profile as MatchProfile & { _realId?: string })._realId ?? String(profile.id))} onClick={() => sendIntro(profile)}>Connect</Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSave(profile.id)}>
                                <Bookmark className={`h-4 w-4 ${savedProfiles.includes(profile.id) ? "fill-accent text-accent" : ""}`} />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>

                      {viewMode === "grid" && (
                        <>
                          <p className="mt-3 text-sm text-muted-foreground">{profile.headline}</p>

                          {/* Match Explanation */}
                          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                            <p className="text-xs text-foreground/80">
                              <Zap className="h-3 w-3 text-primary inline mr-1" />
                              {profile.explanation}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {profile.skills.map((skill) => (
                              <span key={skill} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">{skill}</span>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{profile.availability}</span>
                          </div>

                          <div className="mt-3 rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                            <span className="text-muted-foreground">Looking for: </span>
                            <span className="font-medium text-foreground">{profile.lookingFor}</span>
                          </div>

                          {/* Expandable Compatibility Breakdown */}
                          <button
                            onClick={() => setExpandedProfile(isExpanded ? null : profile.id)}
                            className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline w-full justify-center"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {isExpanded ? "Hide" : "View"} compatibility breakdown
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 space-y-4 pt-3 border-t border-border/30">
                                  {/* Score Breakdown */}
                                  <div className="space-y-1.5">
                                    {profile.compatibility.map(dim => (
                                      <ScoreBar key={dim.label} score={dim.score} label={dim.label} />
                                    ))}
                                  </div>

                                  {/* Shared & Complementary */}
                                  {profile.sharedStrengths.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-primary" /> Shared Strengths
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {profile.sharedStrengths.map(s => (
                                          <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{s}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {profile.complementaryStrengths.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
                                        <Target className="h-3 w-3 text-accent" /> Complementary
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {profile.complementaryStrengths.map(s => (
                                          <span key={s} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">{s}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {profile.mismatchFlags.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 text-destructive" /> Watch Out
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {profile.mismatchFlags.map(f => (
                                          <span key={f} className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">{f}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex gap-2 mt-4">
                            {introSent.has((profile as MatchProfile & { _realId?: string })._realId ?? String(profile.id)) ? (
                              <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" disabled>
                                <MessageSquare className="h-3 w-3" /> Request Sent
                              </Button>
                            ) : (
                              <Button variant="default" size="sm" className="flex-1 text-xs gap-1.5" disabled={introLoading.has((profile as MatchProfile & { _realId?: string })._realId ?? String(profile.id))} onClick={() => sendIntro(profile)}>
                                <MessageSquare className="h-3 w-3" /> {introLoading.has((profile as MatchProfile & { _realId?: string })._realId ?? String(profile.id)) ? "Sending…" : "Request Intro"}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSave(profile.id)}>
                              <Bookmark className={`h-4 w-4 ${savedProfiles.includes(profile.id) ? "fill-accent text-accent" : ""}`} />
                            </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-foreground">No matches found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearchQuery(""); setRoleFilter("All Roles"); setStageFilter("All Stages"); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
