import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mockProfiles = [
  {
    id: 1, name: "Alex Chen", role: "Founder",
    headline: "Building AI-powered recruitment tools",
    skills: ["Machine Learning", "Python", "Product Strategy"],
    location: "San Francisco, CA", availability: "Full-time",
    matchScore: 92, stage: "MVP", lookingFor: "Technical Co-founder",
  },
  {
    id: 2, name: "Maria Santos", role: "Investor",
    headline: "Angel investor — Early-stage SaaS & fintech",
    skills: ["Due Diligence", "Fintech", "SaaS"],
    location: "London, UK", availability: "Part-time",
    matchScore: 87, stage: "Seed", lookingFor: "Deal flow",
  },
  {
    id: 3, name: "Dimitris Papadopoulos", role: "Professional",
    headline: "Full-stack engineer — React, Node, PostgreSQL",
    skills: ["React", "TypeScript", "Node.js"],
    location: "Athens, Greece", availability: "20h/week",
    matchScore: 85, stage: "Any", lookingFor: "Equity-based role",
  },
  {
    id: 4, name: "Sarah Kim", role: "Mentor",
    headline: "Ex-Google PM — 15y product & growth experience",
    skills: ["Product Management", "Growth", "Strategy"],
    location: "Remote", availability: "5h/week",
    matchScore: 79, stage: "Any", lookingFor: "Mentoring sessions",
  },
  {
    id: 5, name: "James Okafor", role: "Founder",
    headline: "Climate-tech startup — Carbon tracking for SMBs",
    skills: ["Sustainability", "Business Dev", "Operations"],
    location: "Lagos, Nigeria", availability: "Full-time",
    matchScore: 76, stage: "Pre-seed", lookingFor: "CTO Co-founder",
  },
  {
    id: 6, name: "Lena Müller", role: "Professional",
    headline: "Brand designer — Helping startups stand out",
    skills: ["Brand Design", "UI/UX", "Figma"],
    location: "Berlin, Germany", availability: "Freelance",
    matchScore: 73, stage: "Any", lookingFor: "Startup projects",
  },
];

const roleColor: Record<string, string> = {
  Founder: "bg-accent/20 text-accent",
  Investor: "bg-primary/20 text-primary",
  Professional: "bg-secondary text-secondary-foreground",
  Mentor: "bg-primary/10 text-primary",
};

const roles = ["All Roles", "Founder", "Investor", "Professional", "Mentor"];
const stages = ["All Stages", "Pre-seed", "Seed", "MVP", "Series A", "Any"];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [savedProfiles, setSavedProfiles] = useState<number[]>([]);
  const [introSent, setIntroSent] = useState<number[]>([]);

  const filtered = mockProfiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const sendIntro = (id: number) => setIntroSent((prev) => [...prev, id]);

  return (
    <AppLayout title="Discover">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search founders, investors, mentors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden sm:flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters + Results count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
              {activeFilters.map((f) => (
                <Badge key={f} variant="secondary" className="gap-1 text-xs">
                  {f}
                  <button onClick={() => {
                    if (roles.includes(f!)) setRoleFilter("All Roles");
                    else setStageFilter("All Stages");
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {activeFilters.length > 0 && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => { setRoleFilter("All Roles"); setStageFilter("All Stages"); }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + roleFilter + stageFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                : "space-y-3"
            }
          >
            {filtered.map((profile) => (
              <motion.div
                key={profile.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group rounded-2xl border border-border/50 bg-card-gradient transition-all duration-300 hover:border-primary/30 hover:shadow-glow ${
                  viewMode === "list" ? "flex items-center gap-4 p-4" : "p-6"
                }`}
              >
                <div className={viewMode === "list" ? "flex items-center gap-3 flex-1 min-w-0" : ""}>
                  <div className={viewMode === "list" ? "flex items-center gap-3 flex-1" : "flex items-start justify-between"}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-sm font-semibold text-primary">
                          {profile.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">
                          {profile.name}
                        </h3>
                        <Badge variant="secondary" className={`text-[10px] ${roleColor[profile.role] || ""}`}>
                          {profile.role}
                        </Badge>
                      </div>
                    </div>
                    {viewMode === "grid" && (
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                        <Star className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold text-primary">{profile.matchScore}%</span>
                      </div>
                    )}
                  </div>

                  {viewMode === "list" && (
                    <p className="text-sm text-muted-foreground truncate flex-1">{profile.headline}</p>
                  )}
                </div>

                {viewMode === "grid" && (
                  <>
                    <p className="mt-3 text-sm text-muted-foreground">{profile.headline}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {profile.skills.map((skill) => (
                        <span key={skill} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{profile.availability}</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">Looking for: </span>
                      <span className="font-medium text-foreground">{profile.lookingFor}</span>
                    </div>
                  </>
                )}

                <div className={`flex gap-2 ${viewMode === "grid" ? "mt-4" : "shrink-0"}`}>
                  {introSent.includes(profile.id) ? (
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" disabled>
                      <MessageSquare className="h-3 w-3" /> Sent
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" className="text-xs gap-1.5" onClick={() => sendIntro(profile.id)}>
                      <MessageSquare className="h-3 w-3" /> Request Intro
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSave(profile.id)}
                  >
                    <Bookmark className={`h-4 w-4 ${savedProfiles.includes(profile.id) ? "fill-accent text-accent" : ""}`} />
                  </Button>
                  {viewMode === "list" && (
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                      <span className="text-xs font-semibold text-primary">{profile.matchScore}%</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
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
      </div>
    </AppLayout>
  );
}
