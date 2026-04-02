import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Briefcase,
  Globe,
  Github,
  Linkedin,
  MessageSquare,
  UserPlus,
  ArrowLeft,
  Sparkles,
  Clock,
  Check,
  Loader2,
  UserCheck,
  ExternalLink,
  Rocket,
  Target,
  Brain,
  Heart,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface PublicProfile {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  stage: string | null;
  commitment: string | null;
  skills: string[];
  interests: string[];
  linkedin: string | null;
  github: string | null;
  website: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea Stage",
  mvp: "Building MVP",
  traction: "Early Traction",
  growth: "Growth",
  scale: "Scale",
  seed: "Seed Funded",
};

const COMMITMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "weekends": "Weekends only",
  "flexible": "Flexible",
};

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return email[0].toUpperCase();
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-5">
      <div className="h-7 w-24 rounded bg-secondary animate-pulse" />
      <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-2xl bg-secondary animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 rounded bg-secondary animate-pulse" />
            <div className="h-4 w-64 rounded bg-secondary animate-pulse" />
            <div className="h-4 w-40 rounded bg-secondary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const load = useCallback(async () => {
    if (!id) { setNotFound(true); setIsLoading(false); return; }
    try {
      const res = await api.profiles.getById(id);
      setProfile(res.profile as unknown as PublicProfile);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleConnect = async () => {
    if (!id) return;
    setIsConnecting(true);
    try {
      await api.connections.requestConnection(id, `Hi! I came across your profile on CoFounderBay and would love to connect.`);
      setIsConnected(true);
      toast({ title: "Connection request sent!" });
    } catch {
      toast({ title: "Failed to send request", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMessage = async () => {
    if (!id) return;
    try {
      const res = await api.messages.createConversation(id);
      navigate(`/messages?conversation=${res.id}`);
    } catch {
      toast({ title: "Could not open conversation", variant: "destructive" });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      sonnerToast.success("Profile link copied!");
    }).catch(() => {});
  };

  if (isLoading) {
    return <AppLayout title="Profile"><ProfileSkeleton /></AppLayout>;
  }

  if (notFound || !profile) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-display text-base font-semibold text-foreground">Profile not found</p>
          <p className="text-sm text-muted-foreground">This profile doesn't exist or is private.</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const inits = getInitials(profile.name, profile.email);

  return (
    <AppLayout title={profile.name ?? "Profile"}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ── Left column ────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Identity card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card/60 p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary font-display text-3xl font-bold">
                {inits}
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">{profile.name ?? "Anonymous"}</h1>
              {profile.headline && (
                <p className="mt-1 text-sm text-muted-foreground">{profile.headline}</p>
              )}

              {/* Meta badges */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                {profile.stage && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Rocket className="h-3 w-3" />
                    {STAGE_LABELS[profile.stage] ?? profile.stage}
                  </Badge>
                )}
                {profile.commitment && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {COMMITMENT_LABELS[profile.commitment] ?? profile.commitment}
                  </Badge>
                )}
              </div>

              {profile.location && (
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={isConnecting || isConnected}
                  onClick={handleConnect}
                >
                  {isConnected ? (
                    <><UserCheck className="h-3.5 w-3.5" /> Requested</>
                  ) : isConnecting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> …</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Connect</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleMessage}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to={`/matches?highlight=${id}`}>
                  <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Match score
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </motion.div>

            {/* Social links */}
            {(profile.linkedin || profile.github || profile.website) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-xl border border-border bg-card/60 p-4 space-y-2"
              >
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</h3>
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-4 w-4 text-blue-500" /> LinkedIn
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-4 w-4" /> GitHub
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4 text-primary" /> Website
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                )}
              </motion.div>
            )}

            {/* Interests */}
            {profile.interests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-xl border border-border bg-card/60 p-4"
              >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Industries &amp; Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right column ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Bio */}
            {profile.bio && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <h2 className="mb-3 font-display text-sm font-semibold text-foreground">About</h2>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </motion.div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-sm font-semibold text-foreground">Skills</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{profile.skills.length} skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map(skill => (
                    <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Availability */}
            {profile.availability && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-xl border border-border bg-card/60 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-sm font-semibold text-foreground">Looking For</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.availability}</p>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-5"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-primary" />
                    <p className="font-display text-sm font-semibold text-foreground">Interested in collaborating?</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send a connection request or jump straight into a conversation.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={isConnected || isConnecting}
                    onClick={handleConnect}
                  >
                    {isConnected ? <><Check className="h-3.5 w-3.5" /> Requested</> : <><UserPlus className="h-3.5 w-3.5" /> Connect</>}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleMessage}>
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
