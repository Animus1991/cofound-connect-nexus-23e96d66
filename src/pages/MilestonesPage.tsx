import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type MilestoneStatus = "completed" | "in-progress" | "upcoming" | "at-risk";
type MilestoneCategory = "Product" | "Business" | "Team" | "Fundraising" | "Marketing" | "Legal";

interface Milestone {
  id: string;
  title: string;
  category: MilestoneCategory;
  status: MilestoneStatus;
  targetDate: string | null;
  notes: string | null;
  progress: number;
  sortOrder: number;
  createdAt: string;
}

const statusConfig: Record<MilestoneStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
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
  Marketing: "bg-blue-500/10 text-blue-600",
  Legal: "bg-orange-500/10 text-orange-600",
};

const CATEGORIES: MilestoneCategory[] = ["Product", "Business", "Team", "Fundraising", "Marketing", "Legal"];

const FALLBACK_MILESTONES: Milestone[] = [
  { id: "f1", title: "Complete MVP development", category: "Product", status: "completed", targetDate: "2026-02-28", notes: "Core features shipped and deployed", progress: 100, sortOrder: 0, createdAt: new Date().toISOString() },
  { id: "f2", title: "Launch beta program", category: "Product", status: "in-progress", targetDate: "2026-03-15", notes: "50 beta users onboarded, collecting feedback", progress: 65, sortOrder: 1, createdAt: new Date().toISOString() },
  { id: "f3", title: "Secure pre-seed funding", category: "Fundraising", status: "in-progress", targetDate: "2026-04-01", notes: "3 investor meetings scheduled, deck finalized", progress: 40, sortOrder: 2, createdAt: new Date().toISOString() },
  { id: "f4", title: "Hire first engineer", category: "Team", status: "at-risk", targetDate: "2026-03-20", notes: "2 candidates in pipeline, need to accelerate", progress: 25, sortOrder: 3, createdAt: new Date().toISOString() },
  { id: "f5", title: "Reach 100 active users", category: "Business", status: "upcoming", targetDate: "2026-05-01", notes: "Pending beta launch results", progress: 0, sortOrder: 4, createdAt: new Date().toISOString() },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return dateStr; }
}

