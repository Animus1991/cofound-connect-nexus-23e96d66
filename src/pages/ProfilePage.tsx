import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Heart,
  Zap,
  Brain,
  Compass,
  Star,
  TrendingUp,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";

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
  yearsExperience: number;
  education: string;
  languages: string[];
}

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
  type: "work" | "startup" | "advisory";
}

interface SkillCategory {
  category: string;
  skills: { name: string; level: "beginner" | "intermediate" | "advanced" | "expert" }[];
}

interface ValueItem {
  label: string;
  value: string;
  icon: React.ElementType;
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
  yearsExperience: 10,
  education: "MBA, Stanford GSB",
  languages: ["English", "Greek", "French"],
};

const experiences: Experience[] = [
  { title: "Head of Product", company: "TechFlow (YC W22)", period: "2022 – 2025", description: "Led product from 0→1, grew to 15K users. Managed 8-person cross-functional team.", type: "startup" },
  { title: "Senior PM", company: "DataBridge", period: "2019 – 2022", description: "Owned analytics platform, increased ARR by 340%. Led enterprise expansion.", type: "work" },
  { title: "Advisor", company: "Three early-stage startups", period: "2021 – Present", description: "Product strategy and go-to-market advisory for pre-seed companies.", type: "advisory" },
];

const skillCategories: SkillCategory[] = [
  { category: "Product & Strategy", skills: [
    { name: "Product Strategy", level: "expert" },
    { name: "Go-to-Market", level: "expert" },
    { name: "Roadmapping", level: "advanced" },
    { name: "Competitive Analysis", level: "advanced" },
  ]},
  { category: "Research & Data", skills: [
    { name: "UX Research", level: "expert" },
    { name: "Data Analysis", level: "advanced" },
    { name: "A/B Testing", level: "advanced" },
    { name: "SQL", level: "intermediate" },
  ]},
  { category: "Business", skills: [
    { name: "Fundraising", level: "advanced" },
    { name: "Financial Modeling", level: "intermediate" },
    { name: "Agile/Scrum", level: "expert" },
    { name: "Stakeholder Mgmt", level: "expert" },
  ]},
];

const values: ValueItem[] = [
  { label: "Mission Orientation", value: "Impact-driven", icon: Heart },
  { label: "Risk Tolerance", value: "High — comfortable with ambiguity", icon: Zap },
  { label: "Work Style", value: "Async-first, deep work blocks", icon: Brain },
  { label: "Communication", value: "Direct, data-informed", icon: Compass },
  { label: "Team Size Pref.", value: "3–8 person core team", icon: Users },
  { label: "Geo Openness", value: "Remote-first, EU timezone", icon: Globe },
];

const matchRelevance = {
  overallScore: 87,
  dimensions: [
    { label: "Skills Complementarity", score: 92 },
    { label: "Stage Alignment", score: 88 },
    { label: "Values Fit", score: 85 },
    { label: "Industry Match", score: 82 },
    { label: "Commitment Level", score: 90 },
    { label: "Work Style", score: 78 },
  ],
};

const verificationItems = [
  { label: "Email verified", verified: true, icon: Mail },
  { label: "LinkedIn connected", verified: true, icon: Linkedin },
  { label: "GitHub connected", verified: false, icon: Github },
  { label: "Identity verified", verified: false, icon: Shield },
];

const levelColors: Record<string, string> = {
  beginner: "bg-muted text-muted-foreground",
  intermediate: "bg-accent/15 text-accent",
  advanced: "bg-primary/15 text-primary",
  expert: "bg-primary/25 text-primary font-semibold",
};

