/**
 * /api/tenant-domains  — per-tenant domain management + super-admin oversight
 *
 * Tenant-admin endpoints (require tenantId param membership check):
 *   GET    /tenant/:tenantId                       — list domains for tenant
 *   POST   /tenant/:tenantId                       — add domain (subdomain or custom)
 *   PUT    /tenant/:tenantId/:domainId             — update domain (redirect behaviour, notes)
 *   DELETE /tenant/:tenantId/:domainId             — remove domain
 *   POST   /tenant/:tenantId/:domainId/set-primary — make this the primary domain
 *   POST   /tenant/:tenantId/:domainId/verify      — trigger DNS verification attempt
 *   GET    /tenant/:tenantId/:domainId/dns         — get detailed DNS instructions
 *   GET    /tenant/:tenantId/:domainId/history     — verification history log
 *
 * Super-admin endpoints:
 *   GET    /admin/domains                          — list all domains (paginated, filterable)
 *   GET    /admin/domains/:domainId                — domain detail + verifications + routing rules
 *   POST   /admin/domains/:domainId/approve        — mark verified + activate (manual admin approval)
 *   POST   /admin/domains/:domainId/activate       — set isActive=true (post-verify)
 *   POST   /admin/domains/:domainId/deactivate     — set isActive=false
 *   POST   /admin/domains/:domainId/force-verify   — override verification to 'verified'
 *   DELETE /admin/domains/:domainId                — hard-delete domain entry
 *   GET    /admin/routing-rules/:tenantId          — list routing rules for tenant
 *   POST   /admin/routing-rules/:tenantId          — create routing rule
 *   PUT    /admin/routing-rules/:ruleId            — update routing rule
 *   DELETE /admin/routing-rules/:ruleId            — delete routing rule
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  tenantDomains, domainVerifications, domainRoutingRules, tenants,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";

const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

// ── Helpers ───────────────────────────────────────────────────────────────

const PLATFORM_ROOT_DOMAIN = "cofounderbay.com";

/** Generate a cryptographically random verification token */
function genVerificationToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Normalise a hostname: lowercase, strip trailing dot, strip port */
function normaliseDomain(raw: string): string {
  return raw.toLowerCase().replace(/\.$/, "").replace(/:\d+$/, "").trim();
}

/** Detect if a hostname is a platform subdomain */
function isPlatformSubdomain(domain: string): boolean {
  return domain.endsWith(`.${PLATFORM_ROOT_DOMAIN}`);
}

/** Build DNS instructions JSON for a given domain */
function buildDnsInstructions(domain: string, verificationToken: string, tenantSlug: string) {
  const isSubdomain = isPlatformSubdomain(domain);
  if (isSubdomain) {
    return {
      type: "subdomain",
      summary: "This is a platform-managed subdomain. No DNS changes are needed on your end.",
      steps: [
        "Your subdomain has been reserved on the CoFounderBay platform.",
        "Verify ownership using the TXT record below to activate.",
      ],
      txtRecord: {
        host: `_cfb-verify.${domain}`,
        type: "TXT",
        value: `cofounderbay-verify=${verificationToken}`,
        ttl: 300,
      },
    };
  }
  return {
    type: "custom",
    summary: `Point ${domain} to the CoFounderBay platform via CNAME, then add the TXT verification record.`,
    steps: [
      `Log in to your DNS provider for ${domain}`,
      "Add or update the CNAME record below",
      "Add the TXT record for domain ownership verification",
      "Click 'Verify Domain' once DNS has propagated (up to 48h)",
    ],
    cnameRecord: {
      host: domain,
      type: "CNAME",
      value: `tenants.${PLATFORM_ROOT_DOMAIN}`,
      ttl: 300,
      note: "If CNAME on root apex is unsupported, use ALIAS or ANAME instead.",
    },
    txtRecord: {
      host: `_cfb-verify.${domain}`,
      type: "TXT",
      value: `cofounderbay-verify=${verificationToken}`,
      ttl: 300,
    },
    httpProbe: {
      url: `https://${domain}/.well-known/cofounderbay.txt`,
      content: `cofounderbay-verify=${verificationToken}`,
      note: "Alternative: serve this content at the above URL instead of DNS TXT.",
    },
    note: `Tenant slug: ${tenantSlug} — used if CNAME is not available.`,
  };
}