export default function MilestonesPage() {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<MilestoneCategory>("Product");
  const [formStatus, setFormStatus] = useState<MilestoneStatus>("upcoming");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formProgress, setFormProgress] = useState(0);

  const loadMilestones = useCallback(async () => {
    try {
      const res = await api.milestones.list();
      setMilestones(res.milestones.length > 0 ? (res.milestones as Milestone[]) : FALLBACK_MILESTONES);
    } catch {
      setMilestones(FALLBACK_MILESTONES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  const openCreate = () => {
    setEditingId(null);
    setFormTitle(""); setFormCategory("Product"); setFormStatus("upcoming");
    setFormDate(""); setFormNotes(""); setFormProgress(0);
    setShowModal(true);
  };

  const openEdit = (m: Milestone) => {
    setEditingId(m.id);
    setFormTitle(m.title); setFormCategory(m.category); setFormStatus(m.status);
    setFormDate(m.targetDate ?? ""); setFormNotes(m.notes ?? ""); setFormProgress(m.progress);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    setIsSaving(true);
    try {
      const body = { title: formTitle.trim(), category: formCategory, status: formStatus, targetDate: formDate || undefined, notes: formNotes || undefined, progress: formProgress };
      if (editingId) {
        await api.milestones.update(editingId, body);
        toast({ title: "Milestone updated" });
      } else {
        await api.milestones.create(body);
        toast({ title: "Milestone created" });
      }
      setShowModal(false);
      loadMilestones();
    } catch {
      toast({ title: "Failed to save milestone", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.milestones.delete(id);
      setMilestones(prev => prev.filter(m => m.id !== id));
      toast({ title: "Milestone deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleStatusToggle = async (m: Milestone) => {
    const next = m.status === "completed" ? "upcoming" : "completed";
    const nextProgress = next === "completed" ? 100 : m.progress;
    try {
      await api.milestones.update(m.id, { status: next, progress: nextProgress });
      setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, status: next, progress: nextProgress } : x));
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const filtered = filterStatus === "all" ? milestones : milestones.filter(m => m.status === filterStatus);
  const completedCount = milestones.filter(m => m.status === "completed").length;
  const overallProgress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <AppLayout
      title="Milestones"
      headerActions={
        <Button variant="default" size="sm" className="gap-1.5 text-xs" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add Milestone
        </Button>
      }
    >
      <div className="px-2 py-3 space-y-4">
        {/* Overview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-card-gradient p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" /> Venture Progress
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedCount} of {milestones.length} milestones completed
              </p>
            </div>
            <div className="flex items-center gap-5">
              {(Object.entries(statusConfig) as [MilestoneStatus, typeof statusConfig[MilestoneStatus]][]).map(([key, config]) => {
                const count = milestones.filter(m => m.status === key).length;
                return (
                  <div key={key} className="text-center cursor-pointer" onClick={() => setFilterStatus(key === filterStatus ? "all" : key)}>
                    <p className={`font-display text-xl font-bold tabular-nums ${config.color}`}>{count}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{config.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">Overall progress</span>
              <span className="text-[11px] font-semibold text-foreground tabular-nums">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", ...Object.keys(statusConfig)] as (string)[]).map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              className="text-xs h-8 capitalize"
              onClick={() => setFilterStatus(status)}
            >
              {status === "all" ? "All" : statusConfig[status as MilestoneStatus].label}
            </Button>
          ))}
        </div>

        {/* Milestone List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={filterStatus} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
              {filtered.map((milestone, i) => {
                const config = statusConfig[milestone.status];
                const StatusIcon = config.icon;
                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-all duration-200 p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <button
                        onClick={() => handleStatusToggle(milestone)}
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:opacity-80 ${config.bg}`}
                        title="Toggle completion"
                      >
                        <StatusIcon className={`h-4.5 w-4.5 ${config.color}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className={`font-display text-sm font-semibold leading-tight ${milestone.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {milestone.title}
                          </h3>
                          <Badge className={`text-[10px] shrink-0 ${categoryColors[milestone.category] ?? "bg-secondary text-secondary-foreground"}`}>
                            {milestone.category}
                          </Badge>
                        </div>
                        {milestone.notes && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{milestone.notes}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          {milestone.targetDate && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Flag className="h-3 w-3" /> {formatDate(milestone.targetDate)}
                            </span>
                          )}
                          <Badge variant="secondary" className={`text-[10px] ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                        {milestone.status !== "upcoming" && milestone.status !== "completed" && milestone.progress > 0 && (
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-muted-foreground">Progress</span>
                              <span className="text-[10px] font-medium text-foreground tabular-nums">{milestone.progress}%</span>
                            </div>
                            <Progress value={milestone.progress} className="h-1.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(milestone)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(milestone.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border">
            <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-display text-base font-semibold text-foreground mb-1">No milestones here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filterStatus === "all" ? "Add your first milestone to start tracking progress." : "Try a different filter."}
            </p>
            {filterStatus === "all" && (
              <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add First Milestone
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-base font-semibold text-foreground">
                  {editingId ? "Edit Milestone" : "New Milestone"}
                </h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title *</Label>
                  <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Launch beta program" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Select value={formCategory} onValueChange={v => setFormCategory(v as MilestoneCategory)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={formStatus} onValueChange={v => setFormStatus(v as MilestoneStatus)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusConfig) as MilestoneStatus[]).map(s => (
                          <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Target Date</Label>
                  <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center justify-between">
                    <span>Progress</span>
                    <span className="font-medium text-foreground tabular-nums">{formProgress}%</span>
                  </Label>
                  <input
                    type="range" min={0} max={100} value={formProgress}
                    onChange={e => setFormProgress(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Optional notes..." rows={2} className="resize-none" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button className="flex-1 gap-1.5" onClick={handleSave} disabled={isSaving || !formTitle.trim()}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editingId ? "Save Changes" : "Create Milestone"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
