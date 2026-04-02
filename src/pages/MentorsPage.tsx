import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { ProfileCardSkeleton } from "@/components/SkeletonLoaders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Star,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Filter,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mockMentors = [
  {
    id: 1, name: "Dr. Sarah Kim", headline: "Ex-Google VP · AI/ML Strategy",
    expertise: ["AI/ML", "Product Strategy", "Fundraising"], location: "San Francisco, CA",
    stages: ["MVP", "Seed", "Series A"], rating: 4.9, sessions: 156,
    availability: "Open", format: "1-on-1 Video", maxMentees: 3, currentMentees: 1,
    bio: "15+ years in AI/ML. Helped 40+ startups raise Series A.",
  },
  {
    id: 2, name: "James Okafor", headline: "Serial Entrepreneur · 3 Exits",
    expertise: ["Growth", "SaaS", "Go-to-Market"], location: "London, UK",
    stages: ["Idea", "MVP", "Traction"], rating: 4.8, sessions: 89,
    availability: "Open", format: "Group Sessions", maxMentees: 5, currentMentees: 3,
    bio: "Founded and exited 3 SaaS companies. Focus on GTM strategy.",
  },
  {
    id: 3, name: "Priya Sharma", headline: "VC Partner · Deep Tech Focus",
    expertise: ["Fundraising", "Deep Tech", "Pitch Coaching"], location: "Bangalore, India",
    stages: ["Seed", "Series A"], rating: 4.7, sessions: 67,
    availability: "Limited", format: "1-on-1 Video", maxMentees: 2, currentMentees: 2,
    bio: "Partner at top-tier VC. Invested in 20+ deep tech startups.",
  },
  {
    id: 4, name: "Marco Bianchi", headline: "CTO · Scalable Architecture Expert",
    expertise: ["Engineering", "Architecture", "DevOps"], location: "Milan, Italy",
    stages: ["MVP", "Traction", "Scale"], rating: 4.9, sessions: 112,
    availability: "Open", format: "1-on-1 Video", maxMentees: 4, currentMentees: 2,
    bio: "Built infrastructure for 3 unicorns. Expert in scaling engineering teams.",
  },
  {
    id: 5, name: "Elena Vasquez", headline: "Design Lead · UX for Startups",
    expertise: ["UI/UX", "Design Systems", "User Research"], location: "Barcelona, Spain",
    stages: ["Idea", "MVP"], rating: 4.6, sessions: 43,
    availability: "Open", format: "1-on-1 Video", maxMentees: 3, currentMentees: 0,
    bio: "Led design at 2 YC startups. Passionate about product-led growth through design.",
  },
  {
    id: 6, name: "Takeshi Yamada", headline: "CFO · Financial Modeling & Ops",
    expertise: ["Finance", "Operations", "Fundraising"], location: "Tokyo, Japan",
    stages: ["Traction", "Seed", "Series A"], rating: 4.8, sessions: 78,
    availability: "Limited", format: "Group Sessions", maxMentees: 6, currentMentees: 4,
    bio: "CFO experience at 4 startups. Expert in financial modeling and investor relations.",
  },
];

const expertiseOptions = ["AI/ML", "SaaS", "Growth", "Fundraising", "Engineering", "UI/UX", "Finance", "Product Strategy"];
const stageOptions = ["Idea", "MVP", "Traction", "Seed", "Series A", "Scale"];

