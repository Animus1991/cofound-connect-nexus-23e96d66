import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Clock, ChevronDown, ChevronUp, MessageSquare,
  Zap, Sparkles, TrendingUp, AlertTriangle, CheckCircle2,
  ThumbsDown, EyeOff, Flag, Bookmark, MoreHorizontal,
  Brain, Target, Users, Star,
} from "lucide-react";
import { api } from "@/lib/api";

export interface MatchCardProfile {
  id: string | number;
  userId?: string;
  name: string;
  role?: string;
  headline: string | null;
  location: string | null;
  stage?: string | null;
  commitment?: string | null;
  skills: string[];
  score: number;
  breakdown?: {
    explicitScore: number;
    semanticScore: number;
    behavioralScore: number;
    outcomePriorScore: number;
    profileCompletenessTarget?: number;
    finalScore: number;
    confidenceScore: number;
    sharedDimensions: string[];
    complementaryDimensions: string[];
    frictionDimensions: string[];
    recommendationReason: string;
    isNewUserBoost: boolean;
    isExplorationMatch: boolean;
    matchType?: string;
    modelVersion?: string;
  };
  sharedStrengths?: string[];
  complementaryStrengths?: string[];
  mismatchFlags?: string[];
  explanation?: string;
}

interface MatchCardProps {
  profile: MatchCardProfile;
  onSendIntro?: (profile: MatchCardProfile) => void;
  onFeedback?: (profile: MatchCardProfile, type: string) => void;
  onSave?: (id: string | number) => void;
  onMarkClicked?: (profile: MatchCardProfile) => void;
  introSent?: boolean;
  introLoading?: boolean;
  saved?: boolean;
  modelVersion?: string;
  viewMode?: "grid" | "list";
}

function ScoreRing({ score, confidence }: { score: number; confidence: number }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  const gap = circ - filled;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#6b7280";

  return (
    <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${filled} ${gap}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold text-foreground leading-none">{score}</span>
        <span className="text-[8px] text-muted-foreground leading-none mt-0.5">%</span>
      </div>
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full opacity-60"
        style={{ backgroundColor: color, filter: `blur(3px)` }}
      />
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.75)
    return <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 border border-emerald-500/20"><Star className="h-2 w-2" /> High confidence</span>;
  if (score >= 0.50)
    return <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 border border-blue-500/20"><Target className="h-2 w-2" /> Medium confidence</span>;
  return <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground border border-border"><Users className="h-2 w-2" /> Exploring</span>;
}

