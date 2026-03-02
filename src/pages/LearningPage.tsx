import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Users,
  Clock,
  Star,
  Play,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  GraduationCap,
  TrendingUp,
  MessageSquare,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  completedLessons: number;
  rating: number;
  enrolled: number;
  instructor: string;
  instructorInitials: string;
  thumbnail: string;
  saved: boolean;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "article" | "video" | "template" | "guide";
  category: string;
  readTime: string;
  author: string;
  saved: boolean;
}

interface Mentor {
  id: string;
  name: string;
  initials: string;
  role: string;
  expertise: string[];
  rating: number;
  sessions: number;
  availability: string;
  bio: string;
  requested: boolean;
}

// ── Mock data ──────────────────────────────────────────────
const mockCourses: Course[] = [
  { id: "co1", title: "Startup Fundraising Masterclass", description: "Learn how to pitch VCs, structure term sheets, and close your seed round.", category: "Fundraising", level: "Intermediate", duration: "4h 30m", lessons: 12, completedLessons: 5, rating: 4.8, enrolled: 2340, instructor: "Sarah Chen", instructorInitials: "SC", thumbnail: "📊", saved: false },
  { id: "co2", title: "Product-Market Fit Bootcamp", description: "Validate your idea, find early adopters, and iterate towards PMF.", category: "Product", level: "Beginner", duration: "3h 15m", lessons: 8, completedLessons: 0, rating: 4.9, enrolled: 3120, instructor: "Alex Rivera", instructorInitials: "AR", thumbnail: "🎯", saved: true },
  { id: "co3", title: "Technical Co-Founder Handbook", description: "What non-technical founders need to know about building software.", category: "Technology", level: "Beginner", duration: "2h 45m", lessons: 10, completedLessons: 10, rating: 4.7, enrolled: 1890, instructor: "Nikos P.", instructorInitials: "NP", thumbnail: "💻", saved: false },
  { id: "co4", title: "Growth Hacking for SaaS", description: "Proven acquisition channels and viral loop strategies for B2B SaaS.", category: "Growth", level: "Advanced", duration: "5h 20m", lessons: 15, completedLessons: 3, rating: 4.6, enrolled: 1560, instructor: "Maria K.", instructorInitials: "MK", thumbnail: "🚀", saved: false },
  { id: "co5", title: "Legal Essentials for Startups", description: "Incorporate, protect your IP, draft contracts, and stay compliant.", category: "Legal", level: "Beginner", duration: "2h", lessons: 6, completedLessons: 0, rating: 4.5, enrolled: 980, instructor: "Dimitris L.", instructorInitials: "DL", thumbnail: "⚖️", saved: false },
  { id: "co6", title: "Building Remote Teams", description: "Hiring, onboarding, and managing distributed startup teams effectively.", category: "Team", level: "Intermediate", duration: "3h", lessons: 9, completedLessons: 2, rating: 4.7, enrolled: 1200, instructor: "Elena V.", instructorInitials: "EV", thumbnail: "🌍", saved: true },
];

const mockResources: Resource[] = [
  { id: "r1", title: "The Perfect Pitch Deck Template", description: "A proven 12-slide framework used by 500+ funded startups.", type: "template", category: "Fundraising", readTime: "10 min", author: "CoFounderBay Team", saved: true },
  { id: "r2", title: "How to Calculate Your Startup Valuation", description: "Step-by-step guide to pre-money and post-money valuation methods.", type: "article", category: "Finance", readTime: "8 min", author: "Maria Santos", saved: false },
  { id: "r3", title: "Customer Interview Techniques", description: "The Mom Test in practice — how to get honest feedback from users.", type: "video", category: "Product", readTime: "15 min", author: "Alex Rivera", saved: false },
  { id: "r4", title: "Founder Equity Split Calculator", description: "Interactive tool to fairly divide equity among co-founders.", type: "template", category: "Legal", readTime: "5 min", author: "CoFounderBay Team", saved: false },
  { id: "r5", title: "Cold Email Playbook for B2B", description: "Templates and sequences that get 40%+ open rates.", type: "guide", category: "Growth", readTime: "12 min", author: "Nikos M.", saved: true },
  { id: "r6", title: "YC Application Tips 2025", description: "What Y Combinator actually looks for, straight from alumni.", type: "article", category: "Accelerators", readTime: "7 min", author: "Sara K.", saved: false },
];

const mockMentors: Mentor[] = [
  { id: "me1", name: "Sarah Chen", initials: "SC", role: "Ex-Partner @ Sequoia", expertise: ["Fundraising", "Strategy", "B2B SaaS"], rating: 4.9, sessions: 156, availability: "2 slots/week", bio: "15 years in VC. Helped 40+ startups raise Series A.", requested: false },
  { id: "me2", name: "Alex Rivera", initials: "AR", role: "3x Founder (2 exits)", expertise: ["Product", "Growth", "Marketplace"], rating: 4.8, sessions: 203, availability: "3 slots/week", bio: "Built and sold two marketplaces. YC W19 alum.", requested: false },
  { id: "me3", name: "Elena Vasquez", initials: "EV", role: "CTO @ ScaleUp", expertise: ["Engineering", "Architecture", "Hiring"], rating: 4.7, sessions: 89, availability: "1 slot/week", bio: "Scaled engineering teams from 3 to 150. Expert in technical hiring.", requested: true },
  { id: "me4", name: "Dimitris Papadopoulos", initials: "DP", role: "Startup Lawyer", expertise: ["Legal", "IP", "Incorporation"], rating: 4.9, sessions: 124, availability: "4 slots/week", bio: "Advised 200+ startups on legal structure, IP protection, and compliance.", requested: false },
];

const resourceTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  article: FileText,
  video: Video,
  template: BookOpen,
  guide: FileText,
};

// ── Component ──────────────────────────────────────────────
export default function LearningPage() {
  const [activeTab, setActiveTab] = useState("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState(mockCourses);
  const [resources, setResources] = useState(mockResources);
  const [mentors, setMentors] = useState(mockMentors);

  const toggleCourseSaved = (id: string) =>
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, saved: !c.saved } : c)));
  const toggleResourceSaved = (id: string) =>
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, saved: !r.saved } : r)));
  const toggleMentorRequest = (id: string) =>
    setMentors((prev) => prev.map((m) => (m.id === id ? { ...m, requested: !m.requested } : m)));

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredResources = resources.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredMentors = mentors.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inProgressCourses = courses.filter((c) => c.completedLessons > 0 && c.completedLessons < c.lessons);
  const completedCourses = courses.filter((c) => c.completedLessons === c.lessons);

  return (
    <AppLayout title="Learning">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: "Courses In Progress", value: inProgressCourses.length, color: "text-primary" },
            { icon: CheckCircle2, label: "Completed", value: completedCourses.length, color: "text-primary" },
            { icon: Clock, label: "Learning Hours", value: "12.5h", color: "text-primary" },
            { icon: Users, label: "Mentor Sessions", value: "3", color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="courses" className="gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Courses
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Resources
              </TabsTrigger>
              <TabsTrigger value="mentorship" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Mentorship
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50" />
            </div>
          </div>

          {/* Courses */}
          <TabsContent value="courses" className="mt-6">
            {/* Continue Learning */}
            {inProgressCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" /> Continue Learning
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inProgressCourses.map((course) => {
                    const pct = Math.round((course.completedLessons / course.lessons) * 100);
                    return (
                      <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-3xl">{course.thumbnail}</div>
                              <Badge variant="outline" className="shrink-0">{pct}% done</Badge>
                            </div>
                            <h3 className="mt-3 font-semibold text-foreground text-sm">{course.title}</h3>
                            <Progress value={pct} className="mt-2 h-1.5" />
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{course.completedLessons}/{course.lessons} lessons</span>
                              <Button size="sm" variant="hero" className="h-7 text-xs gap-1">
                                Resume <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Courses */}
            <h2 className="text-lg font-semibold text-foreground mb-4">All Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => {
                const pct = Math.round((course.completedLessons / course.lessons) * 100);
                const isComplete = course.completedLessons === course.lessons;
                return (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-border/50 hover:border-primary/30 transition-colors h-full flex flex-col">
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between">
                          <div className="text-3xl">{course.thumbnail}</div>
                          <button onClick={() => toggleCourseSaved(course.id)} className="text-muted-foreground hover:text-primary transition-colors">
                            {course.saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{course.category}</Badge>
                          <Badge variant="outline" className="text-[10px]">{course.level}</Badge>
                        </div>
                        <h3 className="mt-2 font-semibold text-foreground text-sm">{course.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed flex-1">{course.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {course.duration}
                          <span className="mx-1">·</span>
                          <BookOpen className="h-3 w-3" /> {course.lessons} lessons
                          <span className="mx-1">·</span>
                          <Star className="h-3 w-3 text-accent" /> {course.rating}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/20 text-primary text-[9px] font-semibold">{course.instructorInitials}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{course.instructor}</span>
                          </div>
                          <Button size="sm" variant={isComplete ? "secondary" : "hero"} className="h-7 text-xs gap-1">
                            {isComplete ? <><CheckCircle2 className="h-3 w-3" /> Completed</> : pct > 0 ? "Resume" : "Start"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((res) => {
                const TypeIcon = resourceTypeIcons[res.type] || FileText;
                return (
                  <motion.div key={res.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-border/50 hover:border-primary/30 transition-colors h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <button onClick={() => toggleResourceSaved(res.id)} className="text-muted-foreground hover:text-primary transition-colors">
                            {res.saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Badge variant="secondary" className="text-[10px] capitalize">{res.type}</Badge>
                          <Badge variant="outline" className="text-[10px]">{res.category}</Badge>
                        </div>
                        <h3 className="mt-2 font-semibold text-foreground text-sm">{res.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{res.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {res.readTime}
                            <span>· {res.author}</span>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                            Open <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Mentorship */}
          <TabsContent value="mentorship" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMentors.map((mentor) => (
                <motion.div key={mentor.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">{mentor.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{mentor.name}</h3>
                              <p className="text-xs text-muted-foreground">{mentor.role}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-accent">
                              <Star className="h-3 w-3 fill-accent" /> {mentor.rating}
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{mentor.bio}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {mentor.expertise.map((e) => (
                              <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {mentor.sessions} sessions</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {mentor.availability}</span>
                          </div>
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant={mentor.requested ? "secondary" : "hero"}
                              className="h-8 text-xs gap-1.5"
                              onClick={() => toggleMentorRequest(mentor.id)}
                            >
                              {mentor.requested ? <><CheckCircle2 className="h-3 w-3" /> Requested</> : <><TrendingUp className="h-3 w-3" /> Request Session</>}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
