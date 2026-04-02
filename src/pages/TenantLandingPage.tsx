import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenant, type TenantConfig } from "@/contexts/TenantContext";
import {
  ArrowRight,
  Users,
  Sparkles,
  Rocket,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Mail,
  ExternalLink,
  CheckCircle2,
  Zap,
  Target,
  MessageSquare,
  Building2,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ── Feature bullets (generic — overridden by tenant copy where available) ─────

const DEFAULT_FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    desc: "Intelligent co-founder and collaborator matching based on your skills, goals, and working style.",
  },
  {
    icon: Users,
    title: "Curated Community",
    desc: "Access a vetted network of founders, investors, and domain experts actively building.",
  },
  {
    icon: Target,
    title: "Milestone Tracking",
    desc: "Keep your startup on track with shared milestones, updates, and accountability tools.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    desc: "Reach out directly with in-platform messaging, no email gatekeeping.",
  },
  {
    icon: Building2,
    title: "Organizations",
    desc: "Build and manage your team, invite collaborators, and track progress together.",
  },
  {
    icon: Zap,
    title: "Mentorship Access",
    desc: "Book sessions with experienced mentors across product, engineering, growth, and fundraising.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SocialLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TenantLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { activateTenant, tenant: ctxTenant, isLoading } = useTenant();
  const [localTenant, setLocalTenant] = useState<TenantConfig | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); return; }
    activateTenant(slug).then(() => {
      // ctxTenant is updated via context; also keep local copy
    });
  }, [slug, activateTenant]);

  // Mirror context tenant into local state so we can render
  useEffect(() => {
    if (ctxTenant && ctxTenant.slug === slug) {
      setLocalTenant(ctxTenant);
    }
  }, [ctxTenant, slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || (!isLoading && !localTenant && !ctxTenant)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Organization not found</h1>
        <p className="text-muted-foreground max-w-xs">
          The link you followed may be incorrect or this organization's page is no longer active.
        </p>
        <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to CoFounderBay
        </Button>
      </div>
    );
  }

  const t = localTenant ?? ctxTenant;
  if (!t) return null;

  const branding = t.branding;
  const content = t.content;
  const legal = t.legal;
  const social = t.social;
  const org = t.organization;

  const name = t.displayName || org?.name || "CoFounderBay";
  const logoUrl = branding?.logoUrl ?? org?.logoUrl;
  const heroImage = branding?.heroImageUrl;
  const heroTitle = content?.heroTitle ?? `Welcome to ${name}`;
  const heroSubtitle = content?.heroSubtitle ?? "Connect with co-founders, mentors, and collaborators to build something remarkable.";
  const heroCta = content?.heroCtaLabel ?? "Get Started";
  const heroCtaSecondary = content?.heroCtaSecondaryLabel ?? "Learn More";
  const platformDesc = content?.platformDescription ?? `${name} is a curated platform for founders, operators, and builders.`;
  const tagline = content?.tagline ?? "Build your network. Build your startup.";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={branding?.logoAltText ?? name}
                className="h-7 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <span className="font-display text-sm font-semibold text-foreground hidden sm:block">
              {name}
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="text-sm gap-1.5">
                {content?.applyCtaLabel ?? "Join now"}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-24 sm:py-32 text-center"
        style={heroImage ? { backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {heroImage && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
        )}
        {/* Background gradient (shown when no hero image) */}
        {!heroImage && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />
        )}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-6 max-w-3xl"
        >
          {t.isBrandingActive && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3" />
              {tagline}
            </Badge>
          )}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
            {heroTitle}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-7 h-12 text-base shadow-lg shadow-primary/25">
                {heroCta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {heroCtaSecondary && (
              <Link to="/demo">
                <Button size="lg" variant="outline" className="h-12 px-7 text-base">
                  {heroCtaSecondary}
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── Platform description ── */}
      {platformDesc && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            {platformDesc}
          </motion.p>
        </section>
      )}

      {/* ── Features grid ── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Everything you need to build
          </h2>
          <p className="mt-2 text-muted-foreground">
            A complete toolkit for founders at every stage.
          </p>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_4px_20px_hsl(var(--primary)/0.1)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1.5">
                {feat.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-primary/8 border border-primary/20 p-10 sm:p-14 text-center flex flex-col items-center gap-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Join {name} and connect with co-founders, mentors, and a community of builders.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/25">
                {content?.applyCtaLabel ?? "Create free account"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {legal?.supportEmail && (
              <a href={`mailto:${legal.supportEmail}`}>
                <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base">
                  <Mail className="h-4 w-4" />
                  Contact us
                </Button>
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {(["Free to join", "No credit card required", "Cancel anytime"] as const).map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border/50 bg-secondary/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="h-6 w-auto max-w-[100px] object-contain opacity-70" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/80">
                  <Rocket className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <span className="text-sm font-semibold text-foreground">{name}</span>
            </div>

            {/* Legal links */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {legal?.privacyPolicyUrl ? (
                <a href={legal.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</a>
              ) : (
                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              )}
              {legal?.termsOfServiceUrl ? (
                <a href={legal.termsOfServiceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</a>
              ) : (
                <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              )}
              {legal?.cookiePolicyUrl && (
                <a href={legal.cookiePolicyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Cookies</a>
              )}
              {legal?.supportEmail && (
                <a href={`mailto:${legal.supportEmail}`} className="hover:text-foreground transition-colors">Support</a>
              )}
            </div>

            {/* Social links */}
            {social && (
              <div className="flex items-center gap-1.5">
                {social.websiteUrl && <SocialLink href={social.websiteUrl} icon={Globe} label="Website" />}
                {social.linkedinUrl && <SocialLink href={social.linkedinUrl} icon={Linkedin} label="LinkedIn" />}
                {social.twitterUrl && <SocialLink href={social.twitterUrl} icon={Twitter} label="Twitter / X" />}
                {social.githubUrl && <SocialLink href={social.githubUrl} icon={Github} label="GitHub" />}
                {org?.websiteUrl && !social.websiteUrl && (
                  <SocialLink href={org.websiteUrl} icon={ExternalLink} label="Website" />
                )}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-border/30 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {legal?.companyName ?? name}. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Powered by <Link to="/" className="ml-1 font-medium text-primary hover:underline">CoFounderBay</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
