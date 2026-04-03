/**
 * domainResolver.ts
 * Hostname → tenant resolution logic for the frontend.
 *
 * At app boot the platform calls resolveDomain() to decide:
 *  a) We are on a tenant-mapped domain → load tenant context immediately
 *  b) We are on the global platform domain → normal boot
 *  c) Invalid / unknown domain → show DomainNotFound screen
 *
 * Resolution priority:
 *  1. Query /api/public/domains/resolve?hostname=<current hostname>
 *  2. If subdomain of PLATFORM_ROOT_DOMAIN, derive slug from sub-label
 *  3. Fallback: no tenant, global platform context
 */

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const PLATFORM_ROOT_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN ?? "cofounderbay.com";

// ── Types ──────────────────────────────────────────────────────────────────

export type DomainType = "subdomain" | "custom";
export type DomainResolutionAction = "serve" | "redirect" | "none";

export interface DomainTenantResult {
  resolved: true;
  action: "serve";
  hostname: string;
  domainType: DomainType;
  isPrimary: boolean;
  sslStatus: string;
  tenant: {
    id: string;
    slug: string;
    displayName: string | null;
    description: string | null;
    aboutText: string | null;
    isBrandingActive: boolean;
    publishedAt: string | null;
  };
  branding: Record<string, unknown> | null;
  content: Record<string, unknown> | null;
  legal: Record<string, unknown> | null;
  email: Record<string, unknown> | null;
  social: Record<string, unknown> | null;
}

export interface DomainRedirectResult {
  resolved: true;
  action: "redirect";
  redirectTo: string;
  hostname: string;
}

export interface DomainNotFoundResult {
  resolved: false;
  reason: "no-domain" | "no-tenant" | "tenant-not-published" | "error";
  hostname?: string;
}

export type DomainResolutionResult =
  | DomainTenantResult
  | DomainRedirectResult
  | DomainNotFoundResult;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns true if running in a local dev environment where no tenant domains are expected. */
export function isDevEnvironment(): boolean {
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".localhost") ||
    h.startsWith("192.168.") ||
    h.endsWith(".local")
  );
}

/** Returns the platform's root domain (e.g. "cofounderbay.com"). */
export function getPlatformRootDomain(): string {
  return PLATFORM_ROOT_DOMAIN;
}

/**
 * Returns true if the current hostname is a subdomain of the platform root.
 * e.g. "athens.cofounderbay.com" → true
 *      "cofounderbay.com"        → false
 *      "founders.example.org"    → false
 */
export function isPlatformSubdomain(hostname = window.location.hostname): boolean {
  return hostname.endsWith(`.${PLATFORM_ROOT_DOMAIN}`);
}

/**
 * Returns the subdomain label from a platform subdomain hostname.
 * e.g. "athens.cofounderbay.com" → "athens"
 *      "cofounderbay.com"        → null
 */
export function extractSubdomainLabel(hostname = window.location.hostname): string | null {
  if (!isPlatformSubdomain(hostname)) return null;
  const label = hostname.slice(0, hostname.length - PLATFORM_ROOT_DOMAIN.length - 1);
  const EXCLUDED = new Set(["www", "app", "api", "mail", "tenants", "cdn", "staging", "dev"]);
  return EXCLUDED.has(label) ? null : label || null;
}

/**
 * Returns true if the current hostname is the platform root or an excluded subdomain.
 * When true, no domain-based tenant resolution is performed.
 */
export function isGlobalPlatformHost(hostname = window.location.hostname): boolean {
  if (isDevEnvironment()) return true;
  if (hostname === PLATFORM_ROOT_DOMAIN || hostname === `www.${PLATFORM_ROOT_DOMAIN}`) return true;
  if (hostname === `app.${PLATFORM_ROOT_DOMAIN}`) return true;
  return false;
}

// ── Main resolution function ───────────────────────────────────────────────

/**
 * Resolve the current browser hostname to a tenant context.
 * Should be called once on app mount in TenantProvider.
 */
