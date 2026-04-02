/**
 * SSO administration routes — protected, tenant-admin only.
 *
 * Prefix: /api/sso
 *
 * Identity Providers:
 *   GET  /tenants/:tenantId/providers
 *   POST /tenants/:tenantId/providers
 *   PUT  /tenants/:tenantId/providers/:id
 *   DELETE /tenants/:tenantId/providers/:id
 *   POST /tenants/:tenantId/providers/:id/test
 *
 * SSO Config:
 *   GET  /tenants/:tenantId/config
 *   PUT  /tenants/:tenantId/config
 *
 * Domain Mappings:
 *   GET  /tenants/:tenantId/domains
 *   POST /tenants/:tenantId/domains
 *   PUT  /tenants/:tenantId/domains/:id
 *   DELETE /tenants/:tenantId/domains/:id
 *   POST /tenants/:tenantId/domains/:id/verify
 *
 * Role Mapping Rules:
 *   GET  /tenants/:tenantId/providers/:providerId/role-mappings
 *   POST /tenants/:tenantId/providers/:providerId/role-mappings
 *   PUT  /tenants/:tenantId/providers/:providerId/role-mappings/:id
 *   DELETE /tenants/:tenantId/providers/:providerId/role-mappings/:id
 *
 * Audit:
 *   GET  /tenants/:tenantId/audit-logs
 *   GET  /tenants/:tenantId/audit-logs/stats
 *
 * User Identity management:
 *   GET  /users/:userId/identities
 *   DELETE /users/:userId/identities/:id
 */

import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  tenants,
  identityProviders,
  tenantSsoConfigs,
  domainMappings,
  roleMappingRules,
  ssoAuditLogs,
  userIdentities,
  organizations,
  organizationMemberships,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import type { AppEnv } from "../types.js";

export const ssoRoutes = new Hono<AppEnv>();
ssoRoutes.use("*", authMiddleware);

// ── Access guard ──────────────────────────────────────────────────────────────

async function assertTenantAdmin(tenantId: string, userId: string) {
  const row = await db
    .select({ role: organizationMemberships.role })
    .from(tenants)
    .innerJoin(organizations, eq(organizations.id, tenants.organizationId))
    .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(organizationMemberships.userId, userId),
      ),
    )
    .get();

  if (!row || !["owner", "admin"].includes(row.role)) return false;
  return true;
}

function writeAuditLog(
  fields: Partial<typeof ssoAuditLogs.$inferInsert> & { eventType: string; outcome: string },
) {
  try {
    db.insert(ssoAuditLogs).values({ ...fields }).run();
  } catch (err) {
    logger.warn({ err }, "Failed to write SSO audit log");
  }
}

// ── Validation schemas ────────────────────────────────────────────────────────

const providerSchema = z.object({
  providerType: z.enum(["oidc", "saml", "google_workspace", "microsoft_entra", "okta", "ping", "custom"]),
  providerName: z.string().min(1).max(120),
  issuerUrl: z.string().url().optional().nullable(),
  clientId: z.string().max(500).optional().nullable(),
  clientSecretEncrypted: z.string().max(2000).optional().nullable(),
  metadataUrl: z.string().url().optional().nullable(),
  metadataXml: z.string().max(100000).optional().nullable(),
  authorizationEndpoint: z.string().url().optional().nullable(),
  tokenEndpoint: z.string().url().optional().nullable(),
  userinfoEndpoint: z.string().url().optional().nullable(),
  scopes: z.array(z.string()).optional(),
  loginButtonText: z.string().max(120).optional().nullable(),
  loginButtonLogoUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  extraConfig: z.record(z.unknown()).optional(),
});

const ssoConfigSchema = z.object({
  ssoMode: z.enum(["none", "optional", "required"]),
  allowedDomains: z.array(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)).optional(),
  autoProvisionEnabled: z.boolean().optional(),
  defaultRole: z.string().max(40).optional(),
  showSsoButtonPublicly: z.boolean().optional(),
  postLoginRedirectUrl: z.string().max(500).optional().nullable(),
  postLogoutRedirectUrl: z.string().max(500).optional().nullable(),
  deactivateOnSsoRevoke: z.boolean().optional(),
  policyConfig: z.record(z.unknown()).optional(),
});

