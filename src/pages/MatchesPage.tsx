import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
        <span className="text-[9px] text-slate-400 mt-0.5">match</span>
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
      className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/70 transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white text-sm">{match.name}</h3>
              {match.headline && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{match.headline}</p>
              )}
            </div>
            <ScoreRing score={match.score} />
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {match.location && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3 h-3" />{match.location}
              </span>
            )}
            {match.stage && (
              <Badge variant="secondary" className="text-xs py-0 px-2 bg-slate-700/60 text-slate-300">
                {STAGE_LABELS[match.stage] ?? match.stage}
              </Badge>
            )}
            {match.commitment && (
              <Badge variant="secondary" className="text-xs py-0 px-2 bg-slate-700/60 text-slate-300">
                {COMMITMENT_LABELS[match.commitment] ?? match.commitment}
              </Badge>
            )}
          </div>

          {/* Skills preview */}
          {match.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {match.skills.slice(0, 5).map((skill) => (
                <span key={skill} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {skill}
                </span>
              ))}
              {match.skills.length > 5 && (
                <span className="text-xs text-slate-500">+{match.skills.length - 5} more</span>
              )}
            </div>
          )}

          {/* Explanation */}
          <p className="text-xs text-slate-400 mt-2.5 italic line-clamp-2">{match.explanation}</p>
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
            <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-2.5">
              {Object.entries(match.dimensions).map(([key, val]) => {
                const meta = DIMENSION_LABELS[key];
                if (!meta) return null;
                const Icon = meta.icon;
                const col = val >= 75 ? "bg-emerald-500" : val >= 55 ? "bg-blue-500" : val >= 35 ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Icon className="w-3 h-3" />{meta.label}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">{val}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
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
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                {match.sharedStrengths.length > 0 && (
                  <div className="flex gap-1.5 items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">Shared: {match.sharedStrengths.join(", ")}</span>
                  </div>
                )}
                {match.complementaryStrengths.length > 0 && (
                  <div className="flex gap-1.5 items-start">
                    <Star className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">They bring: {match.complementaryStrengths.join(", ")}</span>
                  </div>
                )}
                {match.mismatches.map((m, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-400">{m}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/40">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          {expanded ? "Hide breakdown" : "Show breakdown"}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
        {connected ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Request sent
          </span>
        ) : (
          <Button
            size="sm"
            onClick={() => onConnect(match)}
            disabled={isConnecting}
            className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />}
            Connect
          </Button>
        )}
      </div>
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              Match Discovery
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Explainable compatibility scores — find your ideal co-founder or collaborator.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrefs(true)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              Preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">{total}</div>
              <div className="text-xs text-slate-400 mt-0.5">Potential Matches</div>
            </div>
            <div className="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">{excellentCount}</div>
              <div className="text-xs text-slate-400 mt-0.5">Excellent Fits (80+)</div>
            </div>
            <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-blue-400">{goodCount}</div>
              <div className="text-xs text-slate-400 mt-0.5">Good Fits (65–79)</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            Filters
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40 h-8 text-xs bg-slate-700/50 border-slate-600 text-slate-300">
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
            <SelectTrigger className="w-40 h-8 text-xs bg-slate-700/50 border-slate-600 text-slate-300">
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
            <span className="text-xs text-slate-400">Min score</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={minScore || ""}
              onChange={(e) => setMinScore(parseInt(e.target.value || "0", 10))}
              placeholder="0"
              className="w-20 h-8 text-xs bg-slate-700/50 border-slate-600 text-slate-300"
            />
          </div>
          {(stageFilter !== "all" || commitmentFilter !== "all" || minScore > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-slate-400 hover:text-white px-2"
              onClick={() => { setStageFilter("all"); setCommitmentFilter("all"); setMinScore(0); }}
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Match grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-32" />
                    <div className="h-3 bg-slate-700 rounded w-48" />
                    <div className="flex gap-2 mt-2">
                      <div className="h-5 bg-slate-700 rounded w-16" />
                      <div className="h-5 bg-slate-700 rounded w-20" />
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No matches found</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-4">
              Complete your profile and set matching preferences to get better match suggestions.
            </p>
            <Button
              size="sm"
              onClick={() => setShowPrefs(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Set Preferences
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Connect modal */}
      <Dialog open={!!connectTarget} onOpenChange={() => setConnectTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Connect with {connectTarget?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a personal note to increase your chances of a response.
            </DialogDescription>
          </DialogHeader>
          {connectTarget && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {connectTarget.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="font-medium text-sm">{connectTarget.name}</div>
                  {connectTarget.headline && <div className="text-xs text-slate-400">{connectTarget.headline}</div>}
                </div>
                <div className="ml-auto">
                  <ScoreRing score={connectTarget.score} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Personal note <span className="text-slate-500">(optional)</span></Label>
                <Textarea
                  placeholder="Hi! I noticed we have complementary skills in..."
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  rows={3}
                  className="bg-slate-800/60 border-slate-600 text-white text-sm resize-none placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  onClick={() => setConnectTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
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
        setStage(p.preferredStage ?? "");
        setCommitment(p.preferredCommitment ?? "");
        setLocation(p.workLocationPreference ?? "remote");
        setGeo(p.geographicOpenness ?? "global");
        setWorkStyle(p.workStyle ?? "");
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
        preferredStage: stage || undefined,
        preferredCommitment: commitment || undefined,
        workLocationPreference: location as "remote" | "hybrid" | "onsite",
        geographicOpenness: geo as "local" | "regional" | "global",
        workStyle: workStyle || undefined,
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
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            Matching Preferences
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Define what you're looking for to get better match suggestions.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Looking for roles */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Looking for (roles)</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggle(roles, setRoles, r)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${roles.includes(r) ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Desired skills */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Desired skills in co-founder</Label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle(skills, setSkills, s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${skills.includes(s) ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div>
              <Label className="text-slate-300 text-sm mb-2 block">Preferred industries</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggle(industries, setIndustries, i)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${industries.includes(i) ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400"}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage & Commitment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Preferred stage</Label>
                <Select value={stage || "any"} onValueChange={(v) => setStage(v === "any" ? "" : v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600 text-slate-300">
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
                <Label className="text-slate-300 text-sm mb-1.5 block">Commitment</Label>
                <Select value={commitment || "any"} onValueChange={(v) => setCommitment(v === "any" ? "" : v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600 text-slate-300">
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
                <Label className="text-slate-300 text-sm mb-1.5 block">Work location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600 text-slate-300">
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
                <Label className="text-slate-300 text-sm mb-1.5 block">Geographic openness</Label>
                <Select value={geo} onValueChange={setGeo}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600 text-slate-300">
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
              <Label className="text-slate-300 text-sm mb-1.5 block">Work style preference</Label>
              <Select value={workStyle || "any"} onValueChange={(v) => setWorkStyle(v === "any" ? "" : v)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-600 text-slate-300">
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
              <Button variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white" onClick={save} disabled={saving}>
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
