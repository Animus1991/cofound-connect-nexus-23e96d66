import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Zap,
} from "lucide-react";

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
  return (
    <AppLayout title="Dashboard">
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
            <Link to="/profile">
              <Button variant="hero-outline" size="sm">
                Complete Profile
              </Button>
            </Link>
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
    </AppLayout>
  );
}