type Mentor = typeof mockMentors[0];

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [requestedMentors, setRequestedMentors] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = mockMentors.filter((m) => {
    const matchesSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.headline.toLowerCase().includes(searchQuery.toLowerCase()) || m.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesExpertise = expertiseFilter === "all" || m.expertise.some(e => e.toLowerCase().includes(expertiseFilter.toLowerCase()));
    const matchesStage = stageFilter === "all" || m.stages.includes(stageFilter);
    const matchesAvail = availabilityFilter === "all" || m.availability.toLowerCase() === availabilityFilter.toLowerCase();
    return matchesSearch && matchesExpertise && matchesStage && matchesAvail;
  });

  return (
    <AppLayout
      title="Mentors"
      headerActions={
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search mentors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-56 h-9" />
        </div>
      }
    >
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">

        {/* ── Left: sticky filter sidebar ── */}
        <div className="hidden lg:flex flex-col w-[200px] shrink-0 border-r border-border/50 bg-background">
          <div className="p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Expertise</label>
              <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Expertise" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Expertise</SelectItem>
                  {expertiseOptions.map(e => <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Stage</label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Stages" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Stages</SelectItem>
                  {stageOptions.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Availability</label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Any</SelectItem>
                  <SelectItem value="open" className="text-xs">Open</SelectItem>
                  <SelectItem value="limited" className="text-xs">Limited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(expertiseFilter !== "all" || stageFilter !== "all" || availabilityFilter !== "all") && (
              <button onClick={() => { setExpertiseFilter("all"); setStageFilter("all"); setAvailabilityFilter("all"); }}
                className="text-xs text-primary hover:underline">
                Clear filters
              </button>
            )}

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">{filtered.length} mentor{filtered.length !== 1 ? "s" : ""} found</p>
            </div>
          </div>
        </div>

        {/* ── Center: cards grid ── */}
        <div className={`flex-1 overflow-y-auto ${selectedMentor ? "lg:max-w-[calc(100%-360px)]" : ""}`}>
        <div className="px-2 py-3 space-y-4">

        {/* Mobile search + filters */}
        <div className="lg:hidden space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search mentors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Expertise" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                {expertiseOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ProfileCardSkeleton key={i} />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={expertiseFilter + stageFilter + availabilityFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((mentor, i) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className={`rounded-2xl border p-5 transition-all duration-300 cursor-pointer hover:border-primary/20 hover:shadow-[0_2px_16px_hsl(var(--primary)/0.06)] active:scale-[0.99] ${
                    selectedMentor?.id === mentor.id ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card"
                  }`}
                  onClick={() => setSelectedMentor(selectedMentor?.id === mentor.id ? null : mentor)}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-sm font-semibold text-foreground truncate">{mentor.name}</h3>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{mentor.headline}</p>
                    </div>
                    <Badge
                      variant={mentor.availability === "Open" ? "default" : "secondary"}
                      className="shrink-0 text-[10px]"
                    >
                      {mentor.availability}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{mentor.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mentor.expertise.map(e => (
                      <span key={e} className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">{e}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-accent fill-accent" />{mentor.rating}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{mentor.sessions} sessions</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{mentor.location.split(",")[0]}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{mentor.currentMentees}/{mentor.maxMentees} mentees</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {mentor.stages.map(s => (
                      <span key={s} className="rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] text-secondary-foreground">{s}</span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 text-xs h-8"
                      variant={requestedMentors.includes(mentor.id) ? "secondary" : "default"}
                      disabled={requestedMentors.includes(mentor.id) || mentor.currentMentees >= mentor.maxMentees}
                      onClick={() => setRequestedMentors(prev => [...prev, mentor.id])}
                    >
                      {requestedMentors.includes(mentor.id) ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" />Requested</>
                      ) : mentor.currentMentees >= mentor.maxMentees ? "Full" : "Request Mentorship"}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>
                  <Link
                    to={`/profile/${mentor.id}`}
                    className="mt-2 block text-center text-[11px] text-primary hover:underline"
                  >
                    View full profile →
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No mentors found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
            <Button variant="outline" size="sm" onClick={() => { setExpertiseFilter("all"); setStageFilter("all"); setAvailabilityFilter("all"); setSearchQuery(""); }}>
              Clear Filters
            </Button>
          </div>
        )}
        </div>{/* /px-2 py-3 */}
        </div>{/* /center scroll */}

        {/* ── Right: detail quick-view panel ── */}
        {selectedMentor ? (
          <div className="hidden lg:flex flex-col w-[340px] shrink-0 border-l border-border/50 bg-background overflow-y-auto">
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/12">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">{selectedMentor.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedMentor.headline}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMentor(null)} className="text-muted-foreground hover:text-foreground">
                  <span className="text-xs">✕</span>
                </button>
              </div>

              <Badge variant={selectedMentor.availability === "Open" ? "default" : "secondary"} className="text-xs">
                {selectedMentor.availability}
              </Badge>

              <p className="text-xs text-foreground/80 leading-relaxed">{selectedMentor.bio}</p>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Expertise</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMentor.expertise.map(e => (
                    <span key={e} className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Startup Stages</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMentor.stages.map(s => (
                    <span key={s} className="rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] text-secondary-foreground">{s}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/30 p-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-accent fill-accent" />{selectedMentor.rating} rating</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selectedMentor.sessions} sessions</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedMentor.location.split(",")[0]}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{selectedMentor.currentMentees}/{selectedMentor.maxMentees} mentees</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm" className="flex-1 text-xs h-8"
                  variant={requestedMentors.includes(selectedMentor.id) ? "secondary" : "default"}
                  disabled={requestedMentors.includes(selectedMentor.id) || selectedMentor.currentMentees >= selectedMentor.maxMentees}
                  onClick={() => setRequestedMentors(prev => [...prev, selectedMentor.id])}
                >
                  {requestedMentors.includes(selectedMentor.id)
                    ? <><CheckCircle2 className="h-3 w-3 mr-1" />Requested</>
                    : selectedMentor.currentMentees >= selectedMentor.maxMentees ? "Full" : "Request Mentorship"}
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </div>
              <Link to={`/profile/${selectedMentor.id}`} className="block text-center text-xs text-primary hover:underline">
                View full profile →
              </Link>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex w-[340px] shrink-0 border-l border-border/50 bg-background/50 items-center justify-center">
            <div className="text-center px-6">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground">Click a mentor card to preview details</p>
            </div>
          </div>
        )}

      </div>{/* /flex h-full */}
    </AppLayout>
  );
}
