import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Filter,
  ChevronDown,
} from "lucide-react";

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

  return (
    <AppLayout title="Discover">
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
    </AppLayout>
  );
}
