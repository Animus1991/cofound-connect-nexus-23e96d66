import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  Rocket,
  Globe,
  Plus,
  X,
  Loader2,
  Building2,
  Tag,
  Users,
  Trash2,
  Save,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
  Eye,
  EyeOff,
} from "lucide-react";

type StartupProfile = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  industry: string | null;
  stage: string | null;
  fundingStatus: string | null;
  techStack: string[];
  tags: string[];
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    title: string | null;
    user: { id: string; name: string | null; email: string } | null;
  }>;
};

const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "mvp", label: "MVP" },
  { value: "early_traction", label: "Early Traction" },
  { value: "growth", label: "Growth" },
  { value: "scale", label: "Scale" },
];

export default function StartupPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState<StartupProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // form fields
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [fundingStatus, setFundingStatus] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);

  const [techInput, setTechInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const fetchStartup = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.startups.getMine();
      if (data.startup) {
        const s = data.startup;
        setStartup(s as unknown as StartupProfile);
        setName(s.name ?? "");
        setTagline(s.tagline ?? "");
        setDescription(s.description ?? "");
        setIndustry(s.industry ?? "");
        setStage(s.stage ?? "");
        setFundingStatus(s.fundingStatus ?? "");
        setWebsiteUrl(s.websiteUrl ?? "");
        setLogoUrl(s.logoUrl ?? "");
        setTechStack(s.techStack ?? []);
        setTags(s.tags ?? []);
        setIsPublic(s.isPublic ?? true);
      }
    } catch {
      /* offline — start blank */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchStartup(); }, [fetchStartup]);

  const handleSave = async () => {
    if (!name.trim()) { setSaveError("Startup name is required."); return; }
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    const payload = {
      name: name.trim(),
      tagline: tagline.trim() || undefined,
      description: description.trim() || undefined,
      industry: industry.trim() || undefined,
      stage: stage || undefined,
      fundingStatus: fundingStatus.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      techStack,
      tags,
      isPublic,
    };
    try {
      if (startup) {
        await api.startups.update(startup.id, payload);
      } else {
        await api.startups.create(payload as Parameters<typeof api.startups.create>[0]);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchStartup();
    } catch (err) {
      const e = err as { message?: string };
      setSaveError(e.message ?? "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addTech = () => {
    const val = techInput.trim();
    if (val && !techStack.includes(val)) setTechStack((p) => [...p, val]);
    setTechInput("");
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) setTags((p) => [...p, val]);
    setTagInput("");
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!startup) return;
    try {
      await api.startups.update(startup.id, {}); // placeholder — deletion via dedicated DELETE
      // For now use the direct fetch since api.ts doesn't have deleteMember
      const token = localStorage.getItem("accessToken");
      await fetch(`/api/startups/${startup.id}/members/${memberId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchStartup();
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <AppLayout title="Startup Profile">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Startup Profile">
      <div className="px-2 py-4">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <Rocket className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                {startup ? startup.name : "Create Startup Profile"}
              </h1>
              {startup?.tagline && (
                <p className="text-sm text-muted-foreground">{startup.tagline}</p>
              )}
            </div>
          </div>
          {startup?.websiteUrl && (
            <a
              href={startup.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        {/* ── Left: Form sections ── */}
        <div className="space-y-5">
          {/* Basic Info */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" /> Basic Info
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="name">Startup Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One sentence that captures your vision" maxLength={200} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your startup do? Who is it for?" rows={4} maxLength={2000} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="SaaS, FinTech, HealthTech…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stage">Stage</Label>
                <select
                  id="stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select stage…</option>
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="funding">Funding Status</Label>
                <Input id="funding" value={fundingStatus} onChange={(e) => setFundingStatus(e.target.value)} placeholder="Bootstrapped, Pre-Seed, Seed…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Website URL</Label>
                <Input id="website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://acme.com" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://cdn.acme.com/logo.png" />
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="h-4 w-4 text-primary" /> Tech Stack & Tags
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground uppercase tracking-wide">Tech Stack</Label>
                <div className="flex gap-2">
                  <Input
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                    placeholder="React, Node.js, PostgreSQL…"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTech}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {techStack.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button type="button" onClick={() => setTechStack((p) => p.filter((x) => x !== t))} className="ml-0.5 rounded-full hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground uppercase tracking-wide">Tags / Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="B2B, AI, marketplace…"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t} variant="outline" className="gap-1">
                      {t}
                      <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="ml-0.5 rounded-full hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Visibility */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Public profile</p>
                <p className="text-xs text-muted-foreground mt-0.5">Allow others to discover and view your startup</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </section>

          {/* Team Members (only if startup exists) */}
          {startup && startup.members && startup.members.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" /> Team ({startup.members.length})
              </h2>
              <ul className="space-y-2">
                {startup.members.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        {(m.user?.name ?? m.user?.email ?? "?")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-none">
                          {m.user?.name ?? m.user?.email ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.title ? `${m.title} · ` : ""}{m.role}
                        </p>
                      </div>
                    </div>
                    {m.role !== "owner" && m.userId !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(m.userId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Save */}
          {saveError && (
            <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
              {startup ? "Startup profile saved." : "Startup profile created!"}
            </p>
          )}

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {startup ? "Save Changes" : "Create Startup Profile"}
          </Button>
        </div>{/* /left column */}

        {/* ── Right: Live preview + completion ── */}
        <div className="space-y-4 lg:sticky lg:top-12">

          {/* Profile preview card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Public Preview</h3>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                {isPublic ? <><Eye className="h-3 w-3" /> Visible</> : <><EyeOff className="h-3 w-3" /> Hidden</>}
              </span>
            </div>
            <div className="rounded-lg bg-secondary/40 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {name || "Your Startup Name"}
                  </p>
                  {tagline && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tagline}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {industry && <Badge variant="secondary" className="text-[10px]">{industry}</Badge>}
                    {stage && <Badge variant="secondary" className="text-[10px] capitalize">{stage}</Badge>}
                  </div>
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {techStack.slice(0, 4).map((t) => (
                        <span key={t} className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">{t}</span>
                      ))}
                      {techStack.length > 4 && <span className="text-[10px] text-muted-foreground">+{techStack.length - 4}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Completion checklist */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Profile Strength</h3>
            <div className="space-y-2">
              {[
                { label: "Startup name", done: !!name.trim() },
                { label: "Tagline added", done: !!tagline.trim() },
                { label: "Description written", done: description.length > 20 },
                { label: "Industry selected", done: !!industry.trim() },
                { label: "Stage selected", done: !!stage },
                { label: "Tech stack added", done: techStack.length > 0 },
                { label: "Tags added", done: tags.length > 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${item.done ? "text-primary" : "text-border"}`} />
                  <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Tips</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground/80">
              <li>• A clear tagline increases match visibility by 3×</li>
              <li>• Add your tech stack to attract the right co-founders</li>
              <li>• Startups with descriptions get 5× more intro requests</li>
              <li>• Enable public profile so mentors can find you</li>
            </ul>
          </div>
        </div>{/* /right column */}

        </div>{/* /grid */}
      </div>
    </AppLayout>
  );
}
