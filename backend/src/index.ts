import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger.js";
import { securityHeaders } from "./middleware/security.js";
import { authRateLimit, apiRateLimit } from "./middleware/rateLimit.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import { authRoutes } from "./routes/auth.js";
import { profilesRoutes } from "./routes/profiles.js";
import { settingsRoutes } from "./routes/settings.js";
import { connectionsRoutes } from "./routes/connections.js";
import { opportunitiesRoutes } from "./routes/opportunities.js";
import { messagesRoutes } from "./routes/messages.js";
import { notificationsRoutes } from "./routes/notifications.js";
import { startupsRoutes } from "./routes/startups.js";
import { activityRoutes } from "./routes/activity.js";
import { searchRoutes } from "./routes/search.js";
import { ensureIndexes } from "./lib/search.js";
import { oauthRoutes } from "./routes/oauth.js";
import { matchesRoutes } from "./routes/matches.js";
import { communitiesRoutes } from "./routes/communities.js";
import { mentorshipRoutes } from "./routes/mentorship.js";
import { adminRoutes } from "./routes/admin.js";
import { milestonesRoutes } from "./routes/milestones.js";
import { tenantsRoutes } from "./routes/tenants.js";
import { publicTenantsRoutes } from "./routes/publicTenants.js";
import { ssoRoutes } from "./routes/sso.js";
import { publicSsoRoutes } from "./routes/publicSso.js";
import billingRoutes from "./routes/billing.js";
import tenantBillingRoutes from "./routes/tenantBilling.js";
import adminBillingRoutes from "./routes/adminBilling.js";
import tenantDomainsRoutes from "./routes/tenantDomains.js";
import publicDomainsRoutes from "./routes/publicDomains.js";
import automationRoutes from "./routes/automation.js";
import matchingRoutes from "./routes/matching.js";
import taxonomyRoutes from "./routes/taxonomy.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const app = new Hono();

// ── Global Error Handler ─────────────────────────────────────────────────────
app.onError(globalErrorHandler);

// ── Global Middleware ─────────────────────────────────────────────────────────

// Request ID — must be first so all logs can reference it
app.use("*", requestId);

// Request logging via Pino
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info({ method: c.req.method, path: c.req.path, status: c.res.status, ms }, "request");
});

// Security headers on all responses
app.use("*", securityHeaders);

// CORS
app.use("*", cors({
  origin: process.env.CORS_ORIGIN ?? "http://localhost:8080",
  credentials: true,
}));

// Rate limiting: strict on auth, general on API
app.use("/api/auth/*", authRateLimit);
app.use("/api/*", apiRateLimit);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.get("/health/db", (c) => {
  try {
    db.get(sql`SELECT 1`);
    return c.json({ status: "ok", database: "connected" });
  } catch (err) {
    logger.error({ err }, "Database health check failed");
    return c.json({ status: "error", database: "disconnected", hint: "Run: npm run db:migrate" }, 503);
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.route("/api/auth", authRoutes);
app.route("/api/profiles", profilesRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/connections", connectionsRoutes);
app.route("/api/opportunities", opportunitiesRoutes);
app.route("/api/messages", messagesRoutes);
app.route("/api/notifications", notificationsRoutes);
app.route("/api/startups", startupsRoutes);
app.route("/api/activity", activityRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/auth", oauthRoutes);
app.route("/api/matches", matchesRoutes);
app.route("/api/communities", communitiesRoutes);
app.route("/api/mentorship", mentorshipRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/milestones", milestonesRoutes);
app.route("/api/tenants", tenantsRoutes);
app.route("/api/public/tenants", publicTenantsRoutes);
app.route("/api/sso", ssoRoutes);
app.route("/api/public/sso", publicSsoRoutes);
app.route("/api/billing", billingRoutes);
app.route("/api/tenant-billing", tenantBillingRoutes);
app.route("/api/admin/billing", adminBillingRoutes);
app.route("/api/tenant-domains", tenantDomainsRoutes);
app.route("/api/public/domains", publicDomainsRoutes);
app.route("/api/automation", automationRoutes);
app.route("/api/matching", matchingRoutes);
app.route("/api/taxonomy", taxonomyRoutes);

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: "Not found" }, 404));

// ── Start ─────────────────────────────────────────────────────────────────────
logger.info({ port: PORT }, "CoFounder Connect API starting");
serve({ fetch: app.fetch, port: PORT });

// Warm Orama search indexes in the background after server boot
setImmediate(() => { ensureIndexes().catch(() => { /* already logged inside */ }); });
