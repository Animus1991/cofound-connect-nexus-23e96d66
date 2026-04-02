import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Bookmark,
  BookmarkX,
  MapPin,
  Sparkles,
  ExternalLink,
  Users,
  X,
  Star,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SavedProfile {
  id: string;
  name: string;
  initials: string;
  headline: string;
  role: string;
  location: string;
  skills: string[];
  stage: string;
  matchScore: number;
  savedAt: string;
  note?: string;
  category: "cofounder" | "mentor" | "advisor" | "investor" | "developer";
  connected: boolean;
}

const MOCK_SAVED: SavedProfile[] = [
  {
    id: "s1", name: "Alex Chen", initials: "AC",
    headline: "Ex-Google PM building AI infrastructure tools",
    role: "Founder / CTO", location: "San Francisco", stage: "MVP",
    skills: ["AI/ML", "Python", "Product Strategy", "Cloud"],
    matchScore: 94, savedAt: "2h ago", category: "cofounder", connected: false,
    note: "Strong technical background, shares interest in AI tooling"
  },
  {
    id: "s2", name: "Maria Santos", initials: "MS",
    headline: "Fintech product leader with 10 years at Stripe & PayPal",
    role: "Head of Product", location: "London", stage: "Growth",
    skills: ["Fintech", "Product", "SaaS", "B2B"],
    matchScore: 89, savedAt: "1d ago", category: "cofounder", connected: true,
  },
  {
    id: "s3", name: "Dr. Sarah Kim", initials: "SK",
    headline: "AI strategy advisor to 30+ startups — former Stanford research lead",
    role: "Mentor / Advisor", location: "Remote", stage: "Any",
    skills: ["AI Strategy", "ML Research", "GTM", "Fundraising"],
    matchScore: 92, savedAt: "3d ago", category: "mentor", connected: false,
  },
  {
    id: "s4", name: "Dimitris P.", initials: "DP",
    headline: "Full-stack engineer looking to co-found in HealthTech space",
    role: "Co-Founder Candidate", location: "Athens", stage: "Idea / MVP",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    matchScore: 85, savedAt: "1w ago", category: "developer", connected: false,
  },
  {
    id: "s5", name: "Lena Müller", initials: "LM",
    headline: "Design systems lead at Figma, looking for next challenge",
    role: "Head of Design", location: "Berlin", stage: "MVP",
    skills: ["Design Systems", "UX Research", "Figma", "Brand"],
    matchScore: 83, savedAt: "1w ago", category: "cofounder", connected: true,
  },
  {
    id: "s6", name: "James Okafor", initials: "JO",
    headline: "Growth & GTM advisor — helped 4 startups reach Series A",
    role: "Growth Advisor", location: "New York", stage: "Any",
    skills: ["Growth", "GTM", "Sales", "Marketing"],
    matchScore: 88, savedAt: "2w ago", category: "advisor", connected: false,
  },
  {
    id: "s7", name: "Yuki Tanaka", initials: "YT",
    headline: "Angel investor focused on SaaS + HealthTech — 20+ portfolio companies",
    role: "Angel Investor", location: "Tokyo / Remote", stage: "Any",
    skills: ["Investing", "SaaS", "HealthTech", "B2B"],
    matchScore: 80, savedAt: "2w ago", category: "investor", connected: false,
  },
];

const CATEGORIES = ["all", "cofounder", "mentor", "advisor", "investor", "developer"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  all: "All", cofounder: "Co-Founder", mentor: "Mentor",
  advisor: "Advisor", investor: "Investor", developer: "Developer"
};
const CATEGORY_COLORS: Record<string, string> = {
  cofounder: "bg-primary/10 text-primary border-primary/20",
  mentor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  advisor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  investor: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  developer: "bg-green-500/10 text-green-600 border-green-500/20",
};

