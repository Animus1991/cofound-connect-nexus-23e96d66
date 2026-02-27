import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Briefcase,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Handshake,
  FileText,
  ArrowRight,
  Filter,
  ChevronDown,
  Plus,
  Building2,
  Coins,
} from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  orgName: string;
  orgInitials: string;
  type: "cofounder" | "job" | "freelance";
  description: string;
  skills: string[];
  location: string;
  compensation: string;
  stage: string;
  posted: string;
  applicants: number;
}

interface Application {
  id: string;
  opportunityTitle: string;
  orgName: string;
  status: "pending" | "reviewing" | "accepted" | "rejected";
  appliedDate: string;
  message: string;
}

interface Proposal {
  id: string;
  fromName: string;
  fromInitials: string;
  fromRole: string;
  scope: string;
  timeframe: string;
  compensation: string;
  status: "pending" | "accepted" | "declined";
  date: string;
}

const mockOpportunities: Opportunity[] = [
  {
    id: "o1",
    title: "CTO & Technical Co-founder",
    orgName: "GreenTrack",
    orgInitials: "GT",
    type: "cofounder",
    description: "Looking for a technical co-founder to build our carbon tracking platform for SMBs. Must have experience with data pipelines and SaaS.",
    skills: ["Python", "React", "AWS", "Data Engineering"],
    location: "Remote (EU timezone)",
    compensation: "25% equity + small salary after seed",
    stage: "Pre-seed",
    posted: "2d ago",
    applicants: 8,
  },
  {
    id: "o2",
    title: "Growth Marketing Lead",
    orgName: "FinLit AI",
    orgInitials: "FL",
    type: "job",
    description: "Join our Series A fintech startup to lead growth marketing. You'll own user acquisition, content strategy, and paid channels.",
    skills: ["Growth Hacking", "SEO", "Paid Ads", "Analytics"],
    location: "London, UK (Hybrid)",
    compensation: "£65-80k + 0.5% equity",
    stage: "Series A",
    posted: "1d ago",
    applicants: 23,
  },
  {
    id: "o3",
    title: "Product Designer — Contract",
    orgName: "Nomad Spaces",
    orgInitials: "NS",
    type: "freelance",
    description: "3-month contract to redesign our marketplace UX. Looking for someone with marketplace/platform design experience.",
    skills: ["Figma", "UX Research", "Design Systems", "Prototyping"],
    location: "Remote",
    compensation: "€80-100/hour",
    stage: "MVP",
    posted: "5h ago",
    applicants: 5,
  },
  {
    id: "o4",
    title: "Full-stack Developer Co-founder",
    orgName: "EduFlow",
    orgInitials: "EF",
    type: "cofounder",
    description: "EdTech startup seeking a full-stack developer to co-found. We have paying beta users and need to scale the platform.",
    skills: ["TypeScript", "Next.js", "PostgreSQL", "System Design"],
    location: "Athens, Greece / Remote",
    compensation: "30% equity",
    stage: "MVP with revenue",
    posted: "3d ago",
    applicants: 12,
  },
  {
    id: "o5",
    title: "Backend Engineer",
    orgName: "DataPulse",
    orgInitials: "DP",
    type: "job",
    description: "Build scalable APIs and data infrastructure for our analytics platform. Strong experience with distributed systems required.",
    skills: ["Go", "Kubernetes", "PostgreSQL", "gRPC"],
    location: "Berlin, Germany",
    compensation: "€70-90k + equity",
    stage: "Seed",
    posted: "12h ago",
    applicants: 15,
  },
];

const mockApplications: Application[] = [
  {
    id: "a1",
    opportunityTitle: "Frontend Lead — HealthSync",
    orgName: "HealthSync",
    status: "reviewing",
    appliedDate: "3 days ago",
    message: "I have 6 years of React experience and led frontend at two health-tech startups.",
  },
  {
    id: "a2",
    opportunityTitle: "Product Advisor — AgroTech",
    orgName: "AgroTech",
    status: "accepted",
    appliedDate: "1 week ago",
    message: "Interested in offering advisory services based on my agri-tech background.",
  },
  {
    id: "a3",
    opportunityTitle: "Co-founder — AI Tutor",
    orgName: "AI Tutor",
    status: "pending",
    appliedDate: "1 day ago",
    message: "Your vision for AI in education aligns with my 10-year experience in edtech.",
  },
];

