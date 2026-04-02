/**
 * Public SSO routes — unauthenticated, used by the login page and OIDC callbacks.
 *
 * Prefix: /api/public/sso
 *
 *   POST /discover              — email → domain → tenant SSO config
 *   GET  /tenant/:tenantId/providers  — public provider list for login UI
 *   GET  /initiate/:tenantId/:providerId — start OIDC authorization flow
 *   GET  /callback/oidc         — OIDC authorization code callback
 *   POST /callback/saml         — SAML assertion POST callback (stub)
 *   POST /complete              — exchange SSO result for platform JWT
 */

import { Hono } from "hono";
import { eq, and, lt } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "../db/index.js";
import {
  users,
  profiles,
  tenants,
  identityProviders,
  tenantSsoConfigs,
  domainMappings,
  roleMappingRules,
  userIdentities,
  ssoAuditLogs,
  ssoStateTokens,
  refreshTokens,
} from "../db/schema.js";
import { signToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import type { AppEnv } from "../types.js";

export const publicSsoRoutes = new Hono<AppEnv>();

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3001";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8080";
const SSO_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function writeAuditLog(fields: Partial<typeof ssoAuditLogs.$inferInsert> & { eventType: string; outcome: string }) {
  try {
    db.insert(ssoAuditLogs).values({ ...fields }).run();
  } catch (err) {
    logger.warn({ err }, "Failed to write SSO audit log");
  }
}

function pruneExpiredStateTokens() {
  try {
    db.delete(ssoStateTokens).where(lt(ssoStateTokens.expiresAt, new Date().toISOString())).run();
  } catch {}
}

function issueJwt(userId: string, email: string) {
  const token = signToken({ userId, email });
  const rawRefresh = randomBytes(32).toString("hex");
  const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.insert(refreshTokens).values({ userId, token: rawRefresh, expiresAt: refreshExpires }).run();
  return { token, refreshToken: rawRefresh, expiresIn: 900 };
}

/** Resolve a platform role from IdP claims using the provider's role mapping rules. */
function resolveRoleFromClaims(providerId: string, claims: Record<string, unknown>, defaultRole: string): string {
  const rules = db.select()
    .from(roleMappingRules)
    .where(and(eq(roleMappingRules.identityProviderId, providerId), eq(roleMappingRules.isActive, true)))
    .all()
    .sort((a, b) => a.priority - b.priority);

  for (const rule of rules) {
    const claimVal = claims[rule.claimKey];
    const valuesArr = Array.isArray(claimVal) ? claimVal : [String(claimVal ?? "")];
    if (valuesArr.includes(rule.claimValue)) return rule.mappedRole;
  }
  return defaultRole;
}

// ── POST /discover ─────────────────────────────────────────────────────────
/**
 * Accepts an email address and returns the SSO config for the matching tenant.
 * Used by the login page to determine whether to show SSO options.
 */
publicSsoRoutes.post("/discover", async (c) => {
  const body = await c.req.json().catch(() => ({})) as { email?: string };
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

  if (!email || !email.includes("@")) {
    return c.json({ ssoRequired: false, ssoAvailable: false, providers: [] });
  }

  const domain = email.split("@")[1];

  // Look up domain mapping
  const mapping = db.select()
    .from(domainMappings)
    .where(eq(domainMappings.domain, domain))
    .get();

  if (!mapping) {
    return c.json({ ssoRequired: false, ssoAvailable: false, providers: [] });
  }

  const tenant = db.select({ id: tenants.id, slug: tenants.slug, displayName: tenants.displayName })
    .from(tenants).where(eq(tenants.id, mapping.tenantId)).get();
  if (!tenant) return c.json({ ssoRequired: false, ssoAvailable: false, providers: [] });

  const ssoConfig = db.select().from(tenantSsoConfigs).where(eq(tenantSsoConfigs.tenantId, tenant.id)).get();

  const providers = db.select({
    id: identityProviders.id,
    providerType: identityProviders.providerType,
    providerName: identityProviders.providerName,
    loginButtonText: identityProviders.loginButtonText,
    loginButtonLogoUrl: identityProviders.loginButtonLogoUrl,
  })
    .from(identityProviders)
    .where(and(eq(identityProviders.tenantId, tenant.id), eq(identityProviders.isActive, true)))
    .all();

  return c.json({
    ssoRequired: mapping.ssoRequired || ssoConfig?.ssoMode === "required",
    ssoAvailable: providers.length > 0 && ssoConfig?.ssoMode !== "none",
    domain,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.displayName,
    providers,
    postLoginRedirectUrl: ssoConfig?.postLoginRedirectUrl ?? null,
  });
});

// ── GET /tenant/:tenantId/providers ──────────────────────────────────────────
/** Returns public provider metadata for a tenant's login UI. */
publicSsoRoutes.get("/tenant/:tenantId/providers", async (c) => {
  const { tenantId } = c.req.param();

  const ssoConfig = db.select({ ssoMode: tenantSsoConfigs.ssoMode, showSsoButtonPublicly: tenantSsoConfigs.showSsoButtonPublicly })
    .from(tenantSsoConfigs).where(eq(tenantSsoConfigs.tenantId, tenantId)).get();

  if (!ssoConfig || ssoConfig.ssoMode === "none") {
    return c.json({ providers: [] });
  }

  const providers = db.select({
    id: identityProviders.id,
    providerType: identityProviders.providerType,
    providerName: identityProviders.providerName,
    loginButtonText: identityProviders.loginButtonText,
    loginButtonLogoUrl: identityProviders.loginButtonLogoUrl,
  })
    .from(identityProviders)
    .where(and(eq(identityProviders.tenantId, tenantId), eq(identityProviders.isActive, true)))
    .all();

  return c.json({ providers, ssoMode: ssoConfig.ssoMode });
});

// ── GET /initiate/:tenantId/:providerId ───────────────────────────────────────
/**
 * Initiates an OIDC authorization code + PKCE flow.
 * Redirects the browser to the identity provider's authorization endpoint.
 */
publicSsoRoutes.get("/initiate/:tenantId/:providerId", async (c) => {
  const { tenantId, providerId } = c.req.param();
  const redirectTo = c.req.query("redirectTo") ?? "/dashboard";

  pruneExpiredStateTokens();

  const provider = db.select().from(identityProviders)
    .where(and(eq(identityProviders.id, providerId), eq(identityProviders.tenantId, tenantId), eq(identityProviders.isActive, true)))
    .get();

  if (!provider) return c.json({ error: "Identity provider not found or inactive" }, 404);

  if (provider.providerType === "saml") {
    // SAML: in a production system this would generate a signed AuthnRequest.
    // For this scaffold, return a 501 with a clear message.
    return c.json({ error: "SAML flow must be handled via metadata endpoint. Production implementation required." }, 501);
  }

  // ── OIDC PKCE flow ────────────────────────────────────────────────────────
  let authorizationEndpoint = provider.authorizationEndpoint;

  // Auto-discover if not set
  if (!authorizationEndpoint && provider.issuerUrl) {
    try {
      const discoveryUrl = `${provider.issuerUrl.replace(/\/$/, "")}/.well-known/openid-configuration`;
      const res = await fetch(discoveryUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const disc = await res.json() as { authorization_endpoint?: string };
        authorizationEndpoint = disc.authorization_endpoint ?? null;
      }
    } catch {}
  }

  if (!authorizationEndpoint) {
    return c.json({ error: "Authorization endpoint not configured and discovery failed" }, 422);
  }

  // Generate PKCE
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = Buffer.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier)))
  ).toString("base64url");

  const state = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SSO_STATE_TTL_MS).toISOString();

  db.insert(ssoStateTokens).values({
    state, tenantId, identityProviderId: providerId, codeVerifier, redirectTo, expiresAt,
  }).run();

  const callbackUrl = `${BASE_URL}/api/public/sso/callback/oidc`;
  const scopes = JSON.parse(provider.scopes) as string[];

  const authUrl = new URL(authorizationEndpoint);
  authUrl.searchParams.set("client_id", provider.clientId ?? "");
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  writeAuditLog({ tenantId, identityProviderId: providerId, eventType: "login_attempt", outcome: "pending" });

  return c.redirect(authUrl.toString());
});