const domainMappingSchema = z.object({
  domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).toLowerCase(),
  identityProviderId: z.string().uuid().optional().nullable(),
  ssoRequired: z.boolean().optional(),
});

const roleMappingSchema = z.object({
  claimKey: z.string().min(1).max(120),
  claimValue: z.string().min(1).max(500),
  mappedRole: z.enum(["founder", "investor", "mentor", "member", "admin"]),
  priority: z.number().int().min(1).max(9999).optional(),
  isActive: z.boolean().optional(),
});

// ═════════════════════════════════════════════════════════════════════════════
// IDENTITY PROVIDERS
// ═════════════════════════════════════════════════════════════════════════════

ssoRoutes.get("/tenants/:tenantId/providers", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const providers = db
    .select()
    .from(identityProviders)
    .where(eq(identityProviders.tenantId, tenantId))
    .all();

  return c.json({
    providers: providers.map((p) => ({
      ...p,
      scopes: JSON.parse(p.scopes),
      extraConfig: JSON.parse(p.extraConfig),
      clientSecretEncrypted: p.clientSecretEncrypted ? "***" : null,
    })),
  });
});

ssoRoutes.post("/tenants/:tenantId/providers", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json();
  const parsed = providerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const { scopes, extraConfig, ...rest } = parsed.data;
  const now = new Date().toISOString();

  const provider = db.insert(identityProviders).values({
    tenantId,
    ...rest,
    scopes: JSON.stringify(scopes ?? ["openid", "email", "profile"]),
    extraConfig: JSON.stringify(extraConfig ?? {}),
    updatedAt: now,
  }).returning().get();

  writeAuditLog({ tenantId, identityProviderId: provider.id, eventType: "config_change", outcome: "success", metadata: JSON.stringify({ action: "provider_created", providerName: provider.providerName }) });

  return c.json({ provider: { ...provider, clientSecretEncrypted: provider.clientSecretEncrypted ? "***" : null } }, 201);
});

