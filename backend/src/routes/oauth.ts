/**
 * OAuth 2.0 routes — Google + GitHub
 *
 * Flow:
 *   GET /api/auth/google          → redirect to Google consent screen
 *   GET /api/auth/google/callback → exchange code → upsert user → issue JWT
 *   GET /api/auth/github          → redirect to GitHub consent screen
 *   GET /api/auth/github/callback → exchange code → upsert user → issue JWT
 *
 * On success the callback redirects to the frontend with the access token
 * and refresh token as query params so the SPA can store them.
 *
 * env vars required:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 *   APP_BASE_URL  (e.g. http://localhost:3002)
 *   FRONTEND_URL  (e.g. http://localhost:8080)
 */

import { Hono } from "hono";
import { Google, GitHub, generateState, generateCodeVerifier } from "arctic";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3002";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:8080";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_DAYS = 30;

// ── In-memory state store (TTL 10 min, good enough for dev/MVP) ───────────────
interface StateEntry { codeVerifier?: string; provider: string; expiresAt: number }
const stateStore = new Map<string, StateEntry>();
function pruneExpiredStates(): void {
  const now = Date.now();
  for (const [k, v] of stateStore) { if (v.expiresAt < now) stateStore.delete(k); }
}

// ── Providers (lazy-initialised so missing env vars only fail at first use) ───
function getGoogle(): Google {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set");
  return new Google(id, secret, `${BASE_URL}/api/auth/google/callback`);
}

function getGitHub(): GitHub {
  const id = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!id || !secret) throw new Error("GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not set");
  return new GitHub(id, secret, `${BASE_URL}/api/auth/github/callback`);
}

// ── Issue tokens (same logic as auth.ts) ─────────────────────────────────────
function issueTokens(userId: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const rawRefresh = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86_400_000).toISOString();
  db.insert(refreshTokens).values({ userId, token: rawRefresh, expiresAt }).run();
  return { accessToken, refreshToken: rawRefresh };
}

function errorRedirect(message: string): Response {
  return Response.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`, 302);
}

// ── Upsert user from OAuth profile ───────────────────────────────────────────
function upsertOAuthUser(email: string, name: string | null): string {
  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) return existing.id;
  const newUser = db.insert(users).values({
    email: email.toLowerCase(),
    name: name ?? email.split("@")[0],
    password: "",   // no password for OAuth users
  }).returning().get();
  return newUser.id;
}

export const oauthRoutes = new Hono();

// ── Google ────────────────────────────────────────────────────────────────────

oauthRoutes.get("/google", (c) => {
  try {
    const google = getGoogle();
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    pruneExpiredStates();
    stateStore.set(state, { codeVerifier, provider: "google", expiresAt: Date.now() + 600_000 });
    const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);
    return c.redirect(url.toString(), 302);
  } catch (err) {
    logger.warn({ err }, "Google OAuth not configured");
    return errorRedirect("Google OAuth is not configured on this server");
  }
});

oauthRoutes.get("/google/callback", async (c) => {
  try {
    const { code, state } = c.req.query() as Record<string, string>;
    if (!code || !state) return errorRedirect("Missing code or state");

    const entry = stateStore.get(state);
    if (!entry || entry.provider !== "google" || entry.expiresAt < Date.now()) {
      return errorRedirect("Invalid or expired state");
    }
    stateStore.delete(state);

    const google = getGoogle();
    const tokens = await google.validateAuthorizationCode(code, entry.codeVerifier!);
    const accessToken = tokens.accessToken();

    // Fetch user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) return errorRedirect("Failed to fetch user info from Google");
    const userInfo = await userInfoRes.json() as { email?: string; name?: string; email_verified?: boolean };

    if (!userInfo.email) return errorRedirect("Google did not return an email address");

    const userId = upsertOAuthUser(userInfo.email, userInfo.name ?? null);
    const { accessToken: jwtToken, refreshToken } = issueTokens(userId);

    return c.redirect(
      `${FRONTEND_URL}/oauth/callback?access_token=${jwtToken}&refresh_token=${refreshToken}&provider=google`,
      302
    );
  } catch (err) {
    logger.error({ err }, "Google OAuth callback failed");
    return errorRedirect("Google sign-in failed. Please try again.");
  }
});

// ── GitHub ────────────────────────────────────────────────────────────────────

oauthRoutes.get("/github", (c) => {
  try {
    const github = getGitHub();
    const state = generateState();
    pruneExpiredStates();
    stateStore.set(state, { provider: "github", expiresAt: Date.now() + 600_000 });
    const url = github.createAuthorizationURL(state, ["user:email", "read:user"]);
    return c.redirect(url.toString(), 302);
  } catch (err) {
    logger.warn({ err }, "GitHub OAuth not configured");
    return errorRedirect("GitHub OAuth is not configured on this server");
  }
});

oauthRoutes.get("/github/callback", async (c) => {
  try {
    const { code, state } = c.req.query() as Record<string, string>;
    if (!code || !state) return errorRedirect("Missing code or state");

    const entry = stateStore.get(state);
    if (!entry || entry.provider !== "github" || entry.expiresAt < Date.now()) {
      return errorRedirect("Invalid or expired state");
    }
    stateStore.delete(state);

    const github = getGitHub();
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // Fetch primary email
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "CoFounderConnect/1.0" },
    });
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "CoFounderConnect/1.0" },
    });

    if (!emailsRes.ok || !userRes.ok) return errorRedirect("Failed to fetch user info from GitHub");

    const emails = await emailsRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
    const githubUser = await userRes.json() as { name?: string; login?: string };

    const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
    if (!primary) return errorRedirect("No verified email found on your GitHub account");

    const name = githubUser.name ?? githubUser.login ?? null;
    const userId = upsertOAuthUser(primary.email, name);
    const { accessToken: jwtToken, refreshToken } = issueTokens(userId);

    return c.redirect(
      `${FRONTEND_URL}/oauth/callback?access_token=${jwtToken}&refresh_token=${refreshToken}&provider=github`,
      302
    );
  } catch (err) {
    logger.error({ err }, "GitHub OAuth callback failed");
    return errorRedirect("GitHub sign-in failed. Please try again.");
  }
});