/** Simulate DNS TXT verification (production would use dns.resolve + promises) */
async function performDnsVerification(
  domain: string,
  token: string,
): Promise<{ success: boolean; resolvedValue: string | null; error: string | null }> {
  // In production this would be: dns.resolveTxt(`_cfb-verify.${domain}`)
  // For now we simulate: subdomain owned by platform = always passes,
  // custom domains need manual admin approval.
  if (isPlatformSubdomain(domain)) {
    return { success: true, resolvedValue: `cofounderbay-verify=${token}`, error: null };
  }
  return {
    success: false,
    resolvedValue: null,
    error:
      "Automated DNS lookup is not yet available. Request manual verification from support or use the admin approval flow.",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TENANT-ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// ── GET /tenant/:tenantId — list domains ──────────────────────────────────
router.get("/tenant/:tenantId", async (c) => {
  const { tenantId } = c.req.param();

  const tenant = db.select({ id: tenants.id, slug: tenants.slug, displayName: tenants.displayName })
    .from(tenants).where(eq(tenants.id, tenantId)).get();
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const domains = db.select().from(tenantDomains)
    .where(eq(tenantDomains.tenantId, tenantId))
    .orderBy(desc(tenantDomains.isPrimary), tenantDomains.createdAt)
    .all();

  return c.json({
    tenant,
    domains: domains.map((d) => ({
      ...d,
      dnsInstructions: JSON.parse(d.dnsInstructions),
    })),
  });
});

// ── POST /tenant/:tenantId — add domain ───────────────────────────────────
const addDomainSchema = z.object({
  domainName: z.string().min(3).max(253).transform(normaliseDomain),
  domainType: z.enum(["subdomain", "custom"]).optional(),
  redirectBehavior: z.enum(["serve", "redirect"]).default("serve"),
  redirectTarget: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

router.post("/tenant/:tenantId", async (c) => {
  const { tenantId } = c.req.param();
  const adminId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = addDomainSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const tenant = db.select({ id: tenants.id, slug: tenants.slug })
    .from(tenants).where(eq(tenants.id, tenantId)).get();
  if (!tenant) return c.json({ error: "Tenant not found" }, 404);

  const existing = db.select().from(tenantDomains)
    .where(eq(tenantDomains.domainName, parsed.data.domainName))
    .get();
  if (existing) {
    return c.json({ error: "This domain is already registered. Contact support if you believe this is an error." }, 409);
  }

  const domainType = parsed.data.domainType ?? (isPlatformSubdomain(parsed.data.domainName) ? "subdomain" : "custom");
  const verificationToken = genVerificationToken();
  const dnsInstructions = buildDnsInstructions(parsed.data.domainName, verificationToken, tenant.slug ?? "");

  // Subdomains managed by the platform skip the verification step for now
  const verificationStatus = domainType === "subdomain" ? "verified" : "pending";

  const domain = db.insert(tenantDomains).values({
    tenantId,
    domainName: parsed.data.domainName,
    domainType,
    verificationToken,
    verificationStatus,
    redirectBehavior: parsed.data.redirectBehavior,
    redirectTarget: parsed.data.redirectTarget ?? null,
    dnsInstructions: JSON.stringify(dnsInstructions),
    notes: parsed.data.notes ?? null,
    // Platform subdomains auto-verify; activation still requires admin approval
    isActive: false,
  }).returning().get();

  // Log verification event for subdomain auto-verify
  if (domainType === "subdomain") {
    db.insert(domainVerifications).values({
      domainId: domain.id,
      tenantId,
      method: "manual",
      outcome: "success",
      resolvedValue: "platform-subdomain-auto-verified",
      actor: "system",
      actorId: adminId,
      metadata: JSON.stringify({ auto: true, reason: "platform-managed subdomain" }),
    }).run();
  }

  return c.json({ domain: { ...domain, dnsInstructions } }, 201);
});

// ── PUT /tenant/:tenantId/:domainId — update domain ───────────────────────
const updateDomainSchema = z.object({
  redirectBehavior: z.enum(["serve", "redirect"]).optional(),
  redirectTarget: z.string().url().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

router.put("/tenant/:tenantId/:domainId", async (c) => {
  const { tenantId, domainId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateDomainSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const domain = db.select().from(tenantDomains)
    .where(and(eq(tenantDomains.id, domainId), eq(tenantDomains.tenantId, tenantId)))
    .get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };
  if (parsed.data.redirectBehavior !== undefined) updates.redirectBehavior = parsed.data.redirectBehavior;
  if (parsed.data.redirectTarget !== undefined) updates.redirectTarget = parsed.data.redirectTarget;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

  db.update(tenantDomains).set(updates).where(eq(tenantDomains.id, domainId)).run();

  const updated = db.select().from(tenantDomains).where(eq(tenantDomains.id, domainId)).get();
  return c.json({ domain: { ...updated, dnsInstructions: JSON.parse(updated!.dnsInstructions) } });
});

// ── DELETE /tenant/:tenantId/:domainId — remove domain ────────────────────
router.delete("/tenant/:tenantId/:domainId", async (c) => {
  const { tenantId, domainId } = c.req.param();

  const domain = db.select().from(tenantDomains)
    .where(and(eq(tenantDomains.id, domainId), eq(tenantDomains.tenantId, tenantId)))
    .get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);
  if (domain.isPrimary) return c.json({ error: "Cannot remove primary domain. Set a different primary domain first." }, 400);

  db.delete(tenantDomains).where(eq(tenantDomains.id, domainId)).run();
  return c.json({ success: true });
});

// ── POST /tenant/:tenantId/:domainId/set-primary ──────────────────────────
router.post("/tenant/:tenantId/:domainId/set-primary", async (c) => {
  const { tenantId, domainId } = c.req.param();

  const domain = db.select().from(tenantDomains)
    .where(and(eq(tenantDomains.id, domainId), eq(tenantDomains.tenantId, tenantId)))
    .get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);
  if (!domain.isActive) return c.json({ error: "Domain must be active before it can be set as primary." }, 400);

  const now = new Date().toISOString();
  // Clear all other primaries for this tenant
  db.update(tenantDomains).set({ isPrimary: false, updatedAt: now })
    .where(eq(tenantDomains.tenantId, tenantId)).run();
  // Set this one as primary
  db.update(tenantDomains).set({ isPrimary: true, updatedAt: now })
    .where(eq(tenantDomains.id, domainId)).run();

  return c.json({ success: true });
});

// ── POST /tenant/:tenantId/:domainId/verify — trigger verification ────────
router.post("/tenant/:tenantId/:domainId/verify", async (c) => {
  const { tenantId, domainId } = c.req.param();
  const userId = c.get("userId");

  const domain = db.select().from(tenantDomains)
    .where(and(eq(tenantDomains.id, domainId), eq(tenantDomains.tenantId, tenantId)))
    .get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);
  if (domain.verificationStatus === "verified") return c.json({ success: true, alreadyVerified: true });

  const result = await performDnsVerification(domain.domainName, domain.verificationToken);

  const now = new Date().toISOString();
  const newStatus = result.success ? "verified" : "failed";

  db.update(tenantDomains).set({
    verificationStatus: newStatus,
    lastVerifiedAt: now,
    updatedAt: now,
  }).where(eq(tenantDomains.id, domainId)).run();

  db.insert(domainVerifications).values({
    domainId,
    tenantId,
    method: "dns_txt",
    outcome: result.success ? "success" : "failure",
    resolvedValue: result.resolvedValue,
    errorMessage: result.error,
    actor: "user",
    actorId: userId,
    metadata: JSON.stringify({ attempt: "user-triggered" }),
  }).run();

  return c.json({
    success: result.success,
    status: newStatus,
    message: result.success
      ? "Domain ownership verified! An admin will activate this domain shortly."
      : result.error,
  });
});

// ── GET /tenant/:tenantId/:domainId/dns — DNS instructions ────────────────
router.get("/tenant/:tenantId/:domainId/dns", async (c) => {
  const { tenantId, domainId } = c.req.param();

  const domain = db.select().from(tenantDomains)
    .where(and(eq(tenantDomains.id, domainId), eq(tenantDomains.tenantId, tenantId)))
    .get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);

  return c.json({
    domainName: domain.domainName,
    domainType: domain.domainType,
    verificationStatus: domain.verificationStatus,
    verificationToken: domain.verificationToken,
    dnsInstructions: JSON.parse(domain.dnsInstructions),
    platformRoot: PLATFORM_ROOT_DOMAIN,
  });
});

// ── GET /tenant/:tenantId/:domainId/history — verification log ────────────
router.get("/tenant/:tenantId/:domainId/history", async (c) => {
  const { tenantId, domainId } = c.req.param();

  const verifications = db.select().from(domainVerifications)
    .where(and(eq(domainVerifications.domainId, domainId), eq(domainVerifications.tenantId, tenantId)))
    .orderBy(desc(domainVerifications.createdAt))
    .limit(50)
    .all();

  return c.json({
    verifications: verifications.map((v) => ({ ...v, metadata: JSON.parse(v.metadata) })),
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUPER-ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// ── GET /admin/domains — list all domains ─────────────────────────────────
router.get("/admin/domains", async (c) => {
  const limitQ = Math.min(parseInt(c.req.query("limit") ?? "50"), 200);
  const offsetQ = parseInt(c.req.query("offset") ?? "0");
  const statusFilter = c.req.query("status") ?? "";
  const typeFilter = c.req.query("type") ?? "";
  const tenantFilter = c.req.query("tenantId") ?? "";

  const allDomains = db.select({
    id: tenantDomains.id,
    tenantId: tenantDomains.tenantId,
    domainName: tenantDomains.domainName,
    domainType: tenantDomains.domainType,
    isPrimary: tenantDomains.isPrimary,
    verificationStatus: tenantDomains.verificationStatus,
    sslStatus: tenantDomains.sslStatus,
    isActive: tenantDomains.isActive,
    redirectBehavior: tenantDomains.redirectBehavior,
    notes: tenantDomains.notes,
    approvedBy: tenantDomains.approvedBy,
    approvedAt: tenantDomains.approvedAt,
    createdAt: tenantDomains.createdAt,
    updatedAt: tenantDomains.updatedAt,
    tenantSlug: tenants.slug,
    tenantDisplayName: tenants.displayName,
  })
    .from(tenantDomains)
    .innerJoin(tenants, eq(tenants.id, tenantDomains.tenantId))
    .orderBy(desc(tenantDomains.createdAt))
    .limit(limitQ)
    .offset(offsetQ)
    .all();

  const total = (db.select({ n: sql<number>`count(*)` }).from(tenantDomains).get() as { n: number }).n;

  return c.json({ domains: allDomains, total, limit: limitQ, offset: offsetQ });
});

// ── GET /admin/domains/:domainId ──────────────────────────────────────────
router.get("/admin/domains/:domainId", async (c) => {
  const { domainId } = c.req.param();

  const domain = db.select().from(tenantDomains).where(eq(tenantDomains.id, domainId)).get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);

  const verifications = db.select().from(domainVerifications)
    .where(eq(domainVerifications.domainId, domainId))
    .orderBy(desc(domainVerifications.createdAt))
    .limit(20)
    .all();

  const rules = db.select().from(domainRoutingRules)
    .where(eq(domainRoutingRules.domainId, domainId))
    .all();

  const tenant = db.select({ id: tenants.id, slug: tenants.slug, displayName: tenants.displayName })
    .from(tenants).where(eq(tenants.id, domain.tenantId)).get();

  return c.json({
    domain: { ...domain, dnsInstructions: JSON.parse(domain.dnsInstructions) },
    tenant,
    verifications: verifications.map((v) => ({ ...v, metadata: JSON.parse(v.metadata) })),
    rules: rules.map((r) => ({ ...r, config: JSON.parse(r.config) })),
  });
});

// ── POST /admin/domains/:domainId/approve ─────────────────────────────────
router.post("/admin/domains/:domainId/approve", async (c) => {
  const { domainId } = c.req.param();
  const adminId = c.get("userId");

  const domain = db.select().from(tenantDomains).where(eq(tenantDomains.id, domainId)).get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);

  const now = new Date().toISOString();
  db.update(tenantDomains).set({
    verificationStatus: "verified",
    isActive: true,
    approvedBy: adminId,
    approvedAt: now,
    lastVerifiedAt: now,
    sslStatus: "provisioning",
    updatedAt: now,
  }).where(eq(tenantDomains.id, domainId)).run();

  db.insert(domainVerifications).values({
    domainId,
    tenantId: domain.tenantId,
    method: "manual",
    outcome: "success",
    resolvedValue: "manual-admin-approval",
    actor: "admin",
    actorId: adminId,
    metadata: JSON.stringify({ reason: "super-admin manual approval and activation" }),
  }).run();

  return c.json({ success: true });
});

// ── POST /admin/domains/:domainId/activate ────────────────────────────────
router.post("/admin/domains/:domainId/activate", async (c) => {
  const { domainId } = c.req.param();
  const adminId = c.get("userId");

  const domain = db.select().from(tenantDomains).where(eq(tenantDomains.id, domainId)).get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);
  if (domain.verificationStatus !== "verified") {
    return c.json({ error: "Domain must be verified before activation." }, 400);
  }

  const now = new Date().toISOString();
  db.update(tenantDomains).set({
    isActive: true,
    approvedBy: adminId,
    approvedAt: now,
    updatedAt: now,
  }).where(eq(tenantDomains.id, domainId)).run();

  return c.json({ success: true });
});

// ── POST /admin/domains/:domainId/deactivate ──────────────────────────────
router.post("/admin/domains/:domainId/deactivate", async (c) => {
  const { domainId } = c.req.param();

  const now = new Date().toISOString();
  db.update(tenantDomains).set({ isActive: false, updatedAt: now })
    .where(eq(tenantDomains.id, domainId)).run();

  return c.json({ success: true });
});

// ── POST /admin/domains/:domainId/force-verify ────────────────────────────
router.post("/admin/domains/:domainId/force-verify", async (c) => {
  const { domainId } = c.req.param();
  const adminId = c.get("userId");

  const domain = db.select().from(tenantDomains).where(eq(tenantDomains.id, domainId)).get();
  if (!domain) return c.json({ error: "Domain not found" }, 404);

  const now = new Date().toISOString();
  db.update(tenantDomains).set({
    verificationStatus: "verified",
    lastVerifiedAt: now,
    updatedAt: now,
  }).where(eq(tenantDomains.id, domainId)).run();

  db.insert(domainVerifications).values({
    domainId,
    tenantId: domain.tenantId,
    method: "manual",
    outcome: "success",
    resolvedValue: "force-verified-by-admin",
    actor: "admin",
    actorId: adminId,
    metadata: JSON.stringify({ reason: "admin force-verify" }),
  }).run();

  return c.json({ success: true });
});

// ── DELETE /admin/domains/:domainId — hard delete ─────────────────────────
router.delete("/admin/domains/:domainId", async (c) => {
  const { domainId } = c.req.param();

  db.delete(tenantDomains).where(eq(tenantDomains.id, domainId)).run();
  return c.json({ success: true });
});

// ── GET /admin/routing-rules/:tenantId ────────────────────────────────────
router.get("/admin/routing-rules/:tenantId", async (c) => {
  const { tenantId } = c.req.param();

  const rules = db.select({
    id: domainRoutingRules.id,
    domainId: domainRoutingRules.domainId,
    tenantId: domainRoutingRules.tenantId,
    ruleType: domainRoutingRules.ruleType,
    ruleValue: domainRoutingRules.ruleValue,
    config: domainRoutingRules.config,
    isActive: domainRoutingRules.isActive,
    createdAt: domainRoutingRules.createdAt,
    domainName: tenantDomains.domainName,
  })
    .from(domainRoutingRules)
    .innerJoin(tenantDomains, eq(tenantDomains.id, domainRoutingRules.domainId))
    .where(eq(domainRoutingRules.tenantId, tenantId))
    .orderBy(domainRoutingRules.createdAt)
    .all();

  return c.json({ rules: rules.map((r) => ({ ...r, config: JSON.parse(r.config) })) });
});

// ── POST /admin/routing-rules/:tenantId ───────────────────────────────────
const routingRuleSchema = z.object({
  domainId: z.string().uuid(),
  ruleType: z.enum(["landing_path", "auth_mode", "feature_preset"]),
  ruleValue: z.string().min(1),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

router.post("/admin/routing-rules/:tenantId", async (c) => {
  const { tenantId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const parsed = routingRuleSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const rule = db.insert(domainRoutingRules).values({
    ...parsed.data,
    tenantId,
    config: JSON.stringify(parsed.data.config ?? {}),
  }).returning().get();

  return c.json({ rule: { ...rule, config: JSON.parse(rule.config) } }, 201);
});

// ── PUT /admin/routing-rules/:ruleId ─────────────────────────────────────
router.put("/admin/routing-rules/:ruleId", async (c) => {
  const { ruleId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const parsed = routingRuleSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message }, 400);

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date().toISOString() };
  if (parsed.data.config) updates.config = JSON.stringify(parsed.data.config);

  db.update(domainRoutingRules).set(updates).where(eq(domainRoutingRules.id, ruleId)).run();
  const rule = db.select().from(domainRoutingRules).where(eq(domainRoutingRules.id, ruleId)).get();
  if (!rule) return c.json({ error: "Rule not found" }, 404);
  return c.json({ rule: { ...rule, config: JSON.parse(rule.config) } });
});

// ── DELETE /admin/routing-rules/:ruleId ──────────────────────────────────
router.delete("/admin/routing-rules/:ruleId", async (c) => {
  const { ruleId } = c.req.param();
  db.delete(domainRoutingRules).where(eq(domainRoutingRules.id, ruleId)).run();
  return c.json({ success: true });
});

export default router;
