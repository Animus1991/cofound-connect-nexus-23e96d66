import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Type,
  Image,
  FileText,
  Scale,
  Mail,
  Share2,
  Eye,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Save,
  Globe,
  CreditCard,
  ExternalLink,
  Rocket,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { contrastRatio, hexToHslString } from "@/lib/tenantTheme";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import DomainManagementPanel from "@/components/tenant/DomainManagementPanel";
import TenantBillingPanel from "@/components/billing/TenantBillingPanel";

// ── API helper ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function tenantApi(
  method: string,
  path: string,
  token: string,
  body?: unknown,
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: "Request failed" }))).error ?? "Request failed");
  return res.json();
}

// ── Section nav ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { key: "identity", label: "Identity", icon: Globe },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "content", label: "Content", icon: FileText },
  { key: "legal", label: "Legal", icon: Scale },
  { key: "email", label: "Email", icon: Mail },
  { key: "social", label: "Social", icon: Share2 },
  { key: "domains", label: "Domains", icon: Globe },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "preview", label: "Preview", icon: Eye },
] as const;

type Section = (typeof SECTIONS)[number]["key"];

// ── Color swatch + contrast indicator ────────────────────────────────────────

function ColorField({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const hsl = hexToHslString(value);
  const contrastVsWhite = value ? contrastRatio(value, "#ffffff") : 0;
  const contrastVsBlack = value ? contrastRatio(value, "#000000") : 0;
  const passes = Math.max(contrastVsWhite, contrastVsBlack) >= 4.5;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="h-9 w-9 shrink-0 rounded-lg border border-border/60 cursor-pointer overflow-hidden"
          title="Click to edit hex value"
        >
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-full w-full cursor-pointer border-0 p-0 opacity-0 absolute"
          />
          <div
            className="h-full w-full"
            style={{ backgroundColor: value || "transparent" }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-9 font-mono text-sm bg-secondary/30 border-border/50"
        />
        {value && (
          <div className="flex items-center gap-1 shrink-0">
            {passes ? (
              <span title="WCAG AA contrast OK"><CheckCircle2 className="h-4 w-4 text-green-500" /></span>
            ) : (
              <span title="Low contrast — may fail WCAG AA"><AlertTriangle className="h-4 w-4 text-amber-500" /></span>
            )}
          </div>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {hsl && value && (
        <p className="text-[10px] font-mono text-muted-foreground/60">hsl({hsl})</p>
      )}
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder, multiline, maxLength, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; maxLength?: number; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {maxLength && (
          <span className="text-[10px] text-muted-foreground tabular-nums">{value.length}/{maxLength}</span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="w-full resize-none rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="h-9 text-sm bg-secondary/30 border-border/50"
        />
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Live preview ──────────────────────────────────────────────────────────────

function LivePreview({ form }: { form: TenantFormState }) {
  const primaryHsl = hexToHslString(form.branding.primaryColor);
  const previewStyle: React.CSSProperties = {
    ...(primaryHsl ? { "--preview-primary": `hsl(${primaryHsl})` } as React.CSSProperties : {}),
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Live preview of the tenant public landing page header and hero.</p>
      <div
        style={previewStyle}
        className="rounded-2xl border border-border/50 overflow-hidden shadow-lg"
      >
        {/* Simulated header */}
        <div className="flex h-12 items-center justify-between border-b border-border/30 bg-card px-4">
          <div className="flex items-center gap-2">
            {form.branding.logoUrl ? (
              <img src={form.branding.logoUrl} alt="logo" className="h-6 w-auto max-w-[80px] object-contain" />
            ) : (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ backgroundColor: form.branding.primaryColor || "hsl(var(--primary))" }}
              >
                <Rocket className="h-3 w-3 text-white" />
              </div>
            )}
            <span
              className="text-xs font-semibold"
              style={{ fontFamily: form.branding.headingFont ? `"${form.branding.headingFont}", sans-serif` : undefined }}
            >
              {form.identity.displayName || "Your Platform"}
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className="h-5 w-12 rounded bg-secondary/60 text-[9px] flex items-center justify-center text-muted-foreground">Sign in</div>
            <div
              className="h-5 w-14 rounded text-[9px] flex items-center justify-center text-white"
              style={{ backgroundColor: form.branding.primaryColor || "hsl(var(--primary))" }}
            >
              Join now
            </div>
          </div>
        </div>

        {/* Simulated hero */}
        <div
          className="relative flex flex-col items-center justify-center py-10 px-4 text-center"
          style={
            form.branding.heroImageUrl
              ? { backgroundImage: `url(${form.branding.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          {form.branding.heroImageUrl && (
            <div className="absolute inset-0 bg-background/70" />
          )}
          {!form.branding.heroImageUrl && (
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: form.branding.primaryColor
                  ? `radial-gradient(ellipse at 50% 0%, ${form.branding.primaryColor}, transparent 70%)`
                  : "radial-gradient(ellipse at 50% 0%, hsl(var(--primary)), transparent 70%)",
              }}
            />
          )}
          <div className="relative z-10 space-y-3 max-w-sm">
            <h1
              className="text-base font-bold text-foreground leading-tight"
              style={{ fontFamily: form.branding.headingFont ? `"${form.branding.headingFont}", sans-serif` : undefined }}
            >
              {form.content.heroTitle || "Welcome to " + (form.identity.displayName || "Your Platform")}
            </h1>
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: form.branding.bodyFont ? `"${form.branding.bodyFont}", sans-serif` : undefined }}
            >
              {form.content.heroSubtitle || "Connect with co-founders and collaborators."}
            </p>
            <div className="flex justify-center gap-2">
              <div
                className="h-7 px-3 rounded text-[10px] flex items-center text-white font-medium"
                style={{ backgroundColor: form.branding.primaryColor || "hsl(var(--primary))" }}
              >
                {form.content.heroCtaLabel || "Get Started"}
              </div>
              {form.content.heroCtaSecondaryLabel && (
                <div className="h-7 px-3 rounded text-[10px] flex items-center border border-border/60 text-foreground">
                  {form.content.heroCtaSecondaryLabel}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div className="border-t border-border/30 bg-card px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {form.legal.companyName || form.identity.displayName || "Your Platform"} · Powered by CoFounderBay
          </span>
          <div className="flex gap-2 text-[10px] text-muted-foreground">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>

      {/* Public page link */}
      {form.identity.slug && (
        <a
          href={`/t/${form.identity.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          /t/{form.identity.slug}
        </a>
      )}
    </div>
  );
}

// ── Form state type ───────────────────────────────────────────────────────────

interface TenantFormState {
  identity: {
    displayName: string;
    slug: string;
    description: string;
    aboutText: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundStyle: string;
    logoUrl: string;
    faviconUrl: string;
    logoAltText: string;
    heroImageUrl: string;
    headingFont: string;
    bodyFont: string;
    cornerStyle: string;
  };
  content: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaLabel: string;
    heroCtaSecondaryLabel: string;
    platformDescription: string;
    tagline: string;
    onboardingIntroText: string;
    dashboardWelcomeText: string;
    communityLabel: string;
    memberLabel: string;
    mentorLabel: string;
    applyCtaLabel: string;
  };
  legal: {
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    cookiePolicyUrl: string;
    supportEmail: string;
    supportPhone: string;
    supportUrl: string;
    companyName: string;
    companyAddress: string;
  };
  email: {
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    emailHeaderLogoUrl: string;
    emailSignature: string;
    emailFooterBranding: string;
    subjectPrefix: string;
  };
  social: {
    websiteUrl: string;
    linkedinUrl: string;
    twitterUrl: string;
    instagramUrl: string;
    facebookUrl: string;
    youtubeUrl: string;
    githubUrl: string;
  };
}

const EMPTY_FORM: TenantFormState = {
  identity: { displayName: "", slug: "", description: "", aboutText: "" },
  branding: {
    primaryColor: "", secondaryColor: "", accentColor: "",
    backgroundStyle: "auto", logoUrl: "", faviconUrl: "",
    logoAltText: "", heroImageUrl: "", headingFont: "", bodyFont: "",
    cornerStyle: "default",
  },
  content: {
    heroTitle: "", heroSubtitle: "", heroCtaLabel: "", heroCtaSecondaryLabel: "",
    platformDescription: "", tagline: "", onboardingIntroText: "",
    dashboardWelcomeText: "", communityLabel: "", memberLabel: "",
    mentorLabel: "", applyCtaLabel: "",
  },
  legal: {
    privacyPolicyUrl: "", termsOfServiceUrl: "", cookiePolicyUrl: "",
    supportEmail: "", supportPhone: "", supportUrl: "",
    companyName: "", companyAddress: "",
  },
  email: {
    fromName: "", fromEmail: "", replyToEmail: "",
    emailHeaderLogoUrl: "", emailSignature: "",
    emailFooterBranding: "", subjectPrefix: "",
  },
  social: {
    websiteUrl: "", linkedinUrl: "", twitterUrl: "",
    instagramUrl: "", facebookUrl: "", youtubeUrl: "", githubUrl: "",
  },
};

// ── Main component ────────────────────────────────────────────────────────────

interface TenantBrandingPanelProps {
  tenantId?: string;
}

export default function TenantBrandingPanel({ tenantId }: TenantBrandingPanelProps) {
  const { user } = useAuth();
  const { refreshTenant, tenant: ctxTenant } = useTenant();
  const [section, setSection] = useState<Section>("identity");
  const [form, setForm] = useState<TenantFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const effectiveTenantId = tenantId ?? ctxTenant?.id;

  const loadTenantData = useCallback(async () => {
    if (!effectiveTenantId || !user?.token) return;
    setLoading(true);
    try {
      const data = await tenantApi("GET", `/api/tenants/${effectiveTenantId}`, user.token);
      const t = data.tenant;
      const b = data.branding ?? {};
      const co = data.content ?? {};
      const l = data.legal ?? {};
      const e = data.email ?? {};
      const s = data.social ?? {};

      setIsActive(!!t.isBrandingActive);
      setPublishedAt(t.publishedAt ?? null);

      setForm({
        identity: {
          displayName: t.displayName ?? "",
          slug: t.slug ?? "",
          description: t.description ?? "",
          aboutText: t.aboutText ?? "",
        },
        branding: {
          primaryColor: b.primaryColor ?? "",
          secondaryColor: b.secondaryColor ?? "",
          accentColor: b.accentColor ?? "",
          backgroundStyle: b.backgroundStyle ?? "auto",
          logoUrl: b.logoUrl ?? "",
          faviconUrl: b.faviconUrl ?? "",
          logoAltText: b.logoAltText ?? "",
          heroImageUrl: b.heroImageUrl ?? "",
          headingFont: b.headingFont ?? "",
          bodyFont: b.bodyFont ?? "",
          cornerStyle: b.cornerStyle ?? "default",
        },
        content: {
          heroTitle: co.heroTitle ?? "",
          heroSubtitle: co.heroSubtitle ?? "",
          heroCtaLabel: co.heroCtaLabel ?? "",
          heroCtaSecondaryLabel: co.heroCtaSecondaryLabel ?? "",
          platformDescription: co.platformDescription ?? "",
          tagline: co.tagline ?? "",
          onboardingIntroText: co.onboardingIntroText ?? "",
          dashboardWelcomeText: co.dashboardWelcomeText ?? "",
          communityLabel: co.communityLabel ?? "",
          memberLabel: co.memberLabel ?? "",
          mentorLabel: co.mentorLabel ?? "",
          applyCtaLabel: co.applyCtaLabel ?? "",
        },
        legal: {
          privacyPolicyUrl: l.privacyPolicyUrl ?? "",
          termsOfServiceUrl: l.termsOfServiceUrl ?? "",
          cookiePolicyUrl: l.cookiePolicyUrl ?? "",
          supportEmail: l.supportEmail ?? "",
          supportPhone: l.supportPhone ?? "",
          supportUrl: l.supportUrl ?? "",
          companyName: l.companyName ?? "",
          companyAddress: l.companyAddress ?? "",
        },
        email: {
          fromName: e.fromName ?? "",
          fromEmail: e.fromEmail ?? "",
          replyToEmail: e.replyToEmail ?? "",
          emailHeaderLogoUrl: e.emailHeaderLogoUrl ?? "",
          emailSignature: e.emailSignature ?? "",
          emailFooterBranding: e.emailFooterBranding ?? "",
          subjectPrefix: e.subjectPrefix ?? "",
        },
        social: {
          websiteUrl: s.websiteUrl ?? "",
          linkedinUrl: s.linkedinUrl ?? "",
          twitterUrl: s.twitterUrl ?? "",
          instagramUrl: s.instagramUrl ?? "",
          facebookUrl: s.facebookUrl ?? "",
          youtubeUrl: s.youtubeUrl ?? "",
          githubUrl: s.githubUrl ?? "",
        },
      });
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to load tenant");
    } finally {
      setLoading(false);
    }
  }, [effectiveTenantId, user?.token]);

  useEffect(() => { loadTenantData(); }, [loadTenantData]);

  const patch = <K extends keyof TenantFormState>(
    group: K,
    field: keyof TenantFormState[K],
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  };

  const saveSection = async (target: "meta" | "branding" | "content" | "legal" | "email" | "social") => {
    if (!effectiveTenantId || !user?.token) { showToast("error", "Not authenticated"); return; }
    setSaving(true);
    try {
      const payloads: Record<string, unknown> = {
        meta: form.identity,
        branding: {
          ...form.branding,
          primaryColor: form.branding.primaryColor || null,
          secondaryColor: form.branding.secondaryColor || null,
          accentColor: form.branding.accentColor || null,
          logoUrl: form.branding.logoUrl || null,
          faviconUrl: form.branding.faviconUrl || null,
          heroImageUrl: form.branding.heroImageUrl || null,
          headingFont: form.branding.headingFont || null,
          bodyFont: form.branding.bodyFont || null,
        },
        content: form.content,
        legal: form.legal,
        email: form.email,
        social: form.social,
      };

      await tenantApi("PUT", `/api/tenants/${effectiveTenantId}/${target}`, user.token, payloads[target]);
      showToast("success", "Saved successfully");
      await refreshTenant();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (activate: boolean) => {
    if (!effectiveTenantId || !user?.token) return;
    setPublishing(true);
    try {
      const endpoint = activate ? "publish" : "unpublish";
      const data = await tenantApi("POST", `/api/tenants/${effectiveTenantId}/${endpoint}`, user.token);
      setIsActive(activate);
      if (activate && data.publishedAt) setPublishedAt(data.publishedAt);
      showToast("success", activate ? "Branding published and active!" : "Branding deactivated");
      await refreshTenant();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleResetBranding = async () => {
    if (!effectiveTenantId || !user?.token) return;
    if (!confirm("Reset all branding colors and fonts to platform defaults? This cannot be undone.")) return;
    try {
      await tenantApi("POST", `/api/tenants/${effectiveTenantId}/reset-branding`, user.token);
      showToast("success", "Branding reset to defaults");
      await loadTenantData();
      await refreshTenant();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Reset failed");
    }
  };

  // Map section → save target
  const sectionSaveMap: Partial<Record<Section, "meta" | "branding" | "content" | "legal" | "email" | "social">> = {
    identity: "meta",
    branding: "branding",
    content: "content",
    legal: "legal",
    email: "email",
    social: "social",
  };

  if (!effectiveTenantId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Palette className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No tenant selected</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Select an organization tenant to manage its white-label branding and configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            White-Label Branding
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize the platform's visual identity, copy, and settings for this tenant.
          </p>
        </div>

        {/* Status + publish toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {publishedAt && isActive && (
            <span className="text-[10px] text-muted-foreground">
              Published {new Date(publishedAt).toLocaleDateString()}
            </span>
          )}
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={`gap-1 text-[11px] ${isActive ? "bg-green-500/15 text-green-600 border-green-500/20" : ""}`}
          >
            {isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <Button
            size="sm"
            variant={isActive ? "outline" : "default"}
            className="text-xs h-8 gap-1.5"
            onClick={() => handlePublish(!isActive)}
            disabled={publishing || loading}
          >
            {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : (isActive ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />)}
            {isActive ? "Deactivate" : "Publish branding"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-8 gap-1.5 text-muted-foreground"
            onClick={handleResetBranding}
            disabled={loading}
            title="Reset colors/fonts to platform defaults"
          >
            <RefreshCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-500/10 border border-green-500/20 text-green-600"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading tenant configuration…</span>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
          {/* Section nav */}
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col lg:gap-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left w-full ${
                  section === s.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>

          {/* Section content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* ── Billing ── */}
              {section === "billing" && effectiveTenantId && (
                <div className="space-y-4">
                  <SectionHeader title="Billing & Subscription" desc="Manage this tenant's subscription plan, seats, invoices, and billing contact." />
                  <TenantBillingPanel tenantId={effectiveTenantId} tenantName={form.identity.displayName} />
                </div>
              )}

              {/* ── Domains ── */}
              {section === "domains" && effectiveTenantId && (
                <div className="space-y-4">
                  <SectionHeader title="Domain Mapping" desc="Map platform subdomains or custom domains to this tenant." />
                  <DomainManagementPanel tenantId={effectiveTenantId} />
                </div>
              )}

              {/* ── Identity ── */}
              {section === "identity" && (
                <div className="space-y-4">
                  <SectionHeader title="Identity" desc="Platform name, slug, and description for this tenant." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Display name" value={form.identity.displayName} onChange={(v) => patch("identity", "displayName", v)} placeholder="Accel Hub" maxLength={120} />
                    <TextField
                      label="URL slug"
                      value={form.identity.slug}
                      onChange={(v) => patch("identity", "slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                      placeholder="accel-hub"
                      hint="Used in /t/:slug — lowercase, hyphens only"
                    />
                  </div>
                  <TextField label="Short description" value={form.identity.description} onChange={(v) => patch("identity", "description", v)} placeholder="A curated platform for ambitious founders." maxLength={300} hint="Shown in meta descriptions and platform listings." />
                  <TextField label="About / long description" value={form.identity.aboutText} onChange={(v) => patch("identity", "aboutText", v)} multiline placeholder="Tell us more about this community…" maxLength={2000} />
                  <SaveBar onSave={() => saveSection("meta")} saving={saving} />
                </div>
              )}

              {/* ── Branding ── */}
              {section === "branding" && (
                <div className="space-y-5">
                  <SectionHeader title="Visual Branding" desc="Colors, typography, logos, and corner style." />

                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Colors</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <ColorField label="Primary color" value={form.branding.primaryColor} onChange={(v) => patch("branding", "primaryColor", v)} hint="Buttons, links, active states" />
                      <ColorField label="Secondary color" value={form.branding.secondaryColor} onChange={(v) => patch("branding", "secondaryColor", v)} hint="Backgrounds, badges" />
                      <ColorField label="Accent color" value={form.branding.accentColor} onChange={(v) => patch("branding", "accentColor", v)} hint="Charts, highlights" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Background style</label>
                        <select value={form.branding.backgroundStyle} onChange={(e) => patch("branding", "backgroundStyle", e.target.value)} className="w-full rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                          <option value="auto">Auto (follows user theme)</option>
                          <option value="light">Prefer light</option>
                          <option value="dark">Prefer dark</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Corner style</label>
                        <select value={form.branding.cornerStyle} onChange={(e) => patch("branding", "cornerStyle", e.target.value)} className="w-full rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                          <option value="sharp">Sharp (2px)</option>
                          <option value="default">Default (8px)</option>
                          <option value="rounded">Rounded (16px)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Typography</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label="Heading font" value={form.branding.headingFont} onChange={(v) => patch("branding", "headingFont", v)} placeholder="Plus Jakarta Sans" hint="From approved list: Plus Jakarta Sans, Outfit, Manrope…" />
                      <TextField label="Body font" value={form.branding.bodyFont} onChange={(v) => patch("branding", "bodyFont", v)} placeholder="Inter" hint="System default is Inter" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Assets</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label="Logo URL" value={form.branding.logoUrl} onChange={(v) => patch("branding", "logoUrl", v)} placeholder="https://…/logo.svg" hint="SVG or PNG, min 120px wide" />
                      <TextField label="Logo alt text" value={form.branding.logoAltText} onChange={(v) => patch("branding", "logoAltText", v)} placeholder="Accel Hub logo" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label="Favicon URL" value={form.branding.faviconUrl} onChange={(v) => patch("branding", "faviconUrl", v)} placeholder="https://…/favicon.ico" hint="32×32 ICO or PNG" />
                      <TextField label="Hero / banner image URL" value={form.branding.heroImageUrl} onChange={(v) => patch("branding", "heroImageUrl", v)} placeholder="https://…/hero.jpg" hint="Shown as background on landing hero section" />
                    </div>
                    {form.branding.logoUrl && (
                      <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-background p-3">
                        <img src={form.branding.logoUrl} alt="logo preview" className="h-8 w-auto max-w-[120px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span className="text-xs text-muted-foreground">Logo preview</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <Upload className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <p className="text-[11px] text-muted-foreground">
                        <strong className="text-foreground">File uploads:</strong> Paste a direct URL from your CDN or image host (Cloudinary, S3, etc.). In-app upload coming soon.
                      </p>
                    </div>
                  </div>

                  <SaveBar onSave={() => saveSection("branding")} saving={saving} />
                </div>
              )}

              {/* ── Content ── */}
              {section === "content" && (
                <div className="space-y-4">
                  <SectionHeader title="Content & Copy" desc="Hero section, onboarding text, and custom labels." />
                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Landing hero</p>
                    <TextField label="Hero title" value={form.content.heroTitle} onChange={(v) => patch("content", "heroTitle", v)} placeholder="Build the startup you believe in" maxLength={200} />
                    <TextField label="Hero subtitle" value={form.content.heroSubtitle} onChange={(v) => patch("content", "heroSubtitle", v)} placeholder="Connect with co-founders, mentors…" maxLength={400} multiline />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label="Primary CTA label" value={form.content.heroCtaLabel} onChange={(v) => patch("content", "heroCtaLabel", v)} placeholder="Get Started" maxLength={60} />
                      <TextField label="Secondary CTA label" value={form.content.heroCtaSecondaryLabel} onChange={(v) => patch("content", "heroCtaSecondaryLabel", v)} placeholder="Watch demo" maxLength={60} />
                    </div>
                    <TextField label="Platform description" value={form.content.platformDescription} onChange={(v) => patch("content", "platformDescription", v)} multiline placeholder="A short paragraph shown below the hero." maxLength={1000} />
                    <TextField label="Tagline (badge in hero)" value={form.content.tagline} onChange={(v) => patch("content", "tagline", v)} placeholder="Build your network. Build your startup." maxLength={200} />
                    <TextField label="Apply / join CTA label" value={form.content.applyCtaLabel} onChange={(v) => patch("content", "applyCtaLabel", v)} placeholder="Apply to join" maxLength={60} />
                  </div>
                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">In-app messaging</p>
                    <TextField label="Onboarding intro text" value={form.content.onboardingIntroText} onChange={(v) => patch("content", "onboardingIntroText", v)} multiline placeholder="Welcome! Let's set up your profile…" maxLength={500} />
                    <TextField label="Dashboard welcome message" value={form.content.dashboardWelcomeText} onChange={(v) => patch("content", "dashboardWelcomeText", v)} placeholder="Welcome back, {name}!" maxLength={300} hint="Use {name} as a placeholder for the user's first name." />
                  </div>
                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Custom labels</p>
                    <p className="text-[11px] text-muted-foreground -mt-1">Override default platform terminology for this tenant.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label='"Community" label' value={form.content.communityLabel} onChange={(v) => patch("content", "communityLabel", v)} placeholder="Cohort, Program, Circle…" maxLength={40} />
                      <TextField label='"Member" label' value={form.content.memberLabel} onChange={(v) => patch("content", "memberLabel", v)} placeholder="Builder, Participant…" maxLength={40} />
                      <TextField label='"Mentor" label' value={form.content.mentorLabel} onChange={(v) => patch("content", "mentorLabel", v)} placeholder="Coach, Advisor, Expert…" maxLength={40} />
                    </div>
                  </div>
                  <SaveBar onSave={() => saveSection("content")} saving={saving} />
                </div>
              )}

              {/* ── Legal ── */}
              {section === "legal" && (
                <div className="space-y-4">
                  <SectionHeader title="Legal & Support" desc="Privacy, terms, and support contact details." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Privacy policy URL" value={form.legal.privacyPolicyUrl} onChange={(v) => patch("legal", "privacyPolicyUrl", v)} placeholder="https://example.com/privacy" />
                    <TextField label="Terms of service URL" value={form.legal.termsOfServiceUrl} onChange={(v) => patch("legal", "termsOfServiceUrl", v)} placeholder="https://example.com/terms" />
                    <TextField label="Cookie policy URL" value={form.legal.cookiePolicyUrl} onChange={(v) => patch("legal", "cookiePolicyUrl", v)} placeholder="https://example.com/cookies" />
                    <TextField label="Support URL" value={form.legal.supportUrl} onChange={(v) => patch("legal", "supportUrl", v)} placeholder="https://help.example.com" />
                    <TextField label="Support email" value={form.legal.supportEmail} onChange={(v) => patch("legal", "supportEmail", v)} placeholder="support@example.com" />
                    <TextField label="Support phone" value={form.legal.supportPhone} onChange={(v) => patch("legal", "supportPhone", v)} placeholder="+1 555 000 0000" />
                    <TextField label="Company name" value={form.legal.companyName} onChange={(v) => patch("legal", "companyName", v)} placeholder="Accel Hub Ltd." />
                    <TextField label="Company address" value={form.legal.companyAddress} onChange={(v) => patch("legal", "companyAddress", v)} placeholder="123 Main St, City, Country" />
                  </div>
                  <SaveBar onSave={() => saveSection("legal")} saving={saving} />
                </div>
              )}

              {/* ── Email ── */}
              {section === "email" && (
                <div className="space-y-4">
                  <SectionHeader title="Email Branding" desc="Customize transactional email sender identity and footer." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="From name" value={form.email.fromName} onChange={(v) => patch("email", "fromName", v)} placeholder="Accel Hub" />
                    <TextField label="From email" value={form.email.fromEmail} onChange={(v) => patch("email", "fromEmail", v)} placeholder="noreply@example.com" />
                    <TextField label="Reply-to email" value={form.email.replyToEmail} onChange={(v) => patch("email", "replyToEmail", v)} placeholder="support@example.com" />
                    <TextField label="Email header logo URL" value={form.email.emailHeaderLogoUrl} onChange={(v) => patch("email", "emailHeaderLogoUrl", v)} placeholder="https://…/email-logo.png" hint="600px wide PNG recommended" />
                    <TextField label="Subject prefix" value={form.email.subjectPrefix} onChange={(v) => patch("email", "subjectPrefix", v)} placeholder="[Accel Hub] " hint="Prepended to all transactional email subjects" />
                  </div>
                  <TextField label="Email signature" value={form.email.emailSignature} onChange={(v) => patch("email", "emailSignature", v)} multiline placeholder="The Accel Hub Team\nhttps://accelhub.io" maxLength={1000} />
                  <TextField label="Email footer branding text" value={form.email.emailFooterBranding} onChange={(v) => patch("email", "emailFooterBranding", v)} multiline placeholder="Accel Hub by Techstars · San Francisco, CA · Unsubscribe" maxLength={500} />
                  <SaveBar onSave={() => saveSection("email")} saving={saving} />
                </div>
              )}

              {/* ── Social ── */}
              {section === "social" && (
                <div className="space-y-4">
                  <SectionHeader title="Social & Web Links" desc="Links shown in the public landing page footer." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Website URL" value={form.social.websiteUrl} onChange={(v) => patch("social", "websiteUrl", v)} placeholder="https://example.com" />
                    <TextField label="LinkedIn URL" value={form.social.linkedinUrl} onChange={(v) => patch("social", "linkedinUrl", v)} placeholder="https://linkedin.com/company/…" />
                    <TextField label="Twitter / X URL" value={form.social.twitterUrl} onChange={(v) => patch("social", "twitterUrl", v)} placeholder="https://x.com/…" />
                    <TextField label="Instagram URL" value={form.social.instagramUrl} onChange={(v) => patch("social", "instagramUrl", v)} placeholder="https://instagram.com/…" />
                    <TextField label="Facebook URL" value={form.social.facebookUrl} onChange={(v) => patch("social", "facebookUrl", v)} placeholder="https://facebook.com/…" />
                    <TextField label="YouTube URL" value={form.social.youtubeUrl} onChange={(v) => patch("social", "youtubeUrl", v)} placeholder="https://youtube.com/@…" />
                    <TextField label="GitHub URL" value={form.social.githubUrl} onChange={(v) => patch("social", "githubUrl", v)} placeholder="https://github.com/…" />
                  </div>
                  <SaveBar onSave={() => saveSection("social")} saving={saving} />
                </div>
              )}

              {/* ── Preview ── */}
              {section === "preview" && (
                <div className="space-y-4">
                  <SectionHeader title="Live Preview" desc="See how the tenant branded landing page will look with current settings." />
                  <LivePreview form={form} />
                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-3">
                    <p className="text-xs font-semibold text-foreground">Publish controls</p>
                    <p className="text-xs text-muted-foreground">
                      When published, this branding will be applied platform-wide for all users in this tenant's organization.
                      CSS variables for primary, accent, and secondary colors will be injected automatically.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className={`gap-1.5 text-xs ${isActive ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                        variant={isActive ? "default" : "default"}
                        onClick={() => handlePublish(!isActive)}
                        disabled={publishing}
                      >
                        {publishing
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : (isActive ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />)
                        }
                        {isActive ? "Deactivate branding" : "Publish & activate branding"}
                      </Button>
                      {form.identity.slug && (
                        <a href={`/t/${form.identity.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                            <ExternalLink className="h-3 w-3" />
                            Open public page
                          </Button>
                        </a>
                      )}
                    </div>
                    {isActive && publishedAt && (
                      <p className="text-[11px] text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Last published: {new Date(publishedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-1">
      <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5 text-xs h-8">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Save changes
      </Button>
    </div>
  );
}