export default function SavedProfilesPage() {
  const [saved, setSaved] = useState<SavedProfile[]>(MOCK_SAVED);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<SavedProfile | null>(null);
  const [connected, setConnected] = useState<Set<string>>(
    () => new Set(MOCK_SAVED.filter(p => p.connected).map(p => p.id))
  );

  const filtered = saved.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || p.name.toLowerCase().includes(q)
      || p.headline.toLowerCase().includes(q)
      || p.skills.some((s) => s.toLowerCase().includes(q));
    const matchesCat = category === "all" || p.category === category;
    return matchesSearch && matchesCat;
  });

  const removeSaved = (id: string) => {
    setSaved((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const toggleConnect = (id: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <AppLayout title="Saved Profiles">
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">

        {/* ── Left: list panel ── */}
        <div className={`flex flex-col border-r border-border/50 bg-background transition-all ${
          selected ? "hidden lg:flex lg:w-[360px] shrink-0" : "flex-1"
        }`}>
          {/* Header + filters */}
          <div className="p-4 border-b border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" /> Saved Profiles
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {saved.length} saved · {filtered.length} shown
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search saved profiles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                    category === cat
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-secondary border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                  {cat !== "all" && (
                    <span className="ml-1 opacity-60">
                      {saved.filter(p => p.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Profile list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-3">
                  <Bookmark className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">No saved profiles</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search || category !== "all"
                    ? "Try adjusting your search or filters"
                    : "Browse Discover or Matches to save profiles"}
                </p>
                {(search || category !== "all") && (
                  <Button variant="ghost" size="sm" className="mt-3 text-xs gap-1"
                    onClick={() => { setSearch(""); setCategory("all"); }}>
                    <Filter className="h-3 w-3" /> Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <AnimatePresence>
                <div className="p-2 space-y-0.5">
                  {filtered.map((profile) => (
                    <motion.button
                      key={profile.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => setSelected(selected?.id === profile.id ? null : profile)}
                      className={`w-full text-left rounded-xl p-3 transition-all border ${
                        selected?.id === profile.id
                          ? "bg-primary/10 border-primary/30"
                          : "border-transparent hover:bg-secondary/50 hover:border-border/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">{profile.initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full tabular-nums shrink-0">
                              {profile.matchScore}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{profile.headline}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0 rounded-full border capitalize ${CATEGORY_COLORS[profile.category] ?? ""}`}>
                              {CATEGORY_LABELS[profile.category]}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5" />{profile.location}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{profile.savedAt}</span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Right: detail panel ── */}
        {selected ? (
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="p-6 space-y-5 max-w-2xl">
              <button onClick={() => setSelected(null)} className="lg:hidden flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                ← Back
              </button>

              {/* Profile header card */}
              <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
                <div className="relative flex items-start gap-5">
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{selected.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-xl font-bold text-foreground">{selected.name}</h2>
                        <p className="text-sm text-primary mt-0.5">{selected.role}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-bold text-primary tabular-nums">{selected.matchScore}%</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeSaved(selected.id)} title="Remove from saved">
                          <BookmarkX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{selected.headline}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.location}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${CATEGORY_COLORS[selected.category] ?? ""}`}>
                        {CATEGORY_LABELS[selected.category]}
                      </span>
                      <span>Saved {selected.savedAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map((skill) => (
                    <span key={skill} className="text-xs bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Note */}
              {selected.note && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-3.5 w-3.5 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">Your Note</h3>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed italic">"{selected.note}"</p>
                </div>
              )}

              {/* Compatibility insight */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-semibold text-primary">Compatibility Insight</h3>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Based on your profile, <strong>{selected.name}</strong> has a{" "}
                  <strong className="text-primary">{selected.matchScore}% compatibility score</strong>.
                  Their expertise in {selected.skills.slice(0, 2).join(" and ")} complements your profile well.{" "}
                  <Link to="/matches" className="text-primary hover:underline">View full match breakdown →</Link>
                </p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link to={`/discover`} className="contents">
                  <Button variant="outline" className="gap-2 w-full">
                    <ExternalLink className="h-4 w-4" /> View Profile
                  </Button>
                </Link>
                <Button className="gap-2 w-full">
                  <MessageSquare className="h-4 w-4" /> Send Message
                </Button>
                <Button
                  variant={connected.has(selected.id) ? "secondary" : "outline"}
                  className="gap-2 w-full"
                  onClick={() => toggleConnect(selected.id)}
                >
                  {connected.has(selected.id)
                    ? <><CheckCircle2 className="h-4 w-4 text-primary" /> Connected</>
                    : <><UserPlus className="h-4 w-4" /> Connect</>
                  }
                </Button>
                <Button variant="ghost" className="gap-2 w-full text-muted-foreground hover:text-destructive"
                  onClick={() => removeSaved(selected.id)}>
                  <BookmarkX className="h-4 w-4" /> Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty detail state — desktop */
          <div className="hidden lg:flex flex-1 items-center justify-center bg-background">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a saved profile</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Click any profile on the left to view details and take action
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
