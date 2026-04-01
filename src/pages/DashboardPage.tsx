import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { StatSkeleton, CardSkeleton, ListItemSkeleton } from "@/components/SkeletonLoaders";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { motion } from "framer-motion";

const recentMatches = [
  { name: "Alex Chen", role: "Founder", score: 92, skills: ["AI/ML", "Python"], online: true },
  { name: "Maria Santos", role: "Investor", score: 87, skills: ["Fintech", "SaaS"], online: true },
  { name: "Dimitris P.", role: "Developer", score: 85, skills: ["React", "Node.js"], online: false },
  { name: "Lena Müller", role: "Designer", score: 81, skills: ["UI/UX", "Figma"], online: false },
];

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
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [savedMatches, setSavedMatches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ connections: 0, pendingRequests: 0, suggestions: 0 });
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const completedTodos = todoItems.filter((t) => t.done).length;

  useNotifications();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const loadStats = useCallback(async () => {
    try {
      const [connsRes, reqsRes, suggestedRes, activityRes] = await Promise.allSettled([
        api.connections.list(),
        api.connections.getRequests(),
        api.connections.getSuggested(),
        api.activity.list(5),
      ]);
      setStats({
        connections: connsRes.status === "fulfilled" ? connsRes.value.connections.length : 0,
        pendingRequests: reqsRes.status === "fulfilled" ? reqsRes.value.incoming.length : 0,
        suggestions: suggestedRes.status === "fulfilled" ? suggestedRes.value.suggested.length : 0,
      });
      if (activityRes.status === "fulfilled") {
        setActivityItems(activityRes.value.activity);
      }
    } catch {
      // keep zeros — mock values used in display fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadStats();
    else if (!authLoading) setIsLoading(false);
  }, [isAuthenticated, authLoading, loadStats]);

  const displayName = user?.name?.split(" ")[0] ?? "there";

  const toggleSave = (name: string) => {
    setSavedMatches((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
        {isLoading ? (
          <>
            <CardSkeleton />
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5"><ListItemSkeleton count={4} /></div>
              <div className="rounded-xl border border-border bg-card p-5"><ListItemSkeleton count={5} /></div>
            </div>
          </>
        ) : (
          <>
            {/* Welcome */}
            <motion.div {...fade(0)} className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                    Welcome back, {displayName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have{" "}
                    <span className="text-primary font-medium">{stats.suggestions} suggested matches</span> and{" "}
                    <span className="font-medium text-foreground">{stats.pendingRequests} pending intro request{stats.pendingRequests !== 1 ? "s" : ""}.</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/discover">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Search className="h-3.5 w-3.5" /> Find Co-founders
                    </Button>
                  </Link>
                  <Link to="/opportunities">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Rocket className="h-3.5 w-3.5" /> Post Opportunity
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Profile Views", value: "—", change: "Coming soon", icon: TrendingUp },
                { label: "Matches", value: String(stats.suggestions), change: `${stats.suggestions} suggested`, icon: Zap },
                { label: "Intro Requests", value: String(stats.pendingRequests), change: stats.pendingRequests > 0 ? `${stats.pendingRequests} pending` : "None pending", icon: ArrowUpRight },
                { label: "Connections", value: String(stats.connections), change: stats.connections > 0 ? `${stats.connections} total` : "Start connecting", icon: Users },
              ].map((stat, i) => (
                <motion.div key={stat.label} {...fade(i + 1)} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{stat.change}</span>
                  </div>
                  <p className="font-display text-xl font-semibold text-foreground tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Matches + Checklist */}
            <div className="grid gap-5 lg:grid-cols-3">
              <motion.div {...fade(5)} className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground">Top Matches</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">People most compatible with your profile</p>
                  </div>
                  <Link to="/discover">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary h-7">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {recentMatches.map((match) => (
                    <div key={match.name} className="flex items-center justify-between rounded-lg bg-secondary/40 p-3 transition-colors hover:bg-secondary/60">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-xs font-medium text-primary">{match.name.split(" ").map((n) => n[0]).join("")}</span>
                          </div>
                          {match.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{match.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-muted-foreground">{match.role}</span>
                            <div className="flex gap-1">
                              {match.skills.map((s) => (
                                <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); toggleSave(match.name); }} className="text-muted-foreground hover:text-primary transition-colors">
                          <Star className={`h-4 w-4 ${savedMatches.includes(match.name) ? "fill-primary text-primary" : ""}`} />
                        </button>
                        <span className="text-xs font-semibold text-primary tabular-nums bg-primary/10 px-2 py-0.5 rounded-full">{match.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div {...fade(6)} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-sm font-semibold text-foreground">Getting Started</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">{completedTodos}/{todoItems.length}</span>
                </div>
                <Progress value={(completedTodos / todoItems.length) * 100} className="h-1.5 mb-4" />
                <div className="space-y-1">
                  {todoItems.map((item) => (
                    <div key={item.label} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${item.done ? "text-muted-foreground/50" : "text-foreground"}`}>
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.done ? "text-primary" : "text-border"}`} />
                      <span className={item.done ? "line-through" : ""}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Activity + Mentors + Events */}
            <div className="grid gap-5 lg:grid-cols-3">
              <motion.div {...fade(7)} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
                <div className="space-y-2.5">
                  {activityItems.length > 0 ? activityItems.map((item) => {
                    const Icon = ACTION_ICONS[item.action] ?? Zap;
                    return (
                      <div key={item.id} className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{relativeTime(item.createdAt)}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-muted-foreground py-3 text-center">No recent activity yet. Start connecting!</p>
                  )}
                </div>
              </motion.div>

              <motion.div {...fade(8)} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-sm font-semibold text-foreground">Mentor Highlights</h3>
                  <Link to="/mentors">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary h-7">
                      Browse <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {mentorHighlights.map((mentor) => (
                    <div key={mentor.name} className="rounded-lg bg-secondary/40 p-3.5">
                      <p className="text-sm font-medium text-foreground">{mentor.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mentor.expertise}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-accent fill-accent" />{mentor.rating}</span>
                        <span>{mentor.sessions} sessions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div {...fade(9)} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Upcoming Events</h3>
                <div className="space-y-2.5">
                  {upcomingEvents.map((event) => (
                    <div key={event.title} className="rounded-lg border border-border bg-secondary/20 p-3.5 transition-colors hover:bg-secondary/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant="secondary" className="text-[10px] font-normal">{event.type}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.date}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendees}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