const typeColors: Record<string, string> = {
  work: "bg-primary/10 text-primary",
  startup: "bg-accent/10 text-accent",
  advisory: "bg-muted text-muted-foreground",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(initialProfile);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const handleSave = () => { setProfile(draft); setEditing(false); };
  const handleCancel = () => { setDraft(profile); setEditing(false); };

  const addSkill = () => {
    if (newSkill.trim() && !draft.skills.includes(newSkill.trim())) {
      setDraft({ ...draft, skills: [...draft.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };
  const removeSkill = (skill: string) => setDraft({ ...draft, skills: draft.skills.filter(s => s !== skill) });

  const addInterest = () => {
    if (newInterest.trim() && !draft.interests.includes(newInterest.trim())) {
      setDraft({ ...draft, interests: [...draft.interests, newInterest.trim()] });
      setNewInterest("");
    }
  };
  const removeInterest = (interest: string) => setDraft({ ...draft, interests: draft.interests.filter(i => i !== interest) });

  const completionItems = [
    { done: !!profile.headline, label: "Headline" },
    { done: !!profile.bio, label: "Bio" },
    { done: profile.skills.length >= 3, label: "3+ skills" },
    { done: !!profile.location, label: "Location" },
    { done: !!profile.linkedin, label: "LinkedIn" },
    { done: !!profile.lookingFor, label: "Intent" },
    { done: !!profile.education, label: "Education" },
    { done: profile.languages.length > 0, label: "Languages" },
  ];
  const completionPercent = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  const data = editing ? draft : profile;

  const cardDelay = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.4 } });

  return (
    <AppLayout
      title="Profile"
      headerActions={
        !editing ? (
          <Button variant="hero" size="sm" className="gap-2" onClick={() => setEditing(true)}>
            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="hero" size="sm" className="gap-2" onClick={handleSave}><Save className="h-3.5 w-3.5" /> Save</Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCancel}><X className="h-3.5 w-3.5" /> Cancel</Button>
          </div>
        )
      }
    >
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div {...cardDelay(0)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
              <span className="text-2xl font-bold text-primary">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="font-display text-lg font-bold" placeholder="Full name" />
                  <Input value={draft.headline} onChange={e => setDraft({ ...draft, headline: e.target.value })} placeholder="Your headline" />
                  <Textarea value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} placeholder="Tell others about yourself..." rows={3} />
                </div>
              ) : (
                <>
                  <h2 className="font-display text-xl font-bold text-foreground">{data.name}</h2>
                  <p className="text-sm text-primary mt-0.5">{data.headline}</p>
                  <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{data.bio}</p>
                </>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {data.availability}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {data.yearsExperience}+ years experience</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {data.education}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.languages.map(lang => (
                  <Badge key={lang} variant="secondary" className="text-[10px]">{lang}</Badge>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion + Match Relevance */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div {...cardDelay(1)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold text-foreground">Profile Completion</h3>
              <span className="text-sm font-bold text-primary">{completionPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
              <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${completionPercent}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {completionItems.map(item => (
                <div key={item.label} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${item.done ? "bg-primary/10 text-primary" : "bg-secondary/50 text-muted-foreground"}`}>
                  {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Match Relevance Display */}
          <motion.div {...cardDelay(2)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Match Relevance
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-primary tabular-nums">{matchRelevance.overallScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">How well your profile matches with potential co-founders</p>
            <div className="space-y-3">
              {matchRelevance.dimensions.map(dim => (
                <div key={dim.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground">{dim.label}</span>
                    <span className="text-[11px] font-medium text-primary tabular-nums">{dim.score}%</span>
                  </div>
                  <Progress value={dim.score} className="h-1.5" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Experience Timeline */}
        <motion.div {...cardDelay(3)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" /> Experience
          </h3>
          <div className="relative space-y-0">
            {experiences.map((exp, i) => (
              <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Timeline line */}
                {i < experiences.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border/50" />
                )}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeColors[exp.type]}`}>
                  {exp.type === "startup" ? <Rocket className="h-3.5 w-3.5" /> : exp.type === "advisory" ? <Star className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{exp.title}</p>
                      <p className="text-xs text-primary">{exp.company}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{exp.period}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Skills Taxonomy */}
        <motion.div {...cardDelay(4)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Skills Taxonomy
          </h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {skillCategories.map(cat => (
              <div key={cat.category} className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{cat.category}</p>
                <div className="space-y-1.5">
                  {cat.skills.map(skill => (
                    <div key={skill.name} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{skill.name}</span>
                      <Badge className={`text-[9px] ${levelColors[skill.level]}`}>{skill.level}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
              <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill()} placeholder="Add skill..." className="h-8 text-xs" />
              <Button size="sm" variant="outline" className="h-8" onClick={addSkill}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Industries & Interests */}
          <motion.div {...cardDelay(5)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">Industries & Interests</h3>
            <div className="flex flex-wrap gap-2">
              {data.interests.map(interest => (
                <Badge key={interest} variant="secondary" className="text-xs bg-accent/15 text-accent gap-1">
                  {interest}
                  {editing && <button onClick={() => removeInterest(interest)}><X className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>}
                </Badge>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2 mt-3">
                <Input value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyDown={e => e.key === "Enter" && addInterest()} placeholder="Add interest..." className="h-8 text-xs" />
                <Button size="sm" variant="outline" className="h-8" onClick={addInterest}><Plus className="h-3 w-3" /></Button>
              </div>
            )}
          </motion.div>

          {/* Values & Preferences */}
          <motion.div {...cardDelay(6)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
            <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> Values & Preferences
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {values.map(v => (
                <div key={v.label} className="rounded-lg bg-secondary/30 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <v.icon className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{v.label}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{v.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Role Intent */}
        <motion.div {...cardDelay(7)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Role Intent</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Target, label: "Looking for", value: data.lookingFor, key: "lookingFor" },
              { icon: Rocket, label: "Startup Stage", value: data.stage, key: "stage" },
              { icon: Users, label: "Commitment", value: data.commitment, key: "commitment" },
              { icon: DollarSign, label: "Compensation", value: data.compensation, key: "compensation" },
            ].map(card => (
              <div key={card.key} className="rounded-xl border border-border/30 bg-secondary/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className="h-4 w-4 text-primary" />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
                </div>
                {editing ? (
                  <Input value={card.value} onChange={e => setDraft({ ...draft, [card.key]: e.target.value })} className="h-8 text-xs" />
                ) : (
                  <p className="text-sm font-medium text-foreground">{card.value}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Signals */}
        <motion.div {...cardDelay(8)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Trust Signals
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {verificationItems.map(item => (
              <div key={item.label} className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 hover:scale-[1.01] ${item.verified ? "border-primary/30 bg-primary/5" : "border-border/30 bg-secondary/20"}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.verified ? "bg-primary/20" : "bg-secondary"}`}>
                  <item.icon className={`h-4 w-4 ${item.verified ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.verified ? "Verified" : "Not connected"}</p>
                </div>
                {item.verified ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Button variant="outline" size="sm" className="text-xs h-8">Connect</Button>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact & Links */}
        <motion.div {...cardDelay(9)} className="rounded-2xl border border-border/50 bg-card-gradient p-6">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Contact & Links</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Mail, label: "Email", value: data.email, key: "email" },
              { icon: Linkedin, label: "LinkedIn", value: data.linkedin, key: "linkedin" },
              { icon: Github, label: "GitHub", value: data.github, key: "github" },
              { icon: Globe, label: "Website", value: data.website, key: "website" },
            ].map(link => (
              <div key={link.key} className="flex items-center gap-3">
                <link.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                {editing ? (
                  <Input value={(draft as any)[link.key]} onChange={e => setDraft({ ...draft, [link.key]: e.target.value })} className="h-8 text-xs" placeholder={link.label} />
                ) : (
                  <span className="text-sm text-foreground/80 truncate">{link.value}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
