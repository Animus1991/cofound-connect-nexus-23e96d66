import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  tenants,
  tenantBranding,
  tenantContentSettings,
  tenantLegalSettings,
  tenantEmailSettings,
  tenantSocialLinks,
  organizations,
} from "../db/schema.js";

export const publicTenantsRoutes = new Hono();

/**
 * GET /api/public/tenants/:slug
 *
 * Unauthenticated endpoint that returns all tenant branding data
 * needed by the frontend to render the branded landing page and
 * inject CSS variables. Returns 404 if the tenant is not active.
 */
publicTenantsRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .get();

  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, tenant.organizationId))
    .get();

  const [branding, content, legal, email, social] = await Promise.all([
    db.select().from(tenantBranding).where(eq(tenantBranding.tenantId, tenant.id)).get(),
    db.select().from(tenantContentSettings).where(eq(tenantContentSettings.tenantId, tenant.id)).get(),
    db.select().from(tenantLegalSettings).where(eq(tenantLegalSettings.tenantId, tenant.id)).get(),
    db.select().from(tenantEmailSettings).where(eq(tenantEmailSettings.tenantId, tenant.id)).get(),
    db.select().from(tenantSocialLinks).where(eq(tenantSocialLinks.tenantId, tenant.id)).get(),
  ]);

  return c.json({
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      displayName: tenant.displayName ?? org?.name ?? "CoFounderBay",
      description: tenant.description ?? org?.description ?? null,
      aboutText: tenant.aboutText ?? null,
      isBrandingActive: tenant.isBrandingActive,
      publishedAt: tenant.publishedAt,
    },
    organization: org
      ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          type: org.type,
          logoUrl: org.logoUrl,
          websiteUrl: org.websiteUrl,
        }
      : null,
    branding: branding ?? null,
    content: content ?? null,
    legal: legal ?? null,
    email: email ?? null,
    social: social ?? null,
  });
});

/**
 * GET /api/public/tenants/:slug/check
 *
 * Lightweight existence + active check — used by frontend to decide
 * whether to activate tenant branding without loading the full config.
 */
publicTenantsRoutes.get("/:slug/check", async (c) => {
  const slug = c.req.param("slug");
  const tenant = await db
    .select({ id: tenants.id, isBrandingActive: tenants.isBrandingActive })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .get();

  if (!tenant) return c.json({ exists: false, active: false });
  return c.json({ exists: true, active: tenant.isBrandingActive, id: tenant.id });
});
