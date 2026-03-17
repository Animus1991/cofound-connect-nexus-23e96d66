import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ChevronRight,
  Flag,
  Rocket,
} from "lucide-react";
import { motion } from "framer-motion";

interface Milestone {
  id: number;
  title: string;
  category: "Product" | "Business" | "Team" | "Fundraising";
  status: "completed" | "in-progress" | "upcoming" | "at-risk";
  targetDate: string;
  notes: string;
  progress: number;
}

const mockMilestones: Milestone[] = [
  { id: 1, title: "Complete MVP development", category: "Product", status: "completed", targetDate: "Feb 28, 2026", notes: "Core features shipped and deployed", progress: 100 },
  { id: 2, title: "Launch beta program", category: "Product", status: "in-progress", targetDate: "Mar 15, 2026", notes: "50 beta users onboarded, collecting feedback", progress: 65 },
  { id: 3, title: "Secure pre-seed funding", category: "Fundraising", status: "in-progress", targetDate: "Apr 1, 2026", notes: "3 investor meetings scheduled, deck finalized", progress: 40 },
  { id: 4, title: "Hire first engineer", category: "Team", status: "at-risk", targetDate: "Mar 20, 2026", notes: "2 candidates in pipeline, need to accelerate", progress: 25 },
  { id: 5, title: "Reach 100 active users", category: "Business", status: "upcoming", targetDate: "May 1, 2026", notes: "Pending beta launch results", progress: 0 },
  { id: 6, title: "Launch referral program", category: "Business", status: "upcoming", targetDate: "May 15, 2026", notes: "Design phase not started yet", progress: 0 },
  { id: 7, title: "First paying customer", category: "Business", status: "upcoming", targetDate: "Jun 1, 2026", notes: "Depends on beta feedback and pricing strategy", progress: 0 },
];

const statusConfig = {
  completed: { label: "Completed", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  "in-progress": { label: "In Progress", icon: Clock, color: "text-accent", bg: "bg-accent/10" },
  upcoming: { label: "Upcoming", icon: Calendar, color: "text-muted-foreground", bg: "bg-secondary" },
  "at-risk": { label: "At Risk", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const categoryColors: Record<string, string> = {
  Product: "bg-primary/10 text-primary",
  Business: "bg-accent/10 text-accent",
  Team: "bg-secondary text-secondary-foreground",
  Fundraising: "bg-destructive/10 text-destructive",
};

export default function MilestonesPage() {
  const [milestones] = useState(mockMilestones);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all" ? milestones : milestones.filter(m => m.status === filterStatus);
  const completedCount = milestones.filter(m => m.status === "completed").length;
  const overallProgress = Math.round((completedCount / milestones.length) * 100);

  return (
    <AppLayout
      title="Milestones"
      headerActions={
        <Button variant="default" size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Milestone
        </Button>
      }
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Overview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-card-gradient p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" /> Venture Progress
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} of {milestones.length} milestones completed
              </p>
            </div>
            <div className="flex items-center gap-4">
              {Object.entries(statusConfig).map(([key, config]) => {
                const count = milestones.filter(m => m.status === key).length;
                return (
                  <div key={key} className="text-center">
                    <p className={`font-display text-lg font-bold ${config.color}`}>{count}</p>
                    <p className="text-[10px] text-muted-foreground">{config.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <Progress value={overallProgress} className="h-2 mt-4" />
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["all", ...Object.keys(statusConfig)].map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              className="text-xs h-8 capitalize"
              onClick={() => setFilterStatus(status)}
            >
              {status === "all" ? "All" : statusConfig[status as keyof typeof statusConfig].label}
            </Button>
          ))}
        </div>

        {/* Milestone List */}
        <div className="space-y-3">
          {filtered.map((milestone, i) => {
            const config = statusConfig[milestone.status];
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border/50 bg-card-gradient p-5 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                    <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-sm font-semibold text-foreground">{milestone.title}</h3>
                      <Badge className={`text-[10px] ${categoryColors[milestone.category]}`}>{milestone.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{milestone.notes}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Flag className="h-3 w-3" /> Target: {milestone.targetDate}
                      </span>
                      <Badge variant="secondary" className={`text-[10px] ${config.color}`}>
                        {config.label}
                      </Badge>
                    </div>
                    {milestone.status !== "upcoming" && milestone.status !== "completed" && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Progress</span>
                          <span className="text-[10px] font-medium text-foreground">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No milestones found</h3>
            <p className="text-sm text-muted-foreground">Try a different filter</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