export async function resolveDomain(
  hostname = window.location.hostname,
): Promise<DomainResolutionResult> {
  if (isGlobalPlatformHost(hostname)) {
    return { resolved: false, reason: "no-domain" };
  }

  try {
    const url = `${API}/api/public/domains/resolve?hostname=${encodeURIComponent(hostname)}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { resolved: false, reason: "error", hostname };
    const data = await res.json() as DomainResolutionResult;
    return data;
  } catch {
    // Offline / network error — fall back to slug derivation
    const sub = extractSubdomainLabel(hostname);
    if (sub) {
      // Optimistic: treat the subdomain label as the tenant slug.
      // TenantContext will validate via fetchTenantBySlug().
      return {
        resolved: true,
        action: "serve",
        hostname,
        domainType: "subdomain",
        isPrimary: false,
        sslStatus: "unknown",
        tenant: {
          id: "",
          slug: sub,
          displayName: null,
          description: null,
          aboutText: null,
          isBrandingActive: false,
          publishedAt: null,
        },
        branding: null,
        content: null,
        legal: null,
        email: null,
        social: null,
      } satisfies DomainTenantResult;
    }
    return { resolved: false, reason: "error", hostname };
  }
}

// ── Subdomain availability check ──────────────────────────────────────────

export async function checkSubdomainAvailability(
  sub: string,
): Promise<{ available: boolean; hostname?: string; reason?: string }> {
  const res = await fetch(
    `${API}/api/public/domains/subdomain-available?sub=${encodeURIComponent(sub.toLowerCase())}`,
  );
  return res.json() as Promise<{ available: boolean; hostname?: string; reason?: string }>;
}

// ── Domain management API client ───────────────────────────────────────────

export interface TenantDomain {
  id: string;
  tenantId: string;
  domainName: string;
  domainType: "subdomain" | "custom";
  isPrimary: boolean;
  verificationStatus: "pending" | "verified" | "failed";
  verificationToken: string;
  lastVerifiedAt: string | null;
  sslStatus: string;
  isActive: boolean;
  redirectBehavior: "serve" | "redirect";
  redirectTarget: string | null;
  dnsInstructions: DnsInstructions;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DnsInstructions {
  type: "subdomain" | "custom";
  summary: string;
  steps: string[];
  cnameRecord?: { host: string; type: string; value: string; ttl: number; note?: string };
  txtRecord: { host: string; type: string; value: string; ttl: number };
  httpProbe?: { url: string; content: string; note?: string };
  note?: string;
}

export interface DomainVerification {
  id: string;
  domainId: string;
  method: string;
  outcome: string;
  resolvedValue: string | null;
  errorMessage: string | null;
  actor: string;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DomainRoutingRule {
  id: string;
  domainId: string;
  tenantId: string;
  domainName?: string;
  ruleType: "landing_path" | "auth_mode" | "feature_preset";
  ruleValue: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

async function apiReq<T>(path: string, opts?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...rest } = opts ?? {};
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...rest,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(b.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Tenant-admin domain API
export const tenantDomainApi = {
  list: (token: string, tenantId: string) =>
    apiReq<{ tenant: { slug: string; displayName: string | null }; domains: TenantDomain[] }>(
      `/api/tenant-domains/tenant/${tenantId}`, { token }),

  add: (token: string, tenantId: string, payload: {
    domainName: string; domainType?: string; redirectBehavior?: string;
    redirectTarget?: string; notes?: string;
  }) => apiReq<{ domain: TenantDomain }>(
    `/api/tenant-domains/tenant/${tenantId}`,
    { method: "POST", token, body: JSON.stringify(payload) }),

  update: (token: string, tenantId: string, domainId: string, payload: {
    redirectBehavior?: string; redirectTarget?: string | null; notes?: string | null;
  }) => apiReq<{ domain: TenantDomain }>(
    `/api/tenant-domains/tenant/${tenantId}/${domainId}`,
    { method: "PUT", token, body: JSON.stringify(payload) }),

  remove: (token: string, tenantId: string, domainId: string) =>
    apiReq<{ success: boolean }>(
      `/api/tenant-domains/tenant/${tenantId}/${domainId}`,
      { method: "DELETE", token }),

  setPrimary: (token: string, tenantId: string, domainId: string) =>
    apiReq<{ success: boolean }>(
      `/api/tenant-domains/tenant/${tenantId}/${domainId}/set-primary`,
      { method: "POST", token, body: "{}" }),

  verify: (token: string, tenantId: string, domainId: string) =>
    apiReq<{ success: boolean; status: string; message: string }>(
      `/api/tenant-domains/tenant/${tenantId}/${domainId}/verify`,
      { method: "POST", token, body: "{}" }),

  getDns: (token: string, tenantId: string, domainId: string) =>
    apiReq<{ domainName: string; verificationToken: string; dnsInstructions: DnsInstructions }>(
      `/api/tenant-domains/tenant/${tenantId}/${domainId}/dns`, { token }),

  getHistory: (token: string, tenantId: string, domainId: string) =>
    apiReq<{ verifications: DomainVerification[] }>(
      `/api/tenant-domains/tenant/${tenantId}/${domainId}/history`, { token }),
};

// Super-admin domain API
export const adminDomainApi = {
  list: (token: string, params?: { limit?: number; offset?: number; tenantId?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    if (params?.tenantId) q.set("tenantId", params.tenantId);
    return apiReq<{ domains: (TenantDomain & { tenantSlug: string; tenantDisplayName: string | null })[]; total: number }>(
      `/api/tenant-domains/admin/domains?${q}`, { token });
  },

  get: (token: string, domainId: string) =>
    apiReq<{ domain: TenantDomain; tenant: { id: string; slug: string; displayName: string | null } | null; verifications: DomainVerification[]; rules: DomainRoutingRule[] }>(
      `/api/tenant-domains/admin/domains/${domainId}`, { token }),

  approve: (token: string, domainId: string) =>
    apiReq<{ success: boolean }>(`/api/tenant-domains/admin/domains/${domainId}/approve`, { method: "POST", token, body: "{}" }),

  activate: (token: string, domainId: string) =>
    apiReq<{ success: boolean }>(`/api/tenant-domains/admin/domains/${domainId}/activate`, { method: "POST", token, body: "{}" }),

  deactivate: (token: string, domainId: string) =>
    apiReq<{ success: boolean }>(`/api/tenant-domains/admin/domains/${domainId}/deactivate`, { method: "POST", token, body: "{}" }),

  forceVerify: (token: string, domainId: string) =>
    apiReq<{ success: boolean }>(`/api/tenant-domains/admin/domains/${domainId}/force-verify`, { method: "POST", token, body: "{}" }),

  remove: (token: string, domainId: string) =>
    apiReq<{ success: boolean }>(`/api/tenant-domains/admin/domains/${domainId}`, { method: "DELETE", token }),

  getRoutingRules: (token: string, tenantId: string) =>
    apiReq<{ rules: DomainRoutingRule[] }>(`/api/tenant-domains/admin/routing-rules/${tenantId}`, { token }),

  createRoutingRule: (token: string, tenantId: string, payload: Omit<DomainRoutingRule, "id" | "tenantId" | "domainName" | "createdAt">) =>
    apiReq<{ rule: DomainRoutingRule }>(`/api/tenant-domains/admin/routing-rules/${tenantId}`, { method: "POST", token, body: JSON.stringify(payload) }),

  deleteRoutingRule: (token: string, ruleId: string) =>
    apiReq<{ success: boolean }>(`/api/tenant-domains/admin/routing-rules/${ruleId}`, { method: "DELETE", token }),
};

// ── Status helpers ─────────────────────────────────────────────────────────

export const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pending verification",
  verified: "Verified",
  failed: "Verification failed",
};

export const VERIFICATION_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  verified: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
};

export const SSL_LABELS: Record<string, string> = {
  none: "Not configured",
  provisioning: "Provisioning…",
  active: "Active (HTTPS)",
  failed: "Failed",
  expired: "Expired",
};

export const SSL_COLORS: Record<string, string> = {
  none: "text-muted-foreground",
  provisioning: "text-amber-500",
  active: "text-emerald-500",
  failed: "text-destructive",
  expired: "text-destructive",
};

export const DOMAIN_TYPE_LABELS: Record<string, string> = {
  subdomain: "Platform subdomain",
  custom: "Custom domain",
};
