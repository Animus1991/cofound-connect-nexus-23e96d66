import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/api";
import { StatSkeleton, CardSkeleton, ListItemSkeleton } from "@/components/SkeletonLoaders";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Users,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Zap,
  Eye,
  MessageSquare,
  CheckCircle2,
  Clock,
  Star,
  Flame,
  Bookmark,
  Rocket,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const FALLBACK_MATCHES = [
  { userId: "m1", name: "Alex Chen", headline: "AI Founder building the future", score: 92, skills: ["AI/ML", "Python"], role: "Founder", stage: "mvp" },
  { userId: "m2", name: "Maria Santos", headline: "Fintech product lead", score: 87, skills: ["Fintech", "SaaS"], role: "Investor", stage: "early_traction" },
  { userId: "m3", name: "Dimitris P.", headline: "Full-stack engineer", score: 85, skills: ["React", "Node.js"], role: "Developer", stage: "idea" },
  { userId: "m4", name: "Lena Müller", headline: "Design systems lead", score: 81, skills: ["UI/UX", "Figma"], role: "Designer", stage: "mvp" },
];

type MatchItem = { userId: string; name: string; headline: string | null; score: number; skills: string[]; role: string | null; stage: string | null };

const upcomingEvents = [
  { title: "AI Founders Meetup", date: "Mar 2, 2026", type: "Online", attendees: 45 },
  { title: "Pitch Night Athens", date: "Mar 8, 2026", type: "In-person", attendees: 120 },
  { title: "SaaS Growth Workshop", date: "Mar 15, 2026", type: "Online", attendees: 30 },
];

type ActivityItem = { id: string; label: string; action: string; createdAt: string };

const ACTION_ICONS: Record<string, React.ElementType> = {
  connection_made: Users,
  intro_sent: MessageSquare,
  opportunity_posted: Rocket,
  application_sent: ArrowUpRight,
  message_sent: MessageSquare,
  profile_updated: Star,
  startup_created: Flame,
  startup_updated: Flame,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const todoItems = [
  { label: "Add 3 more skills to your profile", done: true },
  { label: "Upload a profile photo", done: false },
  { label: "Connect your LinkedIn account", done: true },
  { label: "Set your co-founder preferences", done: false },
  { label: "Send your first intro request", done: false },
];

const mentorHighlights = [
  { name: "Dr. Sarah Kim", expertise: "AI/ML Strategy", sessions: 156, rating: 4.9 },
  { name: "James Okafor", expertise: "Growth & GTM", sessions: 89, rating: 4.8 },
];

const fade = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
});