const mockProposals: Proposal[] = [
  {
    id: "p1",
    fromName: "Alex Chen",
    fromInitials: "AC",
    fromRole: "Founder",
    scope: "Co-develop an AI validation tool. You handle product & UX, I handle engineering.",
    timeframe: "6 months",
    compensation: "50/50 equity split",
    status: "pending",
    date: "1d ago",
  },
  {
    id: "p2",
    fromName: "Maria Santos",
    fromInitials: "MS",
    fromRole: "Investor",
    scope: "€50k angel investment in exchange for advisory role and board observer seat.",
    timeframe: "Ongoing",
    compensation: "5% equity",
    status: "pending",
    date: "3d ago",
  },
];

const typeConfig: Record<string, { label: string; className: string; icon: typeof Briefcase }> = {
  cofounder: { label: "Co-founder", className: "bg-accent/20 text-accent", icon: Handshake },
  job: { label: "Job", className: "bg-primary/20 text-primary", icon: Building2 },
  freelance: { label: "Freelance", className: "bg-secondary text-secondary-foreground", icon: FileText },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  reviewing: { label: "Under Review", className: "bg-accent/20 text-accent" },
  accepted: { label: "Accepted", className: "bg-primary/20 text-primary" },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },
  declined: { label: "Declined", className: "bg-muted text-muted-foreground" },
};

export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState("listings");
  const [searchQuery, setSearchQuery] = useState("");
  const [proposals, setProposals] = useState(mockProposals);

  const filteredOpportunities = mockOpportunities.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAcceptProposal = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "accepted" as const } : p))
    );
  };

  const handleDeclineProposal = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "declined" as const } : p))
    );
  };

  return (
    <AppLayout
      title="Opportunities"
      headerActions={
        <Button variant="hero" size="sm" className="gap-2 hidden sm:flex">
          <Plus className="h-3.5 w-3.5" />
          Post Opportunity
        </Button>
      }
    >
      <div className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="listings" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              My Applications
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-1.5 relative">
              <Handshake className="h-3.5 w-3.5" />
              Proposals
              {proposals.filter((p) => p.status === "pending").length > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                  {proposals.filter((p) => p.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Listings */}
          <TabsContent value="listings">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search roles, skills, companies..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  Type <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                <Button variant="outline" size="sm">
                  Stage <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredOpportunities.map((opp) => {
                const config = typeConfig[opp.type];
                return (
                  <div
                    key={opp.id}
                    className="group rounded-2xl border border-border/50 bg-card-gradient p-5 sm:p-6 transition-all hover:border-primary/30 hover:shadow-glow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                          <span className="text-sm font-bold text-primary">
                            {opp.orgInitials}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold text-foreground">
                            {opp.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">
                              {opp.orgName}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${config.className}`}
                            >
                              <config.icon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {opp.stage}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {opp.posted}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {opp.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {opp.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {opp.compensation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {opp.applicants} applicants
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="default" size="sm" className="gap-1.5 text-xs">
                        Apply Now
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        Save
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications">
            <div className="space-y-4">
              {mockApplications.map((app) => {
                const status = statusConfig[app.status];
                return (
                  <div
                    key={app.id}
                    className="rounded-2xl border border-border/50 bg-card-gradient p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {app.opportunityTitle}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {app.orgName}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] shrink-0 ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-foreground/80">
                      {app.message}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Applied {app.appliedDate}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Proposals */}
          <TabsContent value="proposals">
            <div className="space-y-4">
              {proposals.map((prop) => {
                const status = statusConfig[prop.status];
                return (
                  <div
                    key={prop.id}
                    className="rounded-2xl border border-border/50 bg-card-gradient p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-xs font-semibold text-primary">
                          {prop.fromInitials}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {prop.fromName}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {prop.fromRole}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {prop.date}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                          {prop.scope}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {prop.timeframe}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {prop.compensation}
                          </span>
                        </div>
                        {prop.status === "pending" ? (
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="hero"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => handleAcceptProposal(prop.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => handleDeclineProposal(prop.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={`mt-3 ${status.className}`}
                          >
                            {status.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