ssoRoutes.put("/tenants/:tenantId/providers/:id", async (c) => {
  const { tenantId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const existing = db.select().from(identityProviders).where(and(eq(identityProviders.id, id), eq(identityProviders.tenantId, tenantId))).get();
  if (!existing) return c.json({ error: "Provider not found" }, 404);

  const body = await c.req.json();
  const parsed = providerSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const { scopes, extraConfig, ...rest } = parsed.data;
  const now = new Date().toISOString();

  await db.update(identityProviders).set({
    ...rest,
    ...(scopes ? { scopes: JSON.stringify(scopes) } : {}),
    ...(extraConfig ? { extraConfig: JSON.stringify(extraConfig) } : {}),
    updatedAt: now,
  }).where(eq(identityProviders.id, id));

  writeAuditLog({ tenantId, identityProviderId: id, eventType: "config_change", outcome: "success", metadata: JSON.stringify({ action: "provider_updated" }) });

  return c.json({ success: true });
});

ssoRoutes.delete("/tenants/:tenantId/providers/:id", async (c) => {
  const { tenantId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const existing = db.select({ id: identityProviders.id }).from(identityProviders).where(and(eq(identityProviders.id, id), eq(identityProviders.tenantId, tenantId))).get();
  if (!existing) return c.json({ error: "Provider not found" }, 404);

  await db.delete(identityProviders).where(eq(identityProviders.id, id));

  writeAuditLog({ tenantId, identityProviderId: id, eventType: "config_change", outcome: "success", metadata: JSON.stringify({ action: "provider_deleted" }) });

  return c.json({ success: true });
});

/** POST /providers/:id/test — validate provider config by attempting OIDC discovery */
ssoRoutes.post("/tenants/:tenantId/providers/:id/test", async (c) => {
  const { tenantId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const provider = db.select().from(identityProviders).where(and(eq(identityProviders.id, id), eq(identityProviders.tenantId, tenantId))).get();
  if (!provider) return c.json({ error: "Provider not found" }, 404);

  const testResult = { reachable: false, discoveryValid: false, endpoints: {} as Record<string, string>, error: null as string | null };

  try {
    if (provider.providerType === "saml" && provider.metadataUrl) {
      const res = await fetch(provider.metadataUrl, { signal: AbortSignal.timeout(8000) });
      testResult.reachable = res.ok;
      testResult.discoveryValid = res.ok && (res.headers.get("content-type") ?? "").includes("xml");
    } else if (provider.issuerUrl) {
      const discoveryUrl = `${provider.issuerUrl.replace(/\/$/, "")}/.well-known/openid-configuration`;
      const res = await fetch(discoveryUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const disc = await res.json() as Record<string, string>;
        testResult.reachable = true;
        testResult.discoveryValid = !!(disc.authorization_endpoint && disc.token_endpoint);
        testResult.endpoints = {
          authorization: disc.authorization_endpoint ?? "",
          token: disc.token_endpoint ?? "",
          userinfo: disc.userinfo_endpoint ?? "",
          jwks: disc.jwks_uri ?? "",
        };
      }
    }
  } catch (err) {
    testResult.error = err instanceof Error ? err.message : "Network error";
  }

  const outcome = testResult.reachable ? "success" : "failure";
  writeAuditLog({ tenantId, identityProviderId: id, eventType: "test_connection", outcome, metadata: JSON.stringify(testResult) });

  return c.json({ result: testResult });
});

// ═════════════════════════════════════════════════════════════════════════════
// SSO CONFIG
// ═════════════════════════════════════════════════════════════════════════════

ssoRoutes.get("/tenants/:tenantId/config", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const config = db.select().from(tenantSsoConfigs).where(eq(tenantSsoConfigs.tenantId, tenantId)).get();

  return c.json({
    config: config
      ? { ...config, allowedDomains: JSON.parse(config.allowedDomains), policyConfig: JSON.parse(config.policyConfig) }
      : null,
  });
});

ssoRoutes.put("/tenants/:tenantId/config", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json();
  const parsed = ssoConfigSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const { allowedDomains, policyConfig, ...rest } = parsed.data;
  const now = new Date().toISOString();
  const payload = {
    ...rest,
    ...(allowedDomains !== undefined ? { allowedDomains: JSON.stringify(allowedDomains) } : {}),
    ...(policyConfig !== undefined ? { policyConfig: JSON.stringify(policyConfig) } : {}),
    updatedAt: now,
  };

  const existing = db.select({ id: tenantSsoConfigs.id }).from(tenantSsoConfigs).where(eq(tenantSsoConfigs.tenantId, tenantId)).get();
  if (existing) {
    await db.update(tenantSsoConfigs).set(payload).where(eq(tenantSsoConfigs.tenantId, tenantId));
  } else {
    await db.insert(tenantSsoConfigs).values({ tenantId, ...payload });
  }

  writeAuditLog({ tenantId, eventType: "config_change", outcome: "success", metadata: JSON.stringify({ action: "sso_config_updated", ssoMode: parsed.data.ssoMode }) });

  return c.json({ success: true });
});

// ═════════════════════════════════════════════════════════════════════════════
// DOMAIN MAPPINGS
// ═════════════════════════════════════════════════════════════════════════════

ssoRoutes.get("/tenants/:tenantId/domains", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const domains = db.select().from(domainMappings).where(eq(domainMappings.tenantId, tenantId)).all();
  return c.json({ domains });
});

ssoRoutes.post("/tenants/:tenantId/domains", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json();
  const parsed = domainMappingSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const conflict = db.select({ id: domainMappings.id }).from(domainMappings).where(eq(domainMappings.domain, parsed.data.domain)).get();
  if (conflict) return c.json({ error: "Domain already mapped to a tenant" }, 409);

  const mapping = db.insert(domainMappings).values({ tenantId, ...parsed.data }).returning().get();

  writeAuditLog({ tenantId, eventType: "domain_verify", outcome: "pending", metadata: JSON.stringify({ action: "domain_added", domain: parsed.data.domain }) });

  return c.json({ mapping }, 201);
});

