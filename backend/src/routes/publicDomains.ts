/**
 * /api/public/domains — unauthenticated domain resolution endpoints
 *
 * Used by the frontend at boot time to resolve the current hostname
 * to a tenant context. No auth required.
 *
 * GET /resolve?hostname=:hostname
 *   Resolves an incoming hostname to a tenant slug + config.
 *   Returns 200 with tenant data if found, 404 if no mapping exists.
 *
 * GET /check?hostname=:hostname
 *   Lightweight availability check (no branding data).
 *
 * GET /subdomain-available?sub=:sub
 *   Check whether a platform subdomain label is available.
 */

import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  tenantDomains, tenants, tenantBranding, tenantContentSettings,
  tenantLegalSettings, tenantEmailSettings, tenantSocialLinks,
} from "../db/schema.js";

const PLATFORM_ROOT_DOMAIN = "cofounderbay.com";

const router = new Hono();

// ── Helpers ────────────────────────────────────────────────────────────────

function normaliseDomain(raw: string): string {
  return (raw ?? "").toLowerCase().replace(/\.$/, "").replace(/:\d+$/, "").trim();
}

function isDevHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.endsWith(".local")
  );
}

/** Extract subdomain label from a platform hostname.
 *  "athens.cofounderbay.com" → "athens"
 *  "cofounderbay.com"        → null (root)
 */
function extractSubdomain(hostname: string): string | null {
  if (!hostname.endsWith(`.${PLATFORM_ROOT_DOMAIN}`)) return null;
  const sub = hostname.slice(0, hostname.length - PLATFORM_ROOT_DOMAIN.length - 1);
  if (!sub || sub === "www" || sub === "app" || sub === "api" || sub === "mail" || sub === "tenants") return null;
  return sub;
}

// ── GET /resolve?hostname=:hostname ────────────────────────────────────────
router.get("/resolve", async (c) => {
  const raw = c.req.query("hostname") ?? c.req.header("X-Forwarded-Host") ?? "";
  const hostname = normaliseDomain(raw);

  if (!hostname || isDevHost(hostname)) {
    return c.json({ resolved: false, reason: "no-domain" }, 200);
  }

  // 1. Look up by exact domain match in tenant_domains
  const domainRow = db.select({
    id: tenantDomains.id,
    tenantId: tenantDomains.tenantId,
    domainName: tenantDomains.domainName,
    domainType: tenantDomains.domainType,
    isPrimary: tenantDomains.isPrimary,
    isActive: tenantDomains.isActive,
    redirectBehavior: tenantDomains.redirectBehavior,
    redirectTarget: tenantDomains.redirectTarget,
    verificationStatus: tenantDomains.verificationStatus,
    sslStatus: tenantDomains.sslStatus,
  })
    .from(tenantDomains)
    .where(and(eq(tenantDomains.domainName, hostname), eq(tenantDomains.isActive, true)))
    .get();

  // 2. Fallback: check if it's a platform subdomain → match by slug
  let tenantId: string | null = null;
  let domainInfo: typeof domainRow | null = null;

  if (domainRow) {
    tenantId = domainRow.tenantId;
    domainInfo = domainRow;
  } else {
    const sub = extractSubdomain(hostname);
    if (sub) {
      const tenantRow = db.select({ id: tenants.id, slug: tenants.slug })
        .from(tenants)
        .where(eq(tenants.slug, sub))
        .get();
      if (tenantRow) {
        tenantId = tenantRow.id;
        // Check if there's also a registered subdomain entry
        const subDomainRow = db.select({
          id: tenantDomains.id,
          tenantId: tenantDomains.tenantId,
          domainName: tenantDomains.domainName,
          domainType: tenantDomains.domainType,
          isPrimary: tenantDomains.isPrimary,
          isActive: tenantDomains.isActive,
          redirectBehavior: tenantDomains.redirectBehavior,
          redirectTarget: tenantDomains.redirectTarget,
          verificationStatus: tenantDomains.verificationStatus,
          sslStatus: tenantDomains.sslStatus,
        })
          .from(tenantDomains)
          .where(and(eq(tenantDomains.tenantId, tenantRow.id), eq(tenantDomains.domainType, "subdomain")))
          .get();
        domainInfo = subDomainRow ?? null;
      }
    }
  }

  if (!tenantId) {
    return c.json({ resolved: false, reason: "no-tenant", hostname }, 200);
  }

  // Handle redirect behavior
  if (domainInfo?.redirectBehavior === "redirect" && domainInfo.redirectTarget) {
    return c.json({
      resolved: true,
      action: "redirect",
      redirectTo: domainInfo.redirectTarget,
      hostname,
    });
  }

  // Load full tenant config
  const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
  if (!tenant || !tenant.publishedAt) {
    return c.json({ resolved: false, reason: "tenant-not-published", hostname }, 200);
  }

  const branding = db.select().from(tenantBranding)
    .where(eq(tenantBranding.tenantId, tenantId)).get() ?? null;
  const content = db.select().from(tenantContentSettings)
    .where(eq(tenantContentSettings.tenantId, tenantId)).get() ?? null;
  const legal = db.select().from(tenantLegalSettings)
    .where(eq(tenantLegalSettings.tenantId, tenantId)).get() ?? null;
  const email = db.select().from(tenantEmailSettings)
    .where(eq(tenantEmailSettings.tenantId, tenantId)).get() ?? null;
  const social = db.select().from(tenantSocialLinks)
    .where(eq(tenantSocialLinks.tenantId, tenantId)).get() ?? null;

  return c.json({
    resolved: true,
    action: "serve",
    hostname,
    domainType: domainInfo?.domainType ?? "subdomain",
    isPrimary: domainInfo?.isPrimary ?? false,
    sslStatus: domainInfo?.sslStatus ?? "none",
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      displayName: tenant.displayName,
      description: tenant.description,
      aboutText: tenant.aboutText,
      isBrandingActive: tenant.isBrandingActive,
      publishedAt: tenant.publishedAt,
    },
    branding: branding ? {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      backgroundStyle: branding.backgroundStyle,
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      logoAltText: branding.logoAltText,
      heroImageUrl: branding.heroImageUrl,
      headingFont: branding.headingFont,
      bodyFont: branding.bodyFont,
      cornerStyle: branding.cornerStyle,
    } : null,
    content: content ? {
      heroTitle: content.heroTitle,
      heroSubtitle: content.heroSubtitle,
      heroCtaLabel: content.heroCtaLabel,
      heroCtaSecondaryLabel: content.heroCtaSecondaryLabel,
      platformDescription: content.platformDescription,
      tagline: content.tagline,
      onboardingIntroText: content.onboardingIntroText,
      dashboardWelcomeText: content.dashboardWelcomeText,
      communityLabel: content.communityLabel,
      memberLabel: content.memberLabel,
      mentorLabel: content.mentorLabel,
      matchLabel: content.matchLabel,
      roleLabels: JSON.parse(content.roleLabels),
      applyCtaLabel: content.applyCtaLabel,
    } : null,
    legal: legal ? {
      privacyPolicyUrl: legal.privacyPolicyUrl,
      termsOfServiceUrl: legal.termsOfServiceUrl,
      cookiePolicyUrl: legal.cookiePolicyUrl,
      supportEmail: legal.supportEmail,
      supportPhone: legal.supportPhone,
      supportUrl: legal.supportUrl,
      companyName: legal.companyName,
      companyAddress: legal.companyAddress,
    } : null,
    email: email ? {
      fromName: email.fromName,
      fromEmail: email.fromEmail,
    } : null,
    social: social ? {
      websiteUrl: social.websiteUrl,
      linkedinUrl: social.linkedinUrl,
      twitterUrl: social.twitterUrl,
      instagramUrl: social.instagramUrl,
      facebookUrl: social.facebookUrl,
      youtubeUrl: social.youtubeUrl,
      githubUrl: social.githubUrl,
    } : null,
  });
});

