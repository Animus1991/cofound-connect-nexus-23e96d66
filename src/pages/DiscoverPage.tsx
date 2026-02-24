import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Search,
  Home,
  Users,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  MapPin,
  Clock,
  Star,
  Filter,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: 3 },
  { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
  { icon: Users, label: "My Network", path: "/network" },
  { icon: GraduationCap, label: "Learning", path: "/learning" },
];

const mockProfiles = [
  {
    id: 1,
    name: "Alex Chen",
    role: "Founder",
    headline: "Building AI-powered recruitment tools",
    skills: ["Machine Learning", "Python", "Product Strategy"],
    location: "San Francisco, CA",
    availability: "Full-time",
    matchScore: 92,
    stage: "MVP",
    lookingFor: "Technical Co-founder",
  },
  {
    id: 2,
    name: "Maria Santos",
    role: "Investor",
    headline: "Angel investor — Early-stage SaaS & fintech",
    skills: ["Due Diligence", "Fintech", "SaaS"],
    location: "London, UK",
    availability: "Part-time",
    matchScore: 87,
    stage: "Seed",
    lookingFor: "Deal flow",
  },
  {
    id: 3,
    name: "Dimitris Papadopoulos",
    role: "Professional",
    headline: "Full-stack engineer — React, Node, PostgreSQL",
    skills: ["React", "TypeScript", "Node.js"],
    location: "Athens, Greece",
    availability: "20h/week",
    matchScore: 85,
    stage: "Any",
    lookingFor: "Equity-based role",
  },
  {
    id: 4,
    name: "Sarah Kim",
    role: "Mentor",
    headline: "Ex-Google PM — 15y product & growth experience",
    skills: ["Product Management", "Growth", "Strategy"],
    location: "Remote",
    availability: "5h/week",
    matchScore: 79,
    stage: "Any",
    lookingFor: "Mentoring sessions",
  },
  {
    id: 5,
    name: "James Okafor",
    role: "Founder",
    headline: "Climate-tech startup — Carbon tracking for SMBs",
    skills: ["Sustainability", "Business Dev", "Operations"],
    location: "Lagos, Nigeria",
    availability: "Full-time",
    matchScore: 76,
    stage: "Pre-seed",
    lookingFor: "CTO Co-founder",
  },
  {
    id: 6,
    name: "Lena Müller",
    role: "Professional",
    headline: "Brand designer — Helping startups stand out",
    skills: ["Brand Design", "UI/UX", "Figma"],
    location: "Berlin, Germany",
    availability: "Freelance",
    matchScore: 73,
    stage: "Any",
    lookingFor: "Startup projects",
  },
];

const roleColor: Record<string, string> = {
  Founder: "bg-accent/20 text-accent",
  Investor: "bg-primary/20 text-primary",
  Professional: "bg-secondary text-secondary-foreground",
  Mentor: "bg-primary/10 text-primary",
};

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
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

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-xl font-bold text-foreground">
                Discover
              </h1>
            </div>
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
          {/* Search & Filters */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row">
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
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3.5 w-3.5" />
                Filters
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm">
                Role
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              <Button variant="outline" size="sm">
                Stage
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              <Button variant="outline" size="sm">
                Location
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mockProfiles.map((profile) => (
              <div
                key={profile.id}
                className="group rounded-2xl border border-border/50 bg-card-gradient p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-glow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-sm font-semibold text-primary">
                        {profile.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        {profile.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${roleColor[profile.role] || ""}`}
                      >
                        {profile.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {profile.matchScore}%
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {profile.headline}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {profile.availability}
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Looking for: </span>
                  <span className="font-medium text-foreground">
                    {profile.lookingFor}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="default" size="sm" className="flex-1 text-xs">
                    Request Intro
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
