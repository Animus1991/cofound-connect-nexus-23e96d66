import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Globe,
  Github,
  Linkedin,
  MessageSquare,
  UserPlus,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Zap,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Star,
  Loader2,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────
interface MatchDetail {
  userId: string;
  name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  stage: string | null;
  commitment: string | null;
  skills: string[];
  interests: string[];
  linkedin: string | null;
  github: string | null;
  website: string | null;
  score: number;
  dimensions: Record<string, number>;
  sharedStrengths: string[];
  complementaryStrengths: string[];
  mismatches: string[];
  explanation?: string;
}

// ── Constants ──────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage", mvp: "Building MVP", traction: "Early Traction",
  growth: "Growth", scale: "Scaling", seed: "Seed Funded",
};
const COMMITMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time", "part-time": "Part-time",
  flexible: "Flexible", weekends: "Weekends",
};

const DIMENSION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  skills:     { label: "Skills Overlap",    icon: Brain,      color: "text-primary" },
  role:       { label: "Role Fit",           icon: Users,      color: "text-blue-400" },
  industry:   { label: "Industry Alignment", icon: TrendingUp, color: "text-purple-400" },
  stage:      { label: "Stage Compatibility",icon: Target,     color: "text-orange-400" },
  commitment: { label: "Commitment Match",   icon: Clock,      color: "text-green-400" },
  location:   { label: "Location Fit",       icon: MapPin,     color: "text-accent" },
  workStyle:  { label: "Work Style",         icon: Zap,        color: "text-yellow-400" },
};

