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
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PublicProfile {
  id: string;
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
  early_traction: "Early Traction",
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
      setProfile(res.profile as PublicProfile);
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

  if (isLoading) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !profile) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-muted-foreground text-sm">This profile doesn't exist or is private.</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const initials = getInitials(profile.name, profile.email);

  return (
    <AppLayout title={profile.name ?? "Profile"}>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary font-display text-2xl sm:text-3xl font-bold">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                    {profile.name ?? "Anonymous"}
                  </h1>
                  {profile.headline && (
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" /> {profile.headline}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={handleConnect}
                    disabled={isConnecting || isConnected}
                    className="gap-1.5 text-xs"
                  >
                    {isConnected ? (
                      <><UserCheck className="h-3.5 w-3.5" /> Requested</>
                    ) : isConnecting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                    ) : (
                      <><UserPlus className="h-3.5 w-3.5" /> Connect</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessage}
                    className="gap-1.5 text-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.location}
                  </span>
                )}
                {profile.stage && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> {STAGE_LABELS[profile.stage] ?? profile.stage}
                  </span>
                )}
                {profile.commitment && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {COMMITMENT_LABELS[profile.commitment] ?? profile.commitment}
                  </span>
                )}
              </div>

              {/* Social links */}
              <div className="flex gap-2 mt-3">
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-3.5 w-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-5 text-sm text-foreground/80 leading-relaxed border-t border-border pt-4">
              {profile.bio}
            </p>
          )}
        </motion.div>

        {/* Skills */}
        {profile.skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" /> Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" /> Industries &amp; Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(interest => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center"
        >
          <p className="text-sm font-medium text-foreground mb-1">
            Interested in working together?
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Send a connection request or start a conversation directly.
          </p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={handleConnect} disabled={isConnected || isConnecting} className="gap-1.5 text-xs">
              {isConnected ? <><Check className="h-3.5 w-3.5" /> Requested</> : <><UserPlus className="h-3.5 w-3.5" /> Connect</>}
            </Button>
            <Button variant="outline" size="sm" onClick={handleMessage} className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