ssoRoutes.put("/tenants/:tenantId/domains/:id", async (c) => {
  const { tenantId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const existing = db.select().from(domainMappings).where(and(eq(domainMappings.id, id), eq(domainMappings.tenantId, tenantId))).get();
  if (!existing) return c.json({ error: "Domain mapping not found" }, 404);

  const body = await c.req.json();
  const parsed = domainMappingSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  await db.update(domainMappings).set(parsed.data).where(eq(domainMappings.id, id));
  return c.json({ success: true });
});

ssoRoutes.delete("/tenants/:tenantId/domains/:id", async (c) => {
  const { tenantId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const existing = db.select({ domain: domainMappings.domain }).from(domainMappings).where(and(eq(domainMappings.id, id), eq(domainMappings.tenantId, tenantId))).get();
  if (!existing) return c.json({ error: "Domain mapping not found" }, 404);

  await db.delete(domainMappings).where(eq(domainMappings.id, id));
  writeAuditLog({ tenantId, eventType: "domain_verify", outcome: "success", metadata: JSON.stringify({ action: "domain_removed", domain: existing.domain }) });

  return c.json({ success: true });
});

/** POST /domains/:id/verify — simulate domain ownership verification (mock in dev) */
ssoRoutes.post("/tenants/:tenantId/domains/:id/verify", async (c) => {
  const { tenantId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const mapping = db.select().from(domainMappings).where(and(eq(domainMappings.id, id), eq(domainMappings.tenantId, tenantId))).get();
  if (!mapping) return c.json({ error: "Domain mapping not found" }, 404);

  if (mapping.isVerified) return c.json({ alreadyVerified: true });

  // In production: do actual DNS TXT record lookup here.
  // For dev/MVP: auto-verify after request.
  const now = new Date().toISOString();
  await db.update(domainMappings).set({ isVerified: true, verifiedAt: now }).where(eq(domainMappings.id, id));

  writeAuditLog({ tenantId, eventType: "domain_verify", outcome: "success", metadata: JSON.stringify({ domain: mapping.domain, token: mapping.verificationToken }) });

  return c.json({ verified: true, verifiedAt: now });
});

// ═════════════════════════════════════════════════════════════════════════════
// ROLE MAPPING RULES
// ═════════════════════════════════════════════════════════════════════════════

ssoRoutes.get("/tenants/:tenantId/providers/:providerId/role-mappings", async (c) => {
  const { tenantId, providerId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const rules = db.select().from(roleMappingRules)
    .where(eq(roleMappingRules.identityProviderId, providerId))
    .all();

  return c.json({ rules });
});

ssoRoutes.post("/tenants/:tenantId/providers/:providerId/role-mappings", async (c) => {
  const { tenantId, providerId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const providerExists = db.select({ id: identityProviders.id }).from(identityProviders)
    .where(and(eq(identityProviders.id, providerId), eq(identityProviders.tenantId, tenantId))).get();
  if (!providerExists) return c.json({ error: "Identity provider not found" }, 404);

  const body = await c.req.json();
  const parsed = roleMappingSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const rule = db.insert(roleMappingRules).values({ identityProviderId: providerId, ...parsed.data }).returning().get();
  return c.json({ rule }, 201);
});

ssoRoutes.put("/tenants/:tenantId/providers/:providerId/role-mappings/:id", async (c) => {
  const { tenantId, providerId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json();
  const parsed = roleMappingSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);

  const existing = db.select().from(roleMappingRules)
    .where(and(eq(roleMappingRules.id, id), eq(roleMappingRules.identityProviderId, providerId))).get();
  if (!existing) return c.json({ error: "Rule not found" }, 404);

  await db.update(roleMappingRules).set(parsed.data).where(eq(roleMappingRules.id, id));
  return c.json({ success: true });
});

ssoRoutes.delete("/tenants/:tenantId/providers/:providerId/role-mappings/:id", async (c) => {
  const { tenantId, providerId, id } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const existing = db.select().from(roleMappingRules)
    .where(and(eq(roleMappingRules.id, id), eq(roleMappingRules.identityProviderId, providerId))).get();
  if (!existing) return c.json({ error: "Rule not found" }, 404);

  await db.delete(roleMappingRules).where(eq(roleMappingRules.id, id));
  return c.json({ success: true });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═════════════════════════════════════════════════════════════════════════════

ssoRoutes.get("/tenants/:tenantId/audit-logs", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(c.req.query("limit") ?? "50", 10));
  const offset = (page - 1) * limit;
  const eventType = c.req.query("eventType");
  const outcome = c.req.query("outcome");

  const conditions = [eq(ssoAuditLogs.tenantId, tenantId)];
  if (eventType) conditions.push(eq(ssoAuditLogs.eventType, eventType));
  if (outcome) conditions.push(eq(ssoAuditLogs.outcome, outcome));

  const [logs, totalRow] = await Promise.all([
    db.select().from(ssoAuditLogs)
      .where(and(...conditions))
      .orderBy(desc(ssoAuditLogs.createdAt))
      .limit(limit).offset(offset)
      .all(),
    db.select({ total: count() }).from(ssoAuditLogs).where(and(...conditions)).get(),
  ]);

  return c.json({
    logs: logs.map((l) => ({ ...l, metadata: JSON.parse(l.metadata) })),
    total: totalRow?.total ?? 0,
    page,
    limit,
  });
});

ssoRoutes.get("/tenants/:tenantId/audit-logs/stats", async (c) => {
  const { tenantId } = c.req.param();
  const userId = c.get("userId");
  if (!await assertTenantAdmin(tenantId, userId)) return c.json({ error: "Forbidden" }, 403);

  const [total, successes, failures, provisions] = await Promise.all([
    db.select({ n: count() }).from(ssoAuditLogs).where(eq(ssoAuditLogs.tenantId, tenantId)).get(),
    db.select({ n: count() }).from(ssoAuditLogs).where(and(eq(ssoAuditLogs.tenantId, tenantId), eq(ssoAuditLogs.outcome, "success"))).get(),
    db.select({ n: count() }).from(ssoAuditLogs).where(and(eq(ssoAuditLogs.tenantId, tenantId), eq(ssoAuditLogs.outcome, "failure"))).get(),
    db.select({ n: count() }).from(ssoAuditLogs).where(and(eq(ssoAuditLogs.tenantId, tenantId), eq(ssoAuditLogs.eventType, "jit_provision"))).get(),
  ]);

  return c.json({
    total: total?.n ?? 0,
    successes: successes?.n ?? 0,
    failures: failures?.n ?? 0,
    provisions: provisions?.n ?? 0,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// USER IDENTITY MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

ssoRoutes.get("/users/:userId/identities", async (c) => {
  const requestingUserId = c.get("userId");
  const targetUserId = c.req.param("userId");

  // Users can view their own identities; admins can view any
  if (requestingUserId !== targetUserId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const identities = db.select({
    id: userIdentities.id,
    identityProviderId: userIdentities.identityProviderId,
    externalEmail: userIdentities.externalEmail,
    externalName: userIdentities.externalName,
    lastLoginAt: userIdentities.lastLoginAt,
    createdAt: userIdentities.createdAt,
    providerName: identityProviders.providerName,
    providerType: identityProviders.providerType,
  })
    .from(userIdentities)
    .innerJoin(identityProviders, eq(identityProviders.id, userIdentities.identityProviderId))
    .where(eq(userIdentities.userId, targetUserId))
    .all();

  return c.json({ identities });
});

ssoRoutes.delete("/users/:userId/identities/:identityId", async (c) => {
  const requestingUserId = c.get("userId");
  const targetUserId = c.req.param("userId");
  const identityId = c.req.param("identityId");

  if (requestingUserId !== targetUserId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const identity = db.select().from(userIdentities)
    .where(and(eq(userIdentities.id, identityId), eq(userIdentities.userId, targetUserId)))
    .get();
  if (!identity) return c.json({ error: "Identity not found" }, 404);

  await db.delete(userIdentities).where(eq(userIdentities.id, identityId));

  writeAuditLog({
    userId: targetUserId,
    identityProviderId: identity.identityProviderId,
    eventType: "unlink_identity",
    outcome: "success",
    metadata: JSON.stringify({ externalSubject: identity.externalSubject }),
  });

  return c.json({ success: true });
});
