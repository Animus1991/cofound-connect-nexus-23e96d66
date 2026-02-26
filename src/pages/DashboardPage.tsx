import { MobileHeader, MobileBottomNav } from "@/components/MobileNav";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Home,
  Search,
  MessageSquare,
  Briefcase,
  Users,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Zap,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Users, label: "My Network", path: "/network" },
  { icon: GraduationCap, label: "Learning", path: "/learning" },
];

const recentMatches = [
  { name: "Alex Chen", role: "Founder", score: 92 },
  { name: "Maria Santos", role: "Investor", score: 87 },
  { name: "Dimitris P.", role: "Developer", score: 85 },
];

const upcomingEvents = [
  { title: "AI Founders Meetup", date: "Mar 2, 2026", type: "Online" },
  { title: "Pitch Night Athens", date: "Mar 8, 2026", type: "In-person" },
];

export default function DashboardPage() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <MobileHeader />
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">
            CoFounderBay
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 space-y-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-14 pb-16 lg:pt-0 lg:pb-0">
        <header className="sticky top-14 lg:top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="font-display text-xl font-bold text-foreground">
              Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  5
                </span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">JD</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Welcome */}
          <div className="mb-8 rounded-2xl border border-primary/20 bg-card-gradient p-8">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Welcome back, Jane 👋
            </h2>
            <p className="mt-2 text-muted-foreground">
              You have 3 new matches and 2 pending intro requests.
            </p>
            <div className="mt-4 flex gap-3">
              <Link to="/discover">
                <Button variant="hero" size="sm" className="gap-2">
                  <Search className="h-3.5 w-3.5" />
                  Find Co-founders
                </Button>
              </Link>
              <Button variant="hero-outline" size="sm">
                Complete Profile
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            {[
              { label: "Profile Views", value: "128", change: "+12%", icon: TrendingUp },
              { label: "Matches", value: "24", change: "+3", icon: Zap },
              { label: "Intro Requests", value: "7", change: "+2", icon: ArrowUpRight },
              { label: "Connections", value: "42", change: "+5", icon: Users },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-card-gradient p-5"
              >
                <div className="flex items-center justify-between">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {stat.change}
                  </span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Matches */}
            <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                Recent Matches
              </h3>
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div
                    key={match.name}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-xs font-semibold text-primary">
                          {match.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {match.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.role}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {match.score}%
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/discover">
                <Button variant="ghost" size="sm" className="mt-3 w-full">
                  View All Matches
                </Button>
              </Link>
            </div>

            {/* Upcoming Events */}
            <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.title}
                    className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.date} · {event.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-3 w-full">
                Browse Events
              </Button>
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
