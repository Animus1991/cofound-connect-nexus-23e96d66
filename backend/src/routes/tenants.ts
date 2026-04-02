import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  tenants,
  tenantBranding,
  tenantContentSettings,
  tenantLegalSettings,
  tenantEmailSettings,
  tenantSocialLinks,
  organizations,
  organizationMemberships,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";

export const tenantsRoutes = new Hono<AppEnv>();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve the tenant for the requesting user (must be org admin/owner). */
async function resolveTenantForUser(tenantId: string, userId: string) {
  const row = await db
    .select({
      tenant: tenants,
      org: organizations,
      membership: organizationMemberships,
    })
    .from(tenants)
    .innerJoin(organizations, eq(organizations.id, tenants.organizationId))
    .innerJoin(
      organizationMemberships,
      eq(organizationMemberships.organizationId, organizations.id),
    )
    .where(eq(tenants.id, tenantId))
    .get();

  if (!row) return null;
  if (row.membership.userId !== userId) return null;
  if (!["owner", "admin"].includes(row.membership.role)) return null;
  return row;
}

// ── Schema validators ─────────────────────────────────────────────────────────

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  backgroundStyle: z.enum(["light", "dark", "auto"]).optional(),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  logoAltText: z.string().max(120).optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  headingFont: z.string().max(80).optional().nullable(),
  bodyFont: z.string().max(80).optional().nullable(),
  cornerStyle: z.enum(["sharp", "default", "rounded"]).optional(),
});

const contentSchema = z.object({
  heroTitle: z.string().max(200).optional().nullable(),
  heroSubtitle: z.string().max(400).optional().nullable(),
  heroCtaLabel: z.string().max(60).optional().nullable(),
  heroCtaSecondaryLabel: z.string().max(60).optional().nullable(),
  platformDescription: z.string().max(1000).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  onboardingIntroText: z.string().max(500).optional().nullable(),
  onboardingStep1Text: z.string().max(300).optional().nullable(),
  onboardingStep2Text: z.string().max(300).optional().nullable(),
  dashboardWelcomeText: z.string().max(300).optional().nullable(),
  communityLabel: z.string().max(40).optional().nullable(),
  memberLabel: z.string().max(40).optional().nullable(),
  mentorLabel: z.string().max(40).optional().nullable(),
  matchLabel: z.string().max(40).optional().nullable(),
  roleLabels: z.record(z.string()).optional(),
  applyCtaLabel: z.string().max(60).optional().nullable(),
});

const legalSchema = z.object({
  privacyPolicyUrl: z.string().url().optional().nullable(),
  termsOfServiceUrl: z.string().url().optional().nullable(),
  cookiePolicyUrl: z.string().url().optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),
  supportPhone: z.string().max(40).optional().nullable(),
  supportUrl: z.string().url().optional().nullable(),
  companyName: z.string().max(120).optional().nullable(),
  companyAddress: z.string().max(300).optional().nullable(),
});

const emailSchema = z.object({
  fromName: z.string().max(80).optional().nullable(),
  fromEmail: z.string().email().optional().nullable(),
  replyToEmail: z.string().email().optional().nullable(),
  emailHeaderLogoUrl: z.string().url().optional().nullable(),
  emailSignature: z.string().max(1000).optional().nullable(),
  emailFooterBranding: z.string().max(500).optional().nullable(),
  subjectPrefix: z.string().max(60).optional().nullable(),
});

const socialSchema = z.object({
  websiteUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  youtubeUrl: z.string().url().optional().nullable(),
  githubUrl: z.string().url().optional().nullable(),
});

const tenantMetaSchema = z.object({
  displayName: z.string().max(120).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  aboutText: z.string().max(2000).optional().nullable(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(60).optional(),
});

// ── All routes require auth ───────────────────────────────────────────────────
tenantsRoutes.use("*", authMiddleware);

// ── GET /api/tenants/:id — full tenant config ─────────────────────────────────
tenantsRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const [branding, content, legal, email, social] = await Promise.all([
    db.select().from(tenantBranding).where(eq(tenantBranding.tenantId, tenantId)).get(),
    db.select().from(tenantContentSettings).where(eq(tenantContentSettings.tenantId, tenantId)).get(),
    db.select().from(tenantLegalSettings).where(eq(tenantLegalSettings.tenantId, tenantId)).get(),
    db.select().from(tenantEmailSettings).where(eq(tenantEmailSettings.tenantId, tenantId)).get(),
    db.select().from(tenantSocialLinks).where(eq(tenantSocialLinks.tenantId, tenantId)).get(),
  ]);

  return c.json({
    tenant: row.tenant,
    organization: row.org,
    branding: branding ?? null,
    content: content ?? null,
    legal: legal ?? null,
    email: email ?? null,
    social: social ?? null,
  });
});