// ── GET /check?hostname=:hostname (lightweight) ────────────────────────────
router.get("/check", async (c) => {
  const raw = c.req.query("hostname") ?? "";
  const hostname = normaliseDomain(raw);
  if (!hostname) return c.json({ found: false }, 200);

  const domainRow = db.select({ tenantId: tenantDomains.tenantId, isActive: tenantDomains.isActive })
    .from(tenantDomains)
    .where(eq(tenantDomains.domainName, hostname))
    .get();

  if (domainRow) return c.json({ found: true, tenantId: domainRow.tenantId, isActive: domainRow.isActive });

  // Check by slug (subdomain)
  const sub = extractSubdomain(hostname);
  if (sub) {
    const t = db.select({ id: tenants.id, slug: tenants.slug })
      .from(tenants).where(eq(tenants.slug, sub)).get();
    if (t) return c.json({ found: true, tenantId: t.id, isActive: true, via: "slug" });
  }

  return c.json({ found: false, hostname });
});

// ── GET /subdomain-available?sub=:sub ──────────────────────────────────────
router.get("/subdomain-available", async (c) => {
  const sub = (c.req.query("sub") ?? "").toLowerCase().trim();
  if (!sub || sub.length < 2 || sub.length > 63) {
    return c.json({ available: false, reason: "invalid-length" });
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(sub)) {
    return c.json({ available: false, reason: "invalid-characters" });
  }

  const RESERVED = new Set([
    "www", "app", "api", "mail", "smtp", "ftp", "tenants", "cdn", "static",
    "assets", "admin", "dashboard", "help", "support", "blog", "status",
    "billing", "auth", "login", "signup", "docs", "dev", "staging", "prod",
  ]);
  if (RESERVED.has(sub)) return c.json({ available: false, reason: "reserved" });

  const hostname = `${sub}.${PLATFORM_ROOT_DOMAIN}`;
  const existing = db.select({ id: tenantDomains.id })
    .from(tenantDomains)
    .where(eq(tenantDomains.domainName, hostname))
    .get();
  if (existing) return c.json({ available: false, reason: "taken" });

  const tenantWithSlug = db.select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, sub))
    .get();
  if (tenantWithSlug) return c.json({ available: false, reason: "slug-taken" });

  return c.json({ available: true, hostname });
});

export default router;
