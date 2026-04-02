/**
 * SSO discovery utilities.
 *
 * Provides domain-based SSO lookup: given a user's email,
 * determine whether their organization requires or supports SSO,
 * and return the relevant identity provider configs for the login UI.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SsoProvider {
  id: string;
  providerType: "oidc" | "saml" | "google_workspace" | "microsoft_entra" | "okta" | "ping" | "custom";
  providerName: string;
  loginButtonText: string | null;
  loginButtonLogoUrl: string | null;
}

export interface SsoDiscoveryResult {
  /** Whether SSO is mandatory for this email domain */
  ssoRequired: boolean;
  /** Whether SSO is available (optional or required) */
  ssoAvailable: boolean;
  /** Matched domain, e.g. "uni.edu" */
  domain?: string;
  /** Tenant ID whose SSO config covers this domain */
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string | null;
  /** List of active identity providers for the tenant */
  providers: SsoProvider[];
  /** Optional post-login URL the tenant has configured */
  postLoginRedirectUrl?: string | null;
}

export type SsoMode = "none" | "optional" | "required";

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Given an email address, queries the backend to determine
 * whether the domain is mapped to a tenant with SSO enabled.
 *
 * Returns immediately with ssoAvailable: false if the email is invalid
 * or no domain mapping exists.
 */
export async function discoverSsoForEmail(email: string): Promise<SsoDiscoveryResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@") || !trimmed.split("@")[1]?.includes(".")) {
    return { ssoRequired: false, ssoAvailable: false, providers: [] };
  }

  try {
    const res = await fetch(`${API_BASE}/api/public/sso/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { ssoRequired: false, ssoAvailable: false, providers: [] };
    return await res.json() as SsoDiscoveryResult;
  } catch {
    return { ssoRequired: false, ssoAvailable: false, providers: [] };
  }
}

/**
 * Build the URL to initiate an SSO flow for a given tenant + provider.
 * The browser is navigated directly to this URL, which will redirect to the IdP.
 */
export function buildSsoInitiateUrl(tenantId: string, providerId: string, redirectTo?: string): string {
  const base = `${API_BASE}/api/public/sso/initiate/${encodeURIComponent(tenantId)}/${encodeURIComponent(providerId)}`;
  if (redirectTo) return `${base}?redirectTo=${encodeURIComponent(redirectTo)}`;
  return base;
}

/**
 * Returns a human-friendly label for a provider type.
 */
export function providerTypeLabel(type: SsoProvider["providerType"]): string {
  const labels: Record<SsoProvider["providerType"], string> = {
    oidc: "OpenID Connect",
    saml: "SAML 2.0",
    google_workspace: "Google Workspace",
    microsoft_entra: "Microsoft Entra ID",
    okta: "Okta",
    ping: "PingIdentity",
    custom: "Custom IdP",
  };
  return labels[type] ?? type;
}

/**
 * Returns an SVG icon URL or null for known provider types.
 * Used to show the provider logo on the SSO login button when no custom logo is set.
 */
export function providerTypeIconUrl(type: SsoProvider["providerType"]): string | null {
  const icons: Partial<Record<SsoProvider["providerType"], string>> = {
    google_workspace: "https://www.google.com/favicon.ico",
    microsoft_entra: "https://www.microsoft.com/favicon.ico",
    okta: "https://www.okta.com/favicon.ico",
  };
  return icons[type] ?? null;
}

/**
 * Simple debounce helper for the email input watcher.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