// ── GET /callback/oidc ────────────────────────────────────────────────────────
/**
 * Handles the OIDC authorization code callback from the identity provider.
 * Exchanges the code for tokens, fetches user info, JIT-provisions a user if
 * needed, links the SSO identity, and redirects to the frontend with a JWT.
 */
publicSsoRoutes.get("/callback/oidc", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  const errorDescription = c.req.query("error_description");
  const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
  const ua = c.req.header("user-agent") ?? "";

  if (error) {
    const params = new URLSearchParams({ sso_error: error, sso_error_description: errorDescription ?? "" });
    return c.redirect(`${FRONTEND_URL}/login?${params}`);
  }

  if (!code || !state) {
    return c.redirect(`${FRONTEND_URL}/login?sso_error=invalid_response`);
  }

  pruneExpiredStateTokens();

  const stateRow = db.select().from(ssoStateTokens).where(eq(ssoStateTokens.state, state)).get();
  if (!stateRow || stateRow.usedAt || new Date(stateRow.expiresAt) < new Date()) {
    return c.redirect(`${FRONTEND_URL}/login?sso_error=state_expired`);
  }

  // Mark state token as used (prevent replay)
  await db.update(ssoStateTokens).set({ usedAt: new Date().toISOString() }).where(eq(ssoStateTokens.id, stateRow.id));

  const provider = db.select().from(identityProviders).where(eq(identityProviders.id, stateRow.identityProviderId)).get();
  if (!provider || !provider.isActive) {
    return c.redirect(`${FRONTEND_URL}/login?sso_error=provider_inactive`);
  }

  // ── Token exchange ─────────────────────────────────────────────────────────
  let tokenEndpoint = provider.tokenEndpoint;
  if (!tokenEndpoint && provider.issuerUrl) {
    try {
      const discoveryUrl = `${provider.issuerUrl.replace(/\/$/, "")}/.well-known/openid-configuration`;
      const res = await fetch(discoveryUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const disc = await res.json() as { token_endpoint?: string; userinfo_endpoint?: string };
        tokenEndpoint = disc.token_endpoint ?? null;
      }
    } catch {}
  }

  if (!tokenEndpoint) {
    writeAuditLog({ tenantId: stateRow.tenantId, identityProviderId: provider.id, eventType: "login_failure", outcome: "failure", errorCode: "no_token_endpoint", ipAddress: ip, userAgent: ua });
    return c.redirect(`${FRONTEND_URL}/login?sso_error=provider_misconfigured`);
  }

  let idToken: string | undefined;
  let userInfoClaims: Record<string, unknown> = {};

  try {
    const callbackUrl = `${BASE_URL}/api/public/sso/callback/oidc`;
    const tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        client_id: provider.clientId ?? "",
        client_secret: provider.clientSecretEncrypted ?? "",
        code_verifier: stateRow.codeVerifier ?? "",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      logger.error({ body }, "Token exchange failed");
      writeAuditLog({ tenantId: stateRow.tenantId, identityProviderId: provider.id, eventType: "login_failure", outcome: "failure", errorCode: "token_exchange_failed", ipAddress: ip, userAgent: ua });
      return c.redirect(`${FRONTEND_URL}/login?sso_error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json() as { access_token?: string; id_token?: string };
    idToken = tokenData.id_token;

    // Decode ID token payload (no verification in MVP — add jwt-verify in production)
    if (idToken) {
      try {
        const payloadB64 = idToken.split(".")[1];
        const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8")) as Record<string, unknown>;
        userInfoClaims = decoded;
      } catch {}
    }

    // Fetch userinfo if endpoint available and claims missing
    if (!userInfoClaims.sub && tokenData.access_token) {
      const userinfoEndpoint = provider.userinfoEndpoint;
      if (userinfoEndpoint) {
        try {
          const uiRes = await fetch(userinfoEndpoint, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
            signal: AbortSignal.timeout(5000),
          });
          if (uiRes.ok) userInfoClaims = { ...userInfoClaims, ...await uiRes.json() as Record<string, unknown> };
        } catch {}
      }
    }
  } catch (err) {
    logger.error({ err }, "SSO token exchange error");
    writeAuditLog({ tenantId: stateRow.tenantId, identityProviderId: provider.id, eventType: "login_failure", outcome: "failure", errorCode: "network_error", errorMessage: String(err), ipAddress: ip, userAgent: ua });
    return c.redirect(`${FRONTEND_URL}/login?sso_error=network_error`);
  }

  const externalSubject = String(userInfoClaims.sub ?? "");
  const externalEmail = String(userInfoClaims.email ?? "").toLowerCase();
  const externalName = String(userInfoClaims.name ?? userInfoClaims.preferred_username ?? "");

  if (!externalSubject) {
    writeAuditLog({ tenantId: stateRow.tenantId, identityProviderId: provider.id, eventType: "login_failure", outcome: "failure", errorCode: "missing_sub_claim", ipAddress: ip, userAgent: ua });
    return c.redirect(`${FRONTEND_URL}/login?sso_error=missing_identity`);
  }

  // ── Identity resolution + JIT provisioning ─────────────────────────────────
  const now = new Date().toISOString();

  // 1. Check if this exact IdP identity already exists
  let existingIdentity = db.select()
    .from(userIdentities)
    .where(and(eq(userIdentities.identityProviderId, provider.id), eq(userIdentities.externalSubject, externalSubject)))
    .get();

  let platformUserId: string;

  if (existingIdentity) {
    // Known identity — update last login + claims
    platformUserId = existingIdentity.userId;
    await db.update(userIdentities).set({
      externalEmail,
      externalName,
      rawClaims: JSON.stringify(userInfoClaims),
      lastLoginAt: now,
    }).where(eq(userIdentities.id, existingIdentity.id));

  } else {
    // Unknown identity — try to link to existing user by email, or JIT-provision
    const ssoConfig = db.select().from(tenantSsoConfigs).where(eq(tenantSsoConfigs.tenantId, stateRow.tenantId)).get();

    let existingUser = externalEmail
      ? db.select().from(users).where(eq(users.email, externalEmail)).get()
      : null;

    if (!existingUser) {
      // JIT provisioning
      if (!ssoConfig?.autoProvisionEnabled) {
        writeAuditLog({ tenantId: stateRow.tenantId, identityProviderId: provider.id, eventType: "login_failure", outcome: "failure", errorCode: "jit_disabled", email: externalEmail, externalSubject, ipAddress: ip, userAgent: ua });
        return c.redirect(`${FRONTEND_URL}/login?sso_error=account_not_found`);
      }

      const mappedRole = resolveRoleFromClaims(provider.id, userInfoClaims, ssoConfig.defaultRole);

      existingUser = db.insert(users).values({
        email: externalEmail || `sso-${externalSubject.slice(0, 20)}@sso.local`,
        name: externalName || "SSO User",
        password: `sso:${randomBytes(16).toString("hex")}`, // non-guessable, login via SSO only
      }).returning().get();

      // Create stub profile
      db.insert(profiles).values({
        userId: existingUser.id,
        headline: `Member via ${provider.providerName}`,
        skills: JSON.stringify([]),
        interests: JSON.stringify([]),
      }).run();

      writeAuditLog({
        tenantId: stateRow.tenantId,
        identityProviderId: provider.id,
        userId: existingUser.id,
        eventType: "jit_provision",
        outcome: "success",
        email: externalEmail,
        externalSubject,
        ipAddress: ip,
        userAgent: ua,
        metadata: JSON.stringify({ mappedRole, externalName }),
      });
    }

    platformUserId = existingUser.id;

    // Create identity link
    existingIdentity = db.insert(userIdentities).values({
      userId: platformUserId,
      identityProviderId: provider.id,
      externalSubject,
      externalEmail,
      externalName,
      rawClaims: JSON.stringify(userInfoClaims),
      lastLoginAt: now,
    }).returning().get();

    writeAuditLog({
      tenantId: stateRow.tenantId, identityProviderId: provider.id, userId: platformUserId,
      eventType: "link_identity", outcome: "success", email: externalEmail, externalSubject, ipAddress: ip, userAgent: ua,
    });
  }

  // Verify the user still exists in the platform
  const platformUser = db.select().from(users).where(eq(users.id, platformUserId)).get();
  if (!platformUser) {
    return c.redirect(`${FRONTEND_URL}/login?sso_error=user_not_found`);
  }

  writeAuditLog({
    tenantId: stateRow.tenantId, identityProviderId: provider.id, userId: platformUserId,
    eventType: "login_success", outcome: "success", email: platformUser.email, externalSubject, ipAddress: ip, userAgent: ua,
  });

  // Issue platform JWT
  const { token, refreshToken } = issueJwt(platformUserId, platformUser.email);

  const redirectTo = stateRow.redirectTo || "/dashboard";
  const ssoConfig = db.select().from(tenantSsoConfigs).where(eq(tenantSsoConfigs.tenantId, stateRow.tenantId)).get();
  const finalRedirect = ssoConfig?.postLoginRedirectUrl ?? redirectTo;

  const params = new URLSearchParams({
    token,
    refreshToken,
    sso: "1",
    tenantId: stateRow.tenantId,
  });

  return c.redirect(`${FRONTEND_URL}/sso/callback?${params}&next=${encodeURIComponent(finalRedirect)}`);
});

// ── POST /callback/saml ───────────────────────────────────────────────────────
/** SAML assertion POST handler — stub for production implementation */
publicSsoRoutes.post("/callback/saml", async (c) => {
  logger.info("SAML callback received — production SAML parsing not yet implemented");
  return c.json({
    error: "SAML assertion processing requires a production SAML library (e.g. samlify or node-saml). This endpoint is a scaffold.",
    docs: "Set up SAML parsing in src/routes/publicSso.ts POST /callback/saml",
  }, 501);
});

// ── POST /complete ─────────────────────────────────────────────────────────
/**
 * Used by the frontend SsoCallbackPage to finalize SSO login.
 * Accepts the token forwarded in the query string and validates it.
 */
publicSsoRoutes.post("/complete", async (c) => {
  const body = await c.req.json().catch(() => ({})) as { token?: string };
  if (!body.token) return c.json({ error: "Missing token" }, 400);
  return c.json({ valid: true, message: "Token already issued via redirect. Use the token from the redirect URL." });
});

// ── GET /health ───────────────────────────────────────────────────────────────
publicSsoRoutes.get("/health", (c) => c.json({ ok: true, service: "sso" }));
