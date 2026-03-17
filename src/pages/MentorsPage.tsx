import { useState, useEffect } from "react";
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
  Clock,
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

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [requestedMentors, setRequestedMentors] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search mentors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-56 h-9 bg-secondary/50" />
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Mobile search */}
        <div className="sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search mentors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
            <SelectTrigger className="w-40 h-9 bg-secondary/50"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Expertise" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expertise</SelectItem>
              {expertiseOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40 h-9 bg-secondary/50"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-40 h-9 bg-secondary/50"><SelectValue placeholder="Availability" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Availability</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
            </SelectContent>
          </Select>
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border/50 bg-card-gradient p-5 interactive-card"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-semibold text-foreground truncate">{mentor.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{mentor.headline}</p>
                    </div>
                    <Badge variant={mentor.availability === "Open" ? "default" : "secondary"} className="ml-auto shrink-0 text-[10px]">
                      {mentor.availability}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{mentor.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mentor.expertise.map(e => (
                      <span key={e} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{e}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-accent" />{mentor.rating} rating</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{mentor.sessions} sessions</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{mentor.location.split(",")[0]}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{mentor.currentMentees}/{mentor.maxMentees} mentees</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {mentor.stages.map(s => (
                      <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{s}</span>
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
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No mentors found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
            <Button variant="outline" size="sm" onClick={() => { setExpertiseFilter("all"); setStageFilter("all"); setAvailabilityFilter("all"); setSearchQuery(""); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