function ScoreRing({ score }: { score: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={112} height={112} className="-rotate-90">
        <circle cx={56} cy={56} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={8} />
        <circle
          cx={56} cy={56} r={radius} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] font-medium text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Loading skeleton ────────────────────────────────────────
function MatchDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-5">
      <div className="h-8 w-40 rounded bg-secondary animate-pulse" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-xl border border-border bg-card/50 p-6 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-secondary animate-pulse mx-auto" />
          <div className="h-5 w-36 rounded bg-secondary animate-pulse mx-auto" />
          <div className="h-4 w-48 rounded bg-secondary animate-pulse mx-auto" />
        </div>
        <div className="lg:col-span-2 space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
              <div className="h-5 w-32 rounded bg-secondary animate-pulse" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-3 rounded bg-secondary animate-pulse" style={{ width: `${60 + j * 10}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty/Error state ────────────────────────────────────────
function MatchNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <Sparkles className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground">Match not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">This match may no longer be available.</p>
      <Link to="/matches">
        <Button variant="outline" className="mt-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to matches
        </Button>
      </Link>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function MatchDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    try {
      const [profileRes, matchesRes] = await Promise.all([
        api.profiles.getById(userId).catch(() => null),
        api.matches.list({ limit: 50 }).catch(() => ({ matches: [], total: 0, page: 1, limit: 50 })),
      ]);

      if (!profileRes) { setNotFound(true); setLoading(false); return; }

      const p = profileRes.profile;
      const fromMatches = matchesRes.matches.find((m) => m.userId === userId);

      setMatch({
        userId: p.userId,
        name: p.name ?? "Unknown",
        headline: p.headline,
        bio: p.bio,
        location: p.location,
        stage: p.stage,
        commitment: p.commitment,
        skills: p.skills ?? [],
        interests: p.interests ?? [],
        linkedin: p.linkedin,
        github: p.github,
        website: p.website,
        score: fromMatches?.score ?? 0,
        dimensions: fromMatches?.dimensions ?? {},
        sharedStrengths: fromMatches?.sharedStrengths ?? [],
        complementaryStrengths: fromMatches?.complementaryStrengths ?? [],
        mismatches: fromMatches?.mismatches ?? [],
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleConnect = useCallback(async () => {
    if (!userId) return;
    setConnecting(true);
    try {
      await api.connections.requestConnection(userId, `Hi! I found you through CoFounderBay's matching system. Your profile looks like a great fit — I'd love to connect.`);
      setConnected(true);
      toast.success("Connection request sent!");
    } catch {
      toast.error("Could not send request. Try again.");
    } finally {
      setConnecting(false);
    }
  }, [userId]);

  const handleMessage = useCallback(async () => {
    if (!userId) return;
    try {
      const { id } = await api.messages.createConversation(userId);
      navigate(`/messages?convo=${id}`);
    } catch {
      navigate("/messages");
    }
  }, [userId, navigate]);

  if (loading) return (
    <AppLayout title="Match Detail">
      <MatchDetailSkeleton />
    </AppLayout>
  );

  if (notFound || !match) return (
    <AppLayout title="Match Detail">
      <div className="px-2 py-4">
        <MatchNotFound />
      </div>
    </AppLayout>
  );

  const sortedDimensions = Object.entries(DIMENSION_META).map(([key, meta]) => ({
    key, ...meta, value: match.dimensions[key] ?? 0,
  }));

  return (
    <AppLayout title="Match Detail">
      <div className="px-2 py-4">
        {/* Back */}
        <Link
          to="/matches"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to matches
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ── Left: Profile card ─────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile overview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/60 p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold font-display text-primary">
                {initials(match.name)}
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">{match.name}</h2>
              {match.headline && (
                <p className="mt-1 text-sm text-muted-foreground">{match.headline}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {match.stage && (
                  <Badge variant="secondary" className="text-xs">
                    {STAGE_LABELS[match.stage] ?? match.stage}
                  </Badge>
                )}
                {match.commitment && (
                  <Badge variant="outline" className="text-xs">
                    {COMMITMENT_LABELS[match.commitment] ?? match.commitment}
                  </Badge>
                )}
              </div>
              {match.location && (
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {match.location}
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleMessage}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={connecting || connected}
                  onClick={handleConnect}
                >
                  {connecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : connected ? (
                    <UserCheck className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  {connected ? "Requested" : "Connect"}
                </Button>
              </div>

              <Link
                to={`/profile/${match.userId}`}
                className="mt-3 block text-center text-xs text-primary hover:underline"
              >
                View full profile
              </Link>
            </motion.div>

            {/* Links */}
            {(match.linkedin || match.github || match.website) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card/60 p-4 space-y-2"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Links</h3>
                {match.linkedin && (
                  <a href={match.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-4 w-4 text-blue-500" /> LinkedIn
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
                {match.github && (
                  <a href={match.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-4 w-4" /> GitHub
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
                {match.website && (
                  <a href={match.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4 text-primary" /> Website
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
              </motion.div>
            )}

            {/* Interests */}
            {match.interests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-border bg-card/60 p-4"
              >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {match.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right: Compatibility analysis ─────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Compatibility score hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-border bg-card/60 p-6"
            >
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="flex flex-col items-center">
                  <ScoreRing score={match.score} />
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {match.score >= 85 ? "Excellent match" : match.score >= 70 ? "Strong match" : match.score >= 55 ? "Good match" : "Potential match"}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-base font-semibold text-foreground">Compatibility Analysis</h3>
                  </div>
                  <div className="space-y-2.5">
                    {sortedDimensions.map(({ key, label, icon: Icon, color, value }) => (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`h-3.5 w-3.5 ${color}`} />
                            <span className="text-xs text-muted-foreground">{label}</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">{value}</span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card/60 p-5"
            >
              <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {match.skills.length > 0 ? match.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs gap-1">
                    <Briefcase className="h-3 w-3" />{s}
                  </Badge>
                )) : <p className="text-sm text-muted-foreground">No skills listed</p>}
              </div>
            </motion.div>

            {/* Compatibility breakdown */}
            {(match.sharedStrengths.length > 0 || match.complementaryStrengths.length > 0 || match.mismatches.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Breakdown</h3>
                <div className="space-y-4">
                  {match.sharedStrengths.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">Shared Strengths</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.sharedStrengths.map((s) => (
                          <Badge key={s} className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {match.complementaryStrengths.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">Complementary Skills</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Skills they have that complement yours:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.complementaryStrengths.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs gap-1">
                            <Sparkles className="h-3 w-3 text-primary" />{s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {match.mismatches.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Potential Gaps</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.mismatches.map((s) => (
                          <Badge key={s} className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Bio */}
            {match.bio && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <h3 className="mb-3 font-display text-sm font-semibold text-foreground">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{match.bio}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