interface DashboardStats {
  connections: number;
  pendingRequests: number;
  suggestions: number;
  matchCount: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [savedMatches, setSavedMatches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ connections: 0, pendingRequests: 0, suggestions: 0, matchCount: 0 });
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [liveMatches, setLiveMatches] = useState<MatchItem[]>([]);
  const completedTodos = todoItems.filter((t) => t.done).length;

  useNotifications();

  const loadStats = useCallback(async () => {
    try {
      const [connsRes, reqsRes, suggestedRes, activityRes, matchesRes] = await Promise.allSettled([
        api.connections.list(),
        api.connections.getRequests(),
        api.connections.getSuggested(),
        api.activity.list(5),
        api.matches.list({ limit: 4 }),
      ]);
      setStats({
        connections: connsRes.status === "fulfilled" ? connsRes.value.connections.length : 0,
        pendingRequests: reqsRes.status === "fulfilled" ? reqsRes.value.incoming.length : 0,
        suggestions: suggestedRes.status === "fulfilled" ? suggestedRes.value.suggested.length : 0,
        matchCount: matchesRes.status === "fulfilled" ? matchesRes.value.total : 0,
      });
      if (activityRes.status === "fulfilled") {
        setActivityItems(activityRes.value.activity);
      }
      if (matchesRes.status === "fulfilled" && matchesRes.value.matches.length > 0) {
        setLiveMatches(matchesRes.value.matches.slice(0, 4));
      } else {
        setLiveMatches(FALLBACK_MATCHES);
      }
    } catch {
      setLiveMatches(FALLBACK_MATCHES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const displayName = user?.name?.split(" ")[0] ?? "there";
  const { tenant, isBrandingActive } = useTenant();
  const welcomeText = isBrandingActive && tenant?.content?.dashboardWelcomeText
    ? tenant.content.dashboardWelcomeText.replace("{name}", displayName)
    : `Welcome back, ${displayName}`;

  const toggleSave = (name: string) => {
    setSavedMatches((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  return (
    <AppLayout title="Dashboard">
      <div className="px-2 py-3 space-y-4">
        {isLoading ? (
          <>
            {/* Hero Skeleton */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-8 bg-muted rounded w-48 mb-3"></div>
              <div className="h-4 bg-muted rounded w-96 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-32"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
            </div>
            
            {/* Content Skeleton */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6"><ListItemSkeleton count={4} /></div>
                <div className="rounded-2xl border border-border bg-card p-6"><ListItemSkeleton count={3} /></div>
              </div>
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6"><ListItemSkeleton count={5} /></div>
                <div className="rounded-2xl border border-border bg-card p-6"><ListItemSkeleton count={4} /></div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Hero Section */}
            <motion.div {...fade(0)} className="rounded-2xl border border-border bg-card p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <h1 className="heading-2 text-foreground">
                    {welcomeText}
                  </h1>
                  <p className="body-base text-muted-foreground leading-relaxed">
                    You have{" "}
                    <span className="text-primary font-semibold">{stats.suggestions} suggested matches</span> and{" "}
                    <span className="font-semibold text-foreground">{stats.pendingRequests} pending intro request{stats.pendingRequests !== 1 ? "s" : ""}.</span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/discover" className="w-full sm:w-auto">
                    <Button size="lg" variant="hero" className="w-full sm:w-auto gap-2">
                      <Search className="h-5 w-5" /> Find Co-founders
                    </Button>
                  </Link>
                  <Link to="/opportunities" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                      <Rocket className="h-5 w-5" /> Post Opportunity
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Profile Views", value: "—", change: "Coming soon", icon: TrendingUp, color: "text-blue-500" },
                { label: "Matches", value: String(stats.matchCount || stats.suggestions), change: stats.matchCount > 0 ? `${stats.matchCount} found` : "Find matches", icon: Sparkles, color: "text-primary" },
                { label: "Intro Requests", value: String(stats.pendingRequests), change: stats.pendingRequests > 0 ? `${stats.pendingRequests} pending` : "None pending", icon: ArrowUpRight, color: "text-amber-500" },
                { label: "Connections", value: String(stats.connections), change: stats.connections > 0 ? `${stats.connections} total` : "Start connecting", icon: Users, color: "text-emerald-500" },
              ].map((stat, i) => (
                <motion.div key={stat.label} {...fade(i + 1)} className="group">
                  <Card variant="elevated" padding="lg" className="hover-lift">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <span className="ui-small text-muted-foreground">{stat.change}</span>
                      </div>
                      <p className="heading-3 text-foreground tabular-nums">{stat.value}</p>
                      <p className="ui-small text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Top Matches */}
              <motion.div {...fade(5)} className="lg:col-span-2 space-y-6">
                <Card variant="elevated" padding="lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" /> Top Matches
                        </CardTitle>
                        <CardDescription className="mt-1">
                          AI-scored compatibility for your profile
                        </CardDescription>
                      </div>
                      <Link to="/matches">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1">
                          View All <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {liveMatches.map((match) => (
                      <div key={match.userId} className="flex items-center justify-between rounded-xl bg-secondary/40 p-4 transition-colors hover:bg-secondary/60 group">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-sm font-semibold text-primary">{(match.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="ui-base font-medium text-foreground group-hover:text-primary transition-colors">{match.name}</p>
                            <div className="flex items-center gap-2">
                              {match.role && <span className="ui-small text-muted-foreground capitalize">{match.role}</span>}
                              <div className="flex gap-1">
                                {match.skills.slice(0, 2).map((s) => (
                                  <Badge key={s} variant="secondary" className="text-xs px-2 py-0.5 bg-secondary/60 text-secondary-foreground">{s}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); toggleSave(match.userId); }} className="text-muted-foreground hover:text-primary transition-colors">
                            <Star className={`h-5 w-5 ${savedMatches.includes(match.userId) ? "fill-primary text-primary" : ""}`} />
                          </button>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary tabular-nums">{Math.round(match.score)}</div>
                            <div className="ui-xs text-muted-foreground">match</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card variant="elevated" padding="lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activityItems.length > 0 ? activityItems.map((item) => {
                      const Icon = ACTION_ICONS[item.action] ?? Zap;
                      return (
                        <div key={item.id} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="body-small text-foreground leading-snug">{item.label}</p>
                            <p className="ui-xs text-muted-foreground mt-1">{relativeTime(item.createdAt)}</p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Clock className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="body-small text-muted-foreground">No recent activity yet. Start connecting!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column - Sidebar Widgets */}
              <div className="space-y-6">
                {/* Getting Started */}
                <motion.div {...fade(6)}>
                  <Card variant="elevated" padding="lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Getting Started</CardTitle>
                        <span className="ui-small text-muted-foreground tabular-nums">{completedTodos}/{todoItems.length}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={(completedTodos / todoItems.length) * 100} className="h-2" />
                      <div className="space-y-2">
                        {todoItems.map((item) => (
                          <div key={item.label} className={`flex items-center gap-3 rounded-lg p-3 ${item.done ? "text-muted-foreground/50" : "text-foreground"}`}>
                            <CheckCircle2 className={`h-5 w-5 shrink-0 ${item.done ? "text-primary" : "text-border"}`} />
                            <span className={`body-small ${item.done ? "line-through" : ""}`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Mentor Highlights */}
                <motion.div {...fade(7)}>
                  <Card variant="elevated" padding="lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Mentor Highlights</CardTitle>
                        <Link to="/mentors">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1">
                            Browse <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mentorHighlights.map((mentor) => (
                        <div key={mentor.name} className="rounded-xl bg-secondary/40 p-4">
                          <p className="ui-base font-medium text-foreground">{mentor.name}</p>
                          <p className="body-small text-muted-foreground mt-1">{mentor.expertise}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 text-accent fill-accent" />{mentor.rating}
                            </div>
                            <span className="ui-xs text-muted-foreground">{mentor.sessions} sessions</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Upcoming Events */}
                <motion.div {...fade(8)}>
                  <Card variant="elevated" padding="lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.title} className="rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:bg-secondary/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary" className="text-xs font-normal">{event.type}</Badge>
                          </div>
                          <p className="ui-base font-medium text-foreground">{event.title}</p>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.date}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendees}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
