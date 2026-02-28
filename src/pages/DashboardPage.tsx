import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
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
  ChevronRight,
  Bookmark,
  Target,
  Rocket,
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

const activityFeed = [
  { type: "match", text: "New match with Alex Chen (92% compatibility)", time: "10m ago", icon: Zap },
  { type: "view", text: "Your profile was viewed 12 times today", time: "1h ago", icon: Eye },
  { type: "intro", text: "Elena V. sent you an intro request", time: "2h ago", icon: MessageSquare },
  { type: "saved", text: "James Okafor saved your profile", time: "5h ago", icon: Bookmark },
  { type: "milestone", text: "You reached 100+ profile views!", time: "1d ago", icon: Flame },
];

const quickActions = [
  { label: "Find Co-founders", icon: Search, path: "/discover", variant: "hero" as const },
  { label: "Post Opportunity", icon: Rocket, path: "/opportunities", variant: "hero-outline" as const },
  { label: "View Messages", icon: MessageSquare, path: "/messages", variant: "outline" as const },
  { label: "Complete Profile", icon: Target, path: "/profile", variant: "outline" as const },
];

const todoItems = [
  { label: "Add 3 more skills to your profile", done: true },
  { label: "Upload a profile photo", done: false },
  { label: "Connect your LinkedIn account", done: true },
  { label: "Set your co-founder preferences", done: false },
  { label: "Send your first intro request", done: false },
];

export default function DashboardPage() {
  const [savedMatches, setSavedMatches] = useState<string[]>([]);
  const completedTodos = todoItems.filter((t) => t.done).length;

  const toggleSave = (name: string) => {
    setSavedMatches((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-card-gradient p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Welcome back, Jane 👋
              </h2>
              <p className="mt-1 text-muted-foreground">
                You have <span className="text-primary font-medium">3 new matches</span> and{" "}
                <span className="text-accent font-medium">2 pending intro requests</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.slice(0, 2).map((action) => (
                <Link key={action.path} to={action.path}>
                  <Button variant={action.variant} size="sm" className="gap-2">
                    <action.icon className="h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Profile Views", value: "128", change: "+12%", icon: TrendingUp, trend: "up" },
            { label: "Matches", value: "24", change: "+3 this week", icon: Zap, trend: "up" },
            { label: "Intro Requests", value: "7", change: "+2 pending", icon: ArrowUpRight, trend: "up" },
            { label: "Connections", value: "42", change: "+5 this month", icon: Users, trend: "up" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card-gradient p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                  {stat.change}
                </Badge>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Onboarding Checklist */}
        <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Getting Started
            </h3>
            <span className="text-xs text-muted-foreground">
              {completedTodos}/{todoItems.length} completed
            </span>
          </div>
          <Progress value={(completedTodos / todoItems.length) * 100} className="h-2 mb-4" />
          <div className="space-y-2">
            {todoItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  item.done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 ${item.done ? "text-primary" : "text-border"}`}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Matches */}
          <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-foreground">
                Top Matches
              </h3>
              <Link to="/discover">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <div
                  key={match.name}
                  className="flex items-center justify-between rounded-lg bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-xs font-semibold text-primary">
                          {match.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      {match.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{match.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{match.role}</span>
                        <div className="flex gap-1">
                          {match.skills.slice(0, 2).map((s) => (
                            <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSave(match.name)}
                      className="text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Star className={`h-4 w-4 ${savedMatches.includes(match.name) ? "fill-accent text-accent" : ""}`} />
                    </button>
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                      <span className="text-xs font-semibold text-primary">{match.score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {activityFeed.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <activity.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-[11px] text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Upcoming Events
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Browse All <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.title}
                className="rounded-xl border border-border/30 bg-secondary/20 p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{event.type}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.attendees}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 text-xs h-8">
                  RSVP
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
