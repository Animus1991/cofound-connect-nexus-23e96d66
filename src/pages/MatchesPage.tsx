import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  MapPin,
  Briefcase,
  Zap,
  Users,
  TrendingUp,
  Target,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  X,
  Star,
  Brain,
  Globe,
  Clock,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface MatchItem {
  userId: string;
  name: string;
  headline: string | null;
  location: string | null;
  role: string | null;
  stage: string | null;
  commitment: string | null;
  skills: string[];
  score: number;
  dimensions: Record<string, number>;
  sharedStrengths: string[];
  complementaryStrengths: string[];
  mismatches: string[];
}

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage",
  mvp: "Building MVP",
  traction: "Early Traction",
  growth: "Growth",
  scale: "Scaling",
  seed: "Seed",
};

const COMMITMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  flexible: "Flexible",
  weekends: "Weekends",
};

const DIMENSION_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  skills: { label: "Skills", icon: Zap },
  role: { label: "Role Fit", icon: Target },
  industry: { label: "Industry", icon: Briefcase },
  stage: { label: "Stage", icon: TrendingUp },
  commitment: { label: "Commitment", icon: Clock },
  location: { label: "Location", icon: Globe },
  workStyle: { label: "Work Style", icon: Brain },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 65 ? "#3b82f6" : score >= 50 ? "#f59e0b" : "#6b7280";
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle
          cx="32" cy="32" r="28" fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${(score / 100) * 175.9} 175.9`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-[9px] text-muted-foreground mt-0.5">match</span>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  onConnect,
  isConnecting,
  connected,
}: {
  match: MatchItem;
  onConnect: (match: MatchItem) => void;
  isConnecting: boolean;
  connected: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = match.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card variant="elevated" padding="lg" className="hover-lift">
        <CardContent className="p-0">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="heading-5 text-foreground group-hover:text-primary transition-colors">{match.name}</h3>
                  {match.headline && (
                    <p className="body-small text-muted-foreground line-clamp-2">{match.headline}</p>
                  )}
                </div>
                <ScoreRing score={match.score} />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {match.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />{match.location}
                  </span>
                )}
                {match.stage && (
                  <Badge variant="secondary" className="text-xs py-1 px-2 bg-secondary/50 text-foreground/80">
                    {STAGE_LABELS[match.stage] ?? match.stage}
                  </Badge>
                )}
                {match.commitment && (
                  <Badge variant="secondary" className="text-xs py-1 px-2 bg-secondary/50 text-foreground/80">
                    {COMMITMENT_LABELS[match.commitment] ?? match.commitment}
                  </Badge>
                )}
              </div>

              {/* Skills preview */}
              {match.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {match.skills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                      {skill}
                    </Badge>
                  ))}
                  {match.skills.length > 5 && (
                    <span className="text-xs text-muted-foreground/70">+{match.skills.length - 5} more</span>
                  )}
                </div>
              )}

              {/* Explanation */}
              {match.sharedStrengths.length > 0 && (
                <p className="body-xs text-muted-foreground mt-3 italic line-clamp-2">
                  Shared strengths: {match.sharedStrengths.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Dimension bars */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
                  {Object.entries(match.dimensions).map(([key, val]) => {
                    const meta = DIMENSION_LABELS[key];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const col = val >= 75 ? "bg-emerald-500" : val >= 55 ? "bg-blue-500" : val >= 35 ? "bg-amber-500" : "bg-red-500";
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 ui-small text-muted-foreground">
                            <Icon className="w-3 h-3" />{meta.label}
                          </span>
                          <span className="ui-small text-foreground/80 font-medium">{val}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className={`h-full rounded-full ${col}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(match.sharedStrengths.length > 0 || match.complementaryStrengths.length > 0 || match.mismatches.length > 0) && (
                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
                    {match.sharedStrengths.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/80">Shared: {match.sharedStrengths.join(", ")}</span>
                      </div>
                    )}
                    {match.complementaryStrengths.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <Star className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/80">They bring: {match.complementaryStrengths.join(", ")}</span>
                      </div>
                    )}
                    {match.mismatches.map((m, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="ui-small text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {expanded ? "Hide breakdown" : "Show breakdown"}
                <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
              <Link
                to={`/matches/${match.userId}`}
                className="ui-small text-primary hover:text-primary/80 transition-colors"
              >
                View profile →
              </Link>
            </div>
            {connected ? (
              <span className="flex items-center gap-1.5 ui-small text-emerald-500">
                <CheckCircle2 className="w-4 h-4" /> Request sent
              </span>
            ) : (
              <Button
                size="sm"
                onClick={() => onConnect(match)}
                disabled={isConnecting}
                className="h-8 px-4 ui-small bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />}
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [commitmentFilter, setCommitmentFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [page] = useState(1);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  // Connect modal
  const [connectTarget, setConnectTarget] = useState<MatchItem | null>(null);
  const [connectNote, setConnectNote] = useState("");
  const [sendingConnect, setSendingConnect] = useState(false);

  // Prefs modal
  const [showPrefs, setShowPrefs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.matches.list({
        page,
        limit: 20,
        stage: stageFilter === "all" ? undefined : stageFilter,
        commitment: commitmentFilter === "all" ? undefined : commitmentFilter,
      });
      setMatches(res.matches as MatchItem[]);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [page, stageFilter, commitmentFilter, minScore]);

  useEffect(() => { load(); }, [load]);

  const handleConnect = (match: MatchItem) => {
    setConnectTarget(match);
    setConnectNote("");
  };

  const sendConnect = async () => {
    if (!connectTarget) return;
    setSendingConnect(true);
    try {
      await api.connections.requestConnection(connectTarget.userId, connectNote || undefined);
      setConnectedIds((prev) => new Set([...prev, connectTarget.userId]));
      setConnectTarget(null);
      toast.success(`Connection request sent to ${connectTarget.name}`);
    } catch (err: unknown) {
      const e = err as { error?: string };
      if (e.error?.includes("already")) {
        setConnectedIds((prev) => new Set([...prev, connectTarget.userId]));
        setConnectTarget(null);
      } else {
        toast.error(e.error ?? "Failed to send request");
      }
    } finally {
      setSendingConnect(false);
    }
  };

  const excellentCount = matches.filter((m) => m.score >= 80).length;
  const goodCount = matches.filter((m) => m.score >= 65 && m.score < 80).length;

  return (
    <AppLayout title="Matches">
      <div className="flex h-full">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block w-80 border-r border-border bg-card/50 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="heading-5 text-foreground mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" /> Filters
              </h3>
              
              {/* Stage Filter */}
              <div className="space-y-2">
                <Label className="ui-base font-medium">Stage</Label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Stage</SelectItem>
                    <SelectItem value="idea">Idea Stage</SelectItem>
                    <SelectItem value="mvp">Building MVP</SelectItem>
                    <SelectItem value="traction">Early Traction</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commitment Filter */}
              <div className="space-y-2">
                <Label className="ui-base font-medium">Commitment</Label>
                <Select value={commitmentFilter} onValueChange={setCommitmentFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any Commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Commitment</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Score Filter */}
              <div className="space-y-2">
                <Label className="ui-base font-medium">Min Match Score</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={minScore || ""}
                    onChange={(e) => setMinScore(parseInt(e.target.value || "0", 10))}
                    placeholder="0"
                    className="flex-1"
                  />
                  <span className="ui-small text-muted-foreground">%</span>
                </div>
              </div>

              {/* Clear Filters */}
              {(stageFilter !== "all" || commitmentFilter !== "all" || minScore > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStageFilter("all"); setCommitmentFilter("all"); setMinScore(0); }}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" /> Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="heading-1 text-foreground flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                  Match Discovery
                </h1>
                <p className="body-base text-muted-foreground mt-2 leading-relaxed">
                  Explainable compatibility scores — find your ideal co-founder or collaborator.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPrefs(true)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Preferences
                </Button>
                <Button
                  variant="outline"
                  onClick={load}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            {!loading && total > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <Card variant="elevated" padding="lg">
                  <CardContent className="p-0 text-center">
                    <div className="heading-2 text-foreground">{total}</div>
                    <div className="ui-small text-muted-foreground mt-1">Potential Matches</div>
                  </CardContent>
                </Card>
                <Card variant="elevated" padding="lg">
                  <CardContent className="p-0 text-center">
                    <div className="heading-2 text-emerald-500">{excellentCount}</div>
                    <div className="ui-small text-muted-foreground mt-1">Excellent Fits (80+)</div>
                  </CardContent>
                </Card>
                <Card variant="elevated" padding="lg">
                  <CardContent className="p-0 text-center">
                    <div className="heading-2 text-blue-400">{goodCount}</div>
                    <div className="ui-small text-muted-foreground mt-1">Good Fits (65–79)</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mobile Filters */}
            <div className="lg:hidden">
              <Card variant="elevated" padding="lg">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                    Filters
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Stage</SelectItem>
                        <SelectItem value="idea">Idea Stage</SelectItem>
                        <SelectItem value="mvp">Building MVP</SelectItem>
                        <SelectItem value="traction">Early Traction</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="scale">Scaling</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={commitmentFilter} onValueChange={setCommitmentFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any Commitment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Commitment</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <span className="ui-small text-muted-foreground">Min score</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={minScore || ""}
                        onChange={(e) => setMinScore(parseInt(e.target.value || "0", 10))}
                        placeholder="0"
                        className="w-20"
                      />
                    </div>
                  </div>
                  {(stageFilter !== "all" || commitmentFilter !== "all" || minScore > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setStageFilter("all"); setCommitmentFilter("all"); setMinScore(0); }}
                      className="w-full"
                    >
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Match Grid */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} variant="elevated" padding="lg">
                    <CardContent className="p-0">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary animate-pulse" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-secondary rounded w-32 animate-pulse" />
                          <div className="h-3 bg-secondary rounded w-48 animate-pulse" />
                          <div className="flex gap-2 mt-2">
                            <div className="h-5 bg-secondary rounded w-16 animate-pulse" />
                            <div className="h-5 bg-secondary rounded w-20 animate-pulse" />
                          </div>
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-secondary animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6">
                  <Users className="h-10 w-10 text-muted-foreground/70" />
                </div>
                <h3 className="heading-3 text-foreground mb-3">No matches found</h3>
                <p className="body-base text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Complete your profile and set matching preferences to get better match suggestions.
                </p>
                <Button
                  size="lg"
                  onClick={() => setShowPrefs(true)}
                  className="gap-2"
                >
                  Set Preferences
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {matches.map((match) => (
                    <MatchCard
                      key={match.userId}
                      match={match}
                      onConnect={handleConnect}
                      isConnecting={connectingId === match.userId}
                      connected={connectedIds.has(match.userId)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect modal */}
      <Dialog open={!!connectTarget} onOpenChange={() => setConnectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Connect with {connectTarget?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a personal note to increase your chances of a response.
            </DialogDescription>
          </DialogHeader>
          {connectTarget && (
            <div className="space-y-4 pt-2">
              <div className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {connectTarget.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="font-medium text-sm">{connectTarget.name}</div>
                  {connectTarget.headline && <div className="text-xs text-muted-foreground">{connectTarget.headline}</div>}
                </div>
                <div className="ml-auto">
                  <ScoreRing score={connectTarget.score} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-sm">Personal note <span className="text-muted-foreground/70">(optional)</span></Label>
                <Textarea
                  placeholder="Hi! I noticed we have complementary skills in..."
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline" className="flex-1"
                  onClick={() => setConnectTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={sendConnect}
                  disabled={sendingConnect}
                >
                  {sendingConnect ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Send Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preferences modal */}
      <MatchPreferencesModal open={showPrefs} onClose={() => { setShowPrefs(false); load(); }} />
    </AppLayout>
  );
}

// ── Match Preferences Modal ───────────────────────────────────────────────────

function MatchPreferencesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [commitment, setCommitment] = useState("");
  const [location, setLocation] = useState("remote");
  const [geo, setGeo] = useState("global");
  const [workStyle, setWorkStyle] = useState("");

  const ROLE_OPTIONS = ["technical", "business", "marketing", "design", "finance", "operations"];
  const SKILL_OPTIONS = ["React", "Node.js", "Python", "AI/ML", "Product Management", "Marketing", "Sales", "Finance", "UI/UX", "DevOps", "Data Science", "Mobile Dev"];
  const INDUSTRY_OPTIONS = ["SaaS", "Fintech", "HealthTech", "EdTech", "E-commerce", "AI", "CleanTech", "B2B", "Marketplace", "DeepTech"];

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.matches.getPreferences().then((res) => {
      if (res.preferences) {
        const p = res.preferences;
        setRoles(JSON.parse(p.lookingForRoles as unknown as string) as string[] || []);
        setSkills(JSON.parse(p.desiredSkills as unknown as string) as string[] || []);
        setIndustries(JSON.parse(p.preferredIndustries as unknown as string) as string[] || []);
        setStage(Array.isArray(p.preferredStages) ? (p.preferredStages[0] ?? "") : "");
        setCommitment(Array.isArray(p.preferredCommitment) ? (p.preferredCommitment[0] ?? "") : "");
        setLocation(p.remoteOnly ? "remote" : "hybrid");
        setGeo("global");
        setWorkStyle("");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const save = async () => {
    setSaving(true);
    try {
      await api.matches.updatePreferences({
        lookingForRoles: roles,
        desiredSkills: skills,
        preferredIndustries: industries,
        preferredStages: stage ? [stage] : undefined,
        preferredCommitment: commitment ? [commitment] : undefined,
        remoteOnly: location === "remote",
      });
      toast.success("Preferences saved");
      onClose();
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            Matching Preferences
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define what you're looking for to get better match suggestions.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Looking for roles */}
            <div>
              <Label className="text-sm mb-2 block">Looking for (roles)</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggle(roles, setRoles, r)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${roles.includes(r) ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Desired skills */}
            <div>
              <Label className="text-sm mb-2 block">Desired skills in co-founder</Label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle(skills, setSkills, s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${skills.includes(s) ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div>
              <Label className="text-sm mb-2 block">Preferred industries</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggle(industries, setIndustries, i)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${industries.includes(i) ? "bg-primary border-primary text-primary-foreground" : "bg-secondary border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage & Commitment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Preferred stage</Label>
                <Select value={stage || "any"} onValueChange={(v) => setStage(v === "any" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any stage</SelectItem>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="mvp">MVP</SelectItem>
                    <SelectItem value="traction">Traction</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Commitment</Label>
                <Select value={commitment || "any"} onValueChange={(v) => setCommitment(v === "any" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location & Geo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Work location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Geographic openness</Label>
                <Select value={geo} onValueChange={setGeo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local only</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Work style */}
            <div>
              <Label className="text-sm mb-1.5 block">Work style preference</Label>
              <Select value={workStyle || "any"} onValueChange={(v) => setWorkStyle(v === "any" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any style</SelectItem>
                  <SelectItem value="structured">Structured</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="async">Async-first</SelectItem>
                  <SelectItem value="sync">Sync / In-person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