// ── PUT /api/tenants/:id/meta — update tenant identity fields ─────────────────
tenantsRoutes.put("/:id/meta", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const body = await c.req.json();
  const parsed = tenantMetaSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  // Check slug uniqueness if being changed
  if (parsed.data.slug && parsed.data.slug !== row.tenant.slug) {
    const existing = await db.select().from(tenants).where(eq(tenants.slug, parsed.data.slug)).get();
    if (existing) return c.json({ error: "Slug already taken" }, 409);
  }

  await db.update(tenants)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(tenants.id, tenantId));

  return c.json({ success: true });
});

// ── PUT /api/tenants/:id/branding ─────────────────────────────────────────────
tenantsRoutes.put("/:id/branding", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const body = await c.req.json();
  const parsed = brandingSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const now = new Date().toISOString();
  const existing = await db.select().from(tenantBranding).where(eq(tenantBranding.tenantId, tenantId)).get();

  if (existing) {
    await db.update(tenantBranding)
      .set({ ...parsed.data, updatedAt: now })
      .where(eq(tenantBranding.tenantId, tenantId));
  } else {
    await db.insert(tenantBranding).values({ tenantId, ...parsed.data, updatedAt: now });
  }

  return c.json({ success: true });
});

// ── PUT /api/tenants/:id/content ──────────────────────────────────────────────
tenantsRoutes.put("/:id/content", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const body = await c.req.json();
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const now = new Date().toISOString();
  const payload = {
    ...parsed.data,
    roleLabels: parsed.data.roleLabels ? JSON.stringify(parsed.data.roleLabels) : undefined,
    updatedAt: now,
  };

  const existing = await db.select().from(tenantContentSettings).where(eq(tenantContentSettings.tenantId, tenantId)).get();
  if (existing) {
    await db.update(tenantContentSettings).set(payload).where(eq(tenantContentSettings.tenantId, tenantId));
  } else {
    await db.insert(tenantContentSettings).values({ tenantId, ...payload });
  }

  return c.json({ success: true });
});

// ── PUT /api/tenants/:id/legal ────────────────────────────────────────────────
tenantsRoutes.put("/:id/legal", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const body = await c.req.json();
  const parsed = legalSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const now = new Date().toISOString();
  const existing = await db.select().from(tenantLegalSettings).where(eq(tenantLegalSettings.tenantId, tenantId)).get();
  if (existing) {
    await db.update(tenantLegalSettings).set({ ...parsed.data, updatedAt: now }).where(eq(tenantLegalSettings.tenantId, tenantId));
  } else {
    await db.insert(tenantLegalSettings).values({ tenantId, ...parsed.data, updatedAt: now });
  }

  return c.json({ success: true });
});

// ── PUT /api/tenants/:id/email ────────────────────────────────────────────────
tenantsRoutes.put("/:id/email", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const body = await c.req.json();
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const now = new Date().toISOString();
  const existing = await db.select().from(tenantEmailSettings).where(eq(tenantEmailSettings.tenantId, tenantId)).get();
  if (existing) {
    await db.update(tenantEmailSettings).set({ ...parsed.data, updatedAt: now }).where(eq(tenantEmailSettings.tenantId, tenantId));
  } else {
    await db.insert(tenantEmailSettings).values({ tenantId, ...parsed.data, updatedAt: now });
  }

  return c.json({ success: true });
});

// ── PUT /api/tenants/:id/social ───────────────────────────────────────────────
tenantsRoutes.put("/:id/social", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const body = await c.req.json();
  const parsed = socialSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const now = new Date().toISOString();
  const existing = await db.select().from(tenantSocialLinks).where(eq(tenantSocialLinks.tenantId, tenantId)).get();
  if (existing) {
    await db.update(tenantSocialLinks).set({ ...parsed.data, updatedAt: now }).where(eq(tenantSocialLinks.tenantId, tenantId));
  } else {
    await db.insert(tenantSocialLinks).values({ tenantId, ...parsed.data, updatedAt: now });
  }

  return c.json({ success: true });
});

// ── POST /api/tenants/:id/publish ─────────────────────────────────────────────
tenantsRoutes.post("/:id/publish", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  const now = new Date().toISOString();
  await db.update(tenants)
    .set({ isBrandingActive: true, publishedAt: now, updatedAt: now })
    .where(eq(tenants.id, tenantId));

  return c.json({ success: true, publishedAt: now });
});

// ── POST /api/tenants/:id/unpublish ──────────────────────────────────────────
tenantsRoutes.post("/:id/unpublish", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  await db.update(tenants)
    .set({ isBrandingActive: false, updatedAt: new Date().toISOString() })
    .where(eq(tenants.id, tenantId));

  return c.json({ success: true });
});

// ── POST /api/tenants/:id/reset-branding ─────────────────────────────────────
tenantsRoutes.post("/:id/reset-branding", async (c) => {
  const userId = c.get("userId");
  const tenantId = c.req.param("id");

  const row = await resolveTenantForUser(tenantId, userId);
  if (!row) return c.json({ error: "Tenant not found or access denied" }, 404);

  await db.delete(tenantBranding).where(eq(tenantBranding.tenantId, tenantId));

  return c.json({ success: true });
});
