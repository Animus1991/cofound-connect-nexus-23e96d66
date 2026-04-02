import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Calendar,
  Users,
  Target,
  Clock,
  Briefcase,
  Star,
  Globe,
  Linkedin,
  Github,
  ExternalLink,
  Send,
  GraduationCap,
  Zap,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────
interface MentorProfile {
  userId: string;
  name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  expertise: string[];
  startupStages: string[];
  availability: string;
  sessionFormat: string[];
  sessionFrequency: string;
  maxMentees: number;
  currentMentees: number;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
}

// ── Helpers ─────────────────────────────────────────────────
function initials(name: string | null) {
  if (!name) return "M";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage", mvp: "Building MVP", traction: "Early Traction",
  growth: "Growth", scale: "Scaling", seed: "Seed Funded",
};

const AVAIL_LABELS: Record<string, string> = {
  available: "Available", limited: "Limited Availability", unavailable: "Not Available",
};
const AVAIL_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  limited: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  unavailable: "bg-destructive/10 text-destructive border-destructive/20",
};

const SESSION_FORMAT_LABELS: Record<string, string> = {
  video: "Video calls", chat: "Chat / async", email: "Email",
  in_person: "In-person",
};

// ── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-5">
      <div className="h-8 w-32 rounded bg-secondary animate-pulse" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-secondary animate-pulse mx-auto" />
          <div className="h-5 w-32 rounded bg-secondary animate-pulse mx-auto" />
          <div className="h-4 w-44 rounded bg-secondary animate-pulse mx-auto" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-5 space-y-2">
              <div className="h-4 w-28 rounded bg-secondary animate-pulse" />
              <div className="h-3 w-full rounded bg-secondary animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Request Modal ────────────────────────────────────────────
