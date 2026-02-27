import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Edit3,
  Save,
  X,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Linkedin,
  Github,
  Globe,
  Mail,
  Briefcase,
  GraduationCap,
  Target,
  Rocket,
  Users,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileData {
  name: string;
  headline: string;
  bio: string;
  location: string;
  availability: string;
  email: string;
  linkedin: string;
  github: string;
  website: string;
  skills: string[];
  interests: string[];
  stage: string;
  commitment: string;
  compensation: string;
  lookingFor: string;
}

const initialProfile: ProfileData = {
  name: "Jane Doe",
  headline: "Product strategist & startup builder",
  bio: "10+ years building digital products. Previously led product at two YC startups. Passionate about using tech to solve real-world problems. Currently exploring AI-powered tools for early-stage founders.",
  location: "Athens, Greece",
  availability: "Full-time",
  email: "jane@example.com",
  linkedin: "linkedin.com/in/janedoe",
  github: "github.com/janedoe",
  website: "janedoe.co",
  skills: ["Product Strategy", "UX Research", "Agile", "Data Analysis", "Go-to-Market", "Fundraising"],
  interests: ["AI/ML", "EdTech", "ClimateTech", "SaaS", "FinTech"],
  stage: "MVP",
  commitment: "Full-time",
  compensation: "Equity + small salary",
  lookingFor: "Technical Co-founder",
};

const verificationItems = [
  { label: "Email verified", verified: true, icon: Mail },
  { label: "LinkedIn connected", verified: true, icon: Linkedin },
  { label: "GitHub connected", verified: false, icon: Github },
  { label: "Identity verified", verified: false, icon: Shield },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(initialProfile);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const handleSave = () => {
    setProfile(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !draft.skills.includes(newSkill.trim())) {
      setDraft({ ...draft, skills: [...draft.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setDraft({ ...draft, skills: draft.skills.filter((s) => s !== skill) });
  };

  const addInterest = () => {
    if (newInterest.trim() && !draft.interests.includes(newInterest.trim())) {
      setDraft({ ...draft, interests: [...draft.interests, newInterest.trim()] });
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setDraft({ ...draft, interests: draft.interests.filter((i) => i !== interest) });
  };

  const completionItems = [
    { done: !!profile.headline, label: "Headline" },
    { done: !!profile.bio, label: "Bio" },
    { done: profile.skills.length >= 3, label: "3+ skills" },
    { done: !!profile.location, label: "Location" },
    { done: !!profile.linkedin, label: "LinkedIn" },
    { done: !!profile.lookingFor, label: "Intent" },
  ];
  const completionPercent = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100
  );

  const data = editing ? draft : profile;

  return (
    <AppLayout
      title="Profile"
      headerActions={
        !editing ? (
          <Button variant="hero" size="sm" className="gap-2" onClick={() => setEditing(true)}>
            <Edit3 className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="hero" size="sm" className="gap-2" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        )
      }
    >
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
              <span className="text-2xl font-bold text-primary">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="font-display text-lg font-bold"
                    placeholder="Full name"
                  />
                  <Input
                    value={draft.headline}
                    onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                    placeholder="Your headline"
                  />
                  <Textarea
                    value={draft.bio}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                </div>
              ) : (
                <>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {data.name}
                  </h2>
                  <p className="text-sm text-primary mt-0.5">{data.headline}</p>
                  <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                    {data.bio}
                  </p>
                </>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {editing ? (
                    <Input
                      value={draft.location}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                      className="h-7 w-40 text-xs"
                    />
                  ) : (
                    data.location
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {data.availability}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Profile Completion
            </h3>
            <span className="text-sm font-bold text-primary">{completionPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {completionItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                  item.done
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Skills */}
          <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-xs gap-1"
                >
                  {skill}
                  {editing && (
                    <button onClick={() => removeSkill(skill)}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2 mt-3">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add skill..."
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8" onClick={addSkill}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">
              Industries & Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="text-xs bg-accent/15 text-accent gap-1"
                >
                  {interest}
                  {editing && (
                    <button onClick={() => removeInterest(interest)}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2 mt-3">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addInterest()}
                  placeholder="Add interest..."
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8" onClick={addInterest}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Intent Cards */}
        <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            What I'm Looking For
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, label: "Looking for", value: editing ? draft.lookingFor : data.lookingFor, key: "lookingFor" },
              { icon: Rocket, label: "Startup Stage", value: editing ? draft.stage : data.stage, key: "stage" },
              { icon: Users, label: "Commitment", value: editing ? draft.commitment : data.commitment, key: "commitment" },
              { icon: DollarSign, label: "Compensation", value: editing ? draft.compensation : data.compensation, key: "compensation" },
            ].map((card) => (
              <div
                key={card.key}
                className="rounded-xl border border-border/30 bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className="h-4 w-4 text-primary" />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </span>
                </div>
                {editing ? (
                  <Input
                    value={card.value}
                    onChange={(e) =>
                      setDraft({ ...draft, [card.key]: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {card.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification Status */}
        <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Verification Status
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {verificationItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-xl border p-4 ${
                  item.verified
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/30 bg-secondary/20"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    item.verified ? "bg-primary/20" : "bg-secondary"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${
                      item.verified ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.verified ? "Verified" : "Not connected"}
                  </p>
                </div>
                {item.verified ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact & Links */}
        <div className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Contact & Links
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Mail, label: "Email", value: data.email, key: "email" },
              { icon: Linkedin, label: "LinkedIn", value: data.linkedin, key: "linkedin" },
              { icon: Github, label: "GitHub", value: data.github, key: "github" },
              { icon: Globe, label: "Website", value: data.website, key: "website" },
            ].map((link) => (
              <div key={link.key} className="flex items-center gap-3">
                <link.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                {editing ? (
                  <Input
                    value={(draft as any)[link.key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [link.key]: e.target.value })
                    }
                    className="h-8 text-xs"
                    placeholder={link.label}
                  />
                ) : (
                  <span className="text-sm text-foreground/80 truncate">
                    {link.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