export default function MatchCard({
  profile, onSendIntro, onFeedback, onSave, onMarkClicked,
  introSent = false, introLoading = false, saved = false,
  modelVersion, viewMode = "grid",
}: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackMenuOpen, setFeedbackMenuOpen] = useState(false);
  const [localFeedbackSent, setLocalFeedbackSent] = useState<string | null>(null);

  const userId = profile.userId ?? String(profile.id);
  const bd = profile.breakdown;
  const score = profile.score;
  const confidence = bd?.confidenceScore ?? 0.5;
  const sharedDims = bd?.sharedDimensions ?? profile.sharedStrengths ?? [];
  const complementaryDims = bd?.complementaryDimensions ?? profile.complementaryStrengths ?? [];
  const frictionDims = bd?.frictionDimensions ?? profile.mismatchFlags ?? [];
  const reason = bd?.recommendationReason ?? profile.explanation ?? "Potential fit worth exploring.";
  const isExploration = bd?.isExplorationMatch ?? false;
  const isNewUser = bd?.isNewUserBoost ?? false;
  const mv = bd?.modelVersion ?? modelVersion;

  const handleExpand = useCallback(() => {
    setExpanded((e) => !e);
    if (!expanded) {
      onMarkClicked?.(profile);
      api.matching.markClicked({ targetUserId: userId, modelVersion: mv }).catch(() => {});
    }
  }, [expanded, profile, userId, mv, onMarkClicked]);

  const handleFeedback = useCallback((type: string) => {
    setFeedbackMenuOpen(false);
    setLocalFeedbackSent(type);
    onFeedback?.(profile, type);
    api.matching.sendFeedback({ targetUserId: userId, feedbackType: type as "not_relevant" | "hidden" | "not_now" | "better_fit" | "relevant" | "reported", matchType: bd?.matchType }).catch(() => {});
  }, [profile, userId, bd?.matchType, onFeedback]);

  const handleIntro = useCallback(() => {
    onSendIntro?.(profile);
    api.matching.recordOutcome({ targetUserId: userId, outcomeType: "requested", modelVersion: mv }).catch(() => {});
  }, [profile, userId, mv, onSendIntro]);

  if (localFeedbackSent === "hidden" || localFeedbackSent === "not_relevant") {
    return null;
  }

  const initials = profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const roleColors: Record<string, string> = {
    "Founder": "bg-violet-500/10 text-violet-600 border-violet-500/20",
    "Co-founder": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "Developer": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    "Designer": "bg-pink-500/10 text-pink-600 border-pink-500/20",
    "default": "bg-primary/10 text-primary border-primary/20",
  };
  const roleColor = roleColors[profile.role ?? ""] ?? roleColors.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`group relative rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md hover:border-primary/20 ${viewMode === "list" ? "flex gap-4 p-4 items-start" : ""}`}
    >
      {isExploration && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-70" />
      )}
      {score >= 85 && !isExploration && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 opacity-80" />
      )}

      <div className={viewMode === "list" ? "flex-1 min-w-0" : ""}>
        <div className={`${viewMode === "grid" ? "p-4" : ""} `}>
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-xs font-bold text-primary">{initials}</span>
              </div>
              {isNewUser && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 border-2 border-background">
                  <Zap className="h-2 w-2 text-amber-900" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground truncate">{profile.name}</span>
                {profile.role && (
                  <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 border ${roleColor}`}>{profile.role}</Badge>
                )}
                {isExploration && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Sparkles className="h-2 w-2 mr-0.5" />Exploring
                  </Badge>
                )}
                {isNewUser && !isExploration && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <TrendingUp className="h-2 w-2 mr-0.5" />New
                  </Badge>
                )}
              </div>
              {profile.headline && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{profile.headline}</p>
              )}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {profile.location && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" />{profile.location}
                  </span>
                )}
                {profile.commitment && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />{profile.commitment}
                  </span>
                )}
                {profile.stage && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Target className="h-2.5 w-2.5" />{profile.stage}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <ScoreRing score={score} confidence={confidence} />
              <ConfidenceBadge score={confidence} />
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
            <div className="flex items-start gap-1.5">
              <Brain className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-snug">{reason}</p>
            </div>
          </div>

          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {profile.skills.slice(0, 5).map((skill) => (
                <span key={skill} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground border border-border">{skill}</span>
              ))}
              {profile.skills.length > 5 && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground border border-border">+{profile.skills.length - 5}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            {introSent ? (
              <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-7" disabled>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Request Sent
              </Button>
            ) : (
              <Button variant="default" size="sm" className="flex-1 text-xs gap-1.5 h-7" disabled={introLoading} onClick={handleIntro}>
                <MessageSquare className="h-3 w-3" />
                {introLoading ? "Sending…" : "Request Intro"}
              </Button>
            )}

            <button
              onClick={handleExpand}
              className="flex items-center gap-1 rounded-lg px-2.5 h-7 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-border"
            >
              <Brain className="h-3 w-3" />
              AI Analysis
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            <div className="relative ml-auto">
              <button
                onClick={() => setFeedbackMenuOpen((o) => !o)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-border"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {feedbackMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 top-8 z-50 min-w-[160px] rounded-xl border border-border bg-popover shadow-lg py-1"
                  >
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent" onClick={() => handleFeedback("relevant")}>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Relevant match
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent" onClick={() => handleFeedback("not_now")}>
                      <Clock className="h-3 w-3 text-amber-500" /> Not now
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent" onClick={() => handleFeedback("better_fit")}>
                      <Target className="h-3 w-3 text-blue-500" /> Better fit wanted
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent" onClick={() => handleFeedback("not_relevant")}>
                      <ThumbsDown className="h-3 w-3 text-muted-foreground" /> Not relevant
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent" onClick={() => { onSave?.(profile.id); setFeedbackMenuOpen(false); }}>
                      <Bookmark className="h-3 w-3" /> {saved ? "Unsave" : "Save"}
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent" onClick={() => handleFeedback("hidden")}>
                      <EyeOff className="h-3 w-3" /> Hide
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-accent" onClick={() => handleFeedback("reported")}>
                      <Flag className="h-3 w-3" /> Report
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-0 border-t border-border mt-0 space-y-3">
                {bd && (
                  <div className="pt-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Match Breakdown</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Skills & Profile", value: bd.explicitScore, color: "bg-violet-500" },
                        { label: "Semantic Alignment", value: bd.semanticScore, color: "bg-blue-500" },
                        { label: "Behavioral Signals", value: bd.behavioralScore, color: "bg-amber-500" },
                        { label: "Outcome History", value: bd.outcomePriorScore, color: "bg-emerald-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{label}</span>
                            <span className="font-medium text-foreground">{Math.round(value * 100)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className={`h-full rounded-full ${color} opacity-70 transition-all duration-700`} style={{ width: `${value * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {bd.profileCompletenessTarget !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Profile completeness: <span className="text-foreground font-medium">{Math.round(bd.profileCompletenessTarget * 100)}%</span>
                      </p>
                    )}
                  </div>
                )}

                {sharedDims.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Shared Strengths
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {sharedDims.map((d) => (
                        <span key={d} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {complementaryDims.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-blue-500" /> Complementary Skills
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {complementaryDims.map((d) => (
                        <span key={d} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-400 border border-blue-500/20">{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {frictionDims.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" /> Watch Out
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {frictionDims.map((d) => (
                        <span key={d} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-400 border border-amber-500/20">{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {mv && (
                  <p className="text-[9px] text-muted-foreground/50 mt-1">Model: {mv}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