function RequestModal({
  open,
  onClose,
  mentorName,
  mentorId,
}: {
  open: boolean;
  onClose: () => void;
  mentorName: string;
  mentorId: string;
}) {
  const [note, setNote] = useState("");
  const [goals, setGoals] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await api.mentorship.sendRequest({ mentorId, note, goals });
      setSent(true);
      toast.success("Mentorship request sent!");
      setTimeout(onClose, 1500);
    } catch {
      toast.error("Could not send request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Request mentorship</DialogTitle>
          <DialogDescription>
            Send a mentorship request to <span className="font-medium text-foreground">{mentorName}</span>.
            A personal message improves your acceptance chances.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-display font-semibold text-foreground">Request sent!</p>
            <p className="text-sm text-muted-foreground">{mentorName} will review your request shortly.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="goals" className="text-xs font-medium">
                Your goals <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="goals"
                placeholder="e.g. Get from idea to MVP, prepare for fundraising, find product-market fit..."
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-medium">
                Personal note <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="note"
                placeholder="Why are you a good mentee? What's your current situation?"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 text-sm" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1 gap-1.5 text-sm" disabled={sending} onClick={handleSend}>
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send Request
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function MentorDetailPage() {
  const { id: mentorId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = useCallback(async () => {
    if (!mentorId) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    try {
      const [mentorsRes, profileRes] = await Promise.all([
        api.mentorship.list().catch(() => ({ mentors: [] })),
        api.profiles.getById(mentorId).catch(() => null),
      ]);

      const found = mentorsRes.mentors.find((m) => m.userId === mentorId);
      if (!found) { setNotFound(true); setLoading(false); return; }

      const p = profileRes?.profile;
      setMentor({
        ...found,
        bio: found.bio ?? p?.bio ?? null,
        linkedin: p?.linkedin ?? null,
        github: p?.github ?? null,
        website: p?.website ?? null,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => { load(); }, [load]);

  const handleMessage = useCallback(async () => {
    if (!mentorId) return;
    try {
      const { id } = await api.messages.createConversation(mentorId);
      navigate(`/messages?convo=${id}`);
    } catch {
      navigate("/messages");
    }
  }, [mentorId, navigate]);

  if (loading) return <AppLayout title="Mentor"><Skeleton /></AppLayout>;

  if (notFound || !mentor) {
    return (
      <AppLayout title="Mentor">
        <div className="px-2 py-4">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <GraduationCap className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">Mentor not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">This mentor may no longer be available.</p>
            <Link to="/mentors">
              <Button variant="outline" className="mt-6 gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to mentors
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isAvailable = mentor.availability === "available" || mentor.availability === "limited";
  const spotsLeft = Math.max(0, mentor.maxMentees - mentor.currentMentees);

  return (
    <AppLayout title={mentor.name ?? "Mentor"}>
      <div className="px-2 py-4">
        <Link
          to="/mentors"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to mentors
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ── Left: Profile card ─────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/60 p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold font-display text-primary">
                {initials(mentor.name)}
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">{mentor.name ?? "Mentor"}</h2>
              {mentor.headline && (
                <p className="mt-1 text-sm text-muted-foreground">{mentor.headline}</p>
              )}
              {mentor.location && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {mentor.location}
                </div>
              )}
              <div className="mt-3">
                <Badge
                  className={`text-xs border ${AVAIL_COLORS[mentor.availability] ?? "bg-secondary text-muted-foreground"}`}
                >
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {AVAIL_LABELS[mentor.availability] ?? mentor.availability}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-secondary/40 p-3 text-center text-xs">
                <div>
                  <p className="font-display text-base font-bold text-foreground">{mentor.maxMentees}</p>
                  <p className="text-muted-foreground">Max mentees</p>
                </div>
                <div>
                  <p className={`font-display text-base font-bold ${spotsLeft > 0 ? "text-green-500" : "text-destructive"}`}>
                    {spotsLeft}
                  </p>
                  <p className="text-muted-foreground">Spots left</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
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
                  disabled={!isAvailable || spotsLeft === 0}
                  onClick={() => setRequestOpen(true)}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {spotsLeft === 0 ? "Full" : "Request"}
                </Button>
              </div>

              <Link
                to={`/profile/${mentor.userId}`}
                className="mt-3 block text-center text-xs text-primary hover:underline"
              >
                View full profile
              </Link>
            </motion.div>

            {/* Links */}
            {(mentor.linkedin || mentor.github || mentor.website) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card/60 p-4 space-y-2"
              >
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</h3>
                {mentor.linkedin && (
                  <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-4 w-4 text-blue-500" /> LinkedIn <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
                {mentor.github && (
                  <a href={mentor.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-4 w-4" /> GitHub <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
                {mentor.website && (
                  <a href={mentor.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4 text-primary" /> Website <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
              </motion.div>
            )}
          </div>

          {/* ── Right: Detail ───────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Bio */}
            {mentor.bio && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <h3 className="mb-3 font-display text-sm font-semibold text-foreground">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio}</p>
              </motion.div>
            )}

            {/* Expertise */}
            {mentor.expertise.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-sm font-semibold text-foreground">Areas of Expertise</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.map((e) => (
                    <Badge key={e} variant="secondary" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-primary" /> {e}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Skills */}
            {mentor.skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold text-foreground">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.skills.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Session Info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-xl border border-border bg-card/60 p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold text-foreground">Session Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Frequency</span>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {mentor.sessionFrequency || "On request"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Format</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {mentor.sessionFormat.length > 0 ? mentor.sessionFormat.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">
                        {SESSION_FORMAT_LABELS[f] ?? f}
                      </Badge>
                    )) : <span className="text-sm text-muted-foreground">Flexible</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Capacity</span>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {mentor.currentMentees}/{mentor.maxMentees} mentees
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Startup Stages */}
            {mentor.startupStages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold text-foreground">Startup Stages</h3>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">This mentor works with founders at these stages:</p>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.startupStages.map((stage) => (
                    <Badge key={stage} className="bg-primary/10 text-primary border-primary/20 text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {STAGE_LABELS[stage] ?? stage}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA Banner */}
            {isAvailable && spotsLeft > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-5"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">Ready to get started?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} available — send a request today.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 text-sm shrink-0"
                    onClick={() => setRequestOpen(true)}
                  >
                    <Calendar className="h-3.5 w-3.5" /> Request mentorship
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Request modal */}
      {mentorId && (
        <RequestModal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          mentorName={mentor.name ?? "Mentor"}
          mentorId={mentorId}
        />
      )}
    </AppLayout>
  );
}
