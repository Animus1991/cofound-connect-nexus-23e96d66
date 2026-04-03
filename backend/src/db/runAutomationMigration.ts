/**
 * runAutomationMigration — idempotent migration for the automation framework.
 *
 * Creates 7 new tables and seeds default automation rules + templates.
 * Safe to re-run multiple times.
 *
 * Usage:
 *   npx tsx src/db/runAutomationMigration.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../../data/cofounderbay.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── helpers ──────────────────────────────────────────────────────────────────

function hasTable(name: string): boolean {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name) as { name: string } | undefined;
  return !!row;
}

function hasColumn(table: string, column: string): boolean {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    return info.some((c) => c.name === column);
  } catch {
    return false;
  }
}

function execOnce(sql: string): void {
  db.exec(sql);
}

// ── 1. automation_rules ───────────────────────────────────────────────────────

if (!hasTable("automation_rules")) {
  console.log("Creating automation_rules…");
  execOnce(`
    CREATE TABLE automation_rules (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      description          TEXT,
      tenant_id            TEXT REFERENCES tenants(id) ON DELETE CASCADE,
      trigger_type         TEXT NOT NULL,
      entity_scope         TEXT NOT NULL DEFAULT 'global',
      condition_definition TEXT NOT NULL DEFAULT '[]',
      action_definition    TEXT NOT NULL DEFAULT '[]',
      schedule_delay       INTEGER NOT NULL DEFAULT 0,
      is_active            INTEGER NOT NULL DEFAULT 1,
      priority             INTEGER NOT NULL DEFAULT 50,
      failure_count        INTEGER NOT NULL DEFAULT 0,
      last_run_at          TEXT,
      next_run_at          TEXT,
      max_retries          INTEGER NOT NULL DEFAULT 2,
      is_system            INTEGER NOT NULL DEFAULT 0,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_automation_rules_tenant  ON automation_rules(tenant_id);
    CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type);
    CREATE INDEX idx_automation_rules_active  ON automation_rules(is_active);
  `);
}

// ── 2. automation_executions ─────────────────────────────────────────────────

if (!hasTable("automation_executions")) {
  console.log("Creating automation_executions…");
  execOnce(`
    CREATE TABLE automation_executions (
      id                TEXT PRIMARY KEY,
      rule_id           TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
      trigger_event     TEXT NOT NULL,
      entity_type       TEXT,
      entity_id         TEXT,
      status            TEXT NOT NULL DEFAULT 'queued',
      retry_count       INTEGER NOT NULL DEFAULT 0,
      context_snapshot  TEXT NOT NULL DEFAULT '{}',
      error_message     TEXT,
      started_at        TEXT,
      completed_at      TEXT,
      scheduled_for     TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_auto_exec_rule      ON automation_executions(rule_id);
    CREATE INDEX idx_auto_exec_status    ON automation_executions(status);
    CREATE INDEX idx_auto_exec_entity    ON automation_executions(entity_type, entity_id);
    CREATE INDEX idx_auto_exec_scheduled ON automation_executions(scheduled_for);
  `);
}

// ── 3. automation_logs ───────────────────────────────────────────────────────

if (!hasTable("automation_logs")) {
  console.log("Creating automation_logs…");
  execOnce(`
    CREATE TABLE automation_logs (
      id           TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL REFERENCES automation_executions(id) ON DELETE CASCADE,
      level        TEXT NOT NULL DEFAULT 'info',
      message      TEXT NOT NULL,
      metadata     TEXT NOT NULL DEFAULT '{}',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_auto_logs_execution ON automation_logs(execution_id);
    CREATE INDEX idx_auto_logs_level     ON automation_logs(level);
  `);
}

// ── 4. notification_templates ────────────────────────────────────────────────

if (!hasTable("notification_templates")) {
  console.log("Creating notification_templates…");
  execOnce(`
    CREATE TABLE notification_templates (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      slug             TEXT NOT NULL,
      channel          TEXT NOT NULL DEFAULT 'in_app',
      subject          TEXT NOT NULL,
      body_template    TEXT NOT NULL,
      variables_schema TEXT NOT NULL DEFAULT '[]',
      is_active        INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX idx_notif_tpl_slug ON notification_templates(slug);
  `);
}

// ── 5. email_templates ───────────────────────────────────────────────────────

if (!hasTable("email_templates")) {
  console.log("Creating email_templates…");
  execOnce(`
    CREATE TABLE email_templates (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      slug             TEXT NOT NULL,
      subject_template TEXT NOT NULL,
      html_template    TEXT NOT NULL,
      text_template    TEXT NOT NULL,
      variables_schema TEXT NOT NULL DEFAULT '[]',
      from_name        TEXT,
      from_email       TEXT,
      is_active        INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX idx_email_tpl_slug ON email_templates(slug);
  `);
}

// ── 6. tenant_automation_config ──────────────────────────────────────────────

if (!hasTable("tenant_automation_config")) {
  console.log("Creating tenant_automation_config…");
  execOnce(`
    CREATE TABLE tenant_automation_config (
      id                       TEXT PRIMARY KEY,
      tenant_id                TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      is_automation_enabled    INTEGER NOT NULL DEFAULT 1,
      notification_sensitivity TEXT NOT NULL DEFAULT 'all',
      email_digest_frequency   TEXT NOT NULL DEFAULT 'realtime',
      disabled_triggers        TEXT NOT NULL DEFAULT '[]',
      max_daily_per_user       INTEGER NOT NULL DEFAULT 20,
      updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX idx_tenant_auto_cfg_tenant ON tenant_automation_config(tenant_id);
  `);
}

// ── 7. notification_preferences ──────────────────────────────────────────────

if (!hasTable("notification_preferences")) {
  console.log("Creating notification_preferences…");
  execOnce(`
    CREATE TABLE notification_preferences (
      id                    TEXT PRIMARY KEY,
      user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category              TEXT NOT NULL,
      in_app_enabled        INTEGER NOT NULL DEFAULT 1,
      email_enabled         INTEGER NOT NULL DEFAULT 1,
      push_enabled          INTEGER NOT NULL DEFAULT 0,
      email_digest_frequency TEXT NOT NULL DEFAULT 'realtime',
      updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX idx_notif_pref_user_cat ON notification_preferences(user_id, category);
    CREATE INDEX idx_notif_pref_user           ON notification_preferences(user_id);
  `);
}

// ── Seed default notification templates ──────────────────────────────────────

const templateCount = (db.prepare(`SELECT COUNT(*) as c FROM notification_templates`).get() as { c: number }).c;

if (templateCount === 0) {
  console.log("Seeding notification_templates…");
  const insertTpl = db.prepare(`
    INSERT INTO notification_templates (id, name, slug, channel, subject, body_template, variables_schema)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  const templates = [
    // Onboarding
    ["notif-onboarding-welcome",   "Welcome to CoFounderBay",       "onboarding_welcome",         "in_app", "Welcome to CoFounderBay, {{userName}}!", "Hi {{userName}}, your account is ready. Complete your profile to get matched with co-founders.", '["userName"]'],
    ["notif-onboarding-incomplete","Complete your profile",         "onboarding_profile_nudge",   "in_app", "Your profile is {{percent}}% complete", "Finish your profile to unlock match recommendations and community access.", '["userName","percent"]'],
    // Matching
    ["notif-match-new",            "New match found",               "match_new",                  "in_app", "You have a new co-founder match!", "{{matchName}} may be a great fit — check the match now.", '["matchName"]'],
    ["notif-match-accepted",       "Match accepted",                "match_accepted",             "in_app", "{{matchName}} accepted your match!", "You're now connected. Consider sending a message to introduce yourself.", '["matchName"]'],
    ["notif-match-nudge",          "Don't miss your matches",      "match_view_nudge",           "in_app", "You have {{count}} unread match suggestions", "Take a few minutes to review your match recommendations.", '["count"]'],
    // Connections
    ["notif-conn-request",         "New connection request",        "connection_request",         "in_app", "{{fromName}} wants to connect", "{{fromName}} sent you a connection request.", '["fromName"]'],
    ["notif-conn-accepted",        "Connection accepted",           "connection_accepted",        "in_app", "{{toName}} accepted your request", "You are now connected with {{toName}}.", '["toName"]'],
    ["notif-conn-reminder",        "Pending connection reminder",   "connection_request_reminder","in_app", "You have a pending connection request", "{{fromName}} is waiting for your response.", '["fromName"]'],
    // Mentorship
    ["notif-mentor-request",       "New mentor request",            "mentor_request_received",    "in_app", "{{menteeeName}} requested mentorship", "Review and respond to the mentorship request.", '["menteeName"]'],
    ["notif-mentor-accepted",      "Mentor accepted your request",  "mentor_request_accepted",    "in_app", "{{mentorName}} accepted your request!", "Your mentorship journey with {{mentorName}} begins now.", '["mentorName"]'],
    ["notif-mentor-idle",          "Mentorship needs attention",    "mentor_idle_nudge",          "in_app", "Your mentorship with {{name}} has been inactive", "Consider scheduling a session or reaching out.", '["name"]'],
    // Community
    ["notif-community-welcome",    "Welcome to the community",      "community_welcome",          "in_app", "Welcome to {{communityName}}!", "You're now a member. Introduce yourself to the community.", '["communityName"]'],
    ["notif-community-activity",   "New community activity",        "community_activity",         "in_app", "New activity in {{communityName}}", "{{actorName}} posted in {{communityName}}.", '["communityName","actorName"]'],
    // Billing
    ["notif-trial-ending",         "Trial ending soon",             "billing_trial_ending",       "in_app", "Your trial ends in {{days}} days", "Upgrade your plan before {{date}} to keep access.", '["days","date"]'],
    ["notif-payment-failed",       "Payment failed",                "billing_payment_failed",     "in_app", "Payment failed — action required", "Your payment could not be processed. Update your billing details.", '[]'],
    ["notif-seat-limit",           "Seat limit approaching",        "billing_seat_limit",         "in_app", "You've used {{used}} of {{total}} seats", "Consider upgrading your plan for more team seats.", '["used","total"]'],
    // Admin
    ["notif-admin-moderation",     "Moderation action needed",      "admin_moderation_alert",     "admin_alert", "{{count}} items need moderation", "Items awaiting review in the moderation queue.", '["count"]'],
    ["notif-admin-tenant-setup",   "Tenant setup incomplete",       "admin_tenant_setup_alert",   "admin_alert", "Tenant {{tenantName}} setup incomplete", "{{tenantName}} has not completed branding/domain/billing setup.", '["tenantName"]'],
    // Re-engagement
    ["notif-reengagement-idle",    "We miss you!",                  "reengagement_idle_user",     "in_app", "It's been a while, {{userName}}", "Check what's new on CoFounderBay — new matches and opportunities are waiting.", '["userName"]'],
  ];
  const insertAll = db.transaction(() => {
    for (const [id, name, slug, channel, subject, body, vars] of templates) {
      insertTpl.run(id, name, slug, channel, subject, body, vars);
    }
  });
  insertAll();
}

// ── Seed default email templates ──────────────────────────────────────────────

const emailTplCount = (db.prepare(`SELECT COUNT(*) as c FROM email_templates`).get() as { c: number }).c;

if (emailTplCount === 0) {
  console.log("Seeding email_templates…");
  const insertEmail = db.prepare(`
    INSERT INTO email_templates (id, name, slug, subject_template, html_template, text_template, variables_schema, from_name, from_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const emailTemplates = [
    ["etpl-welcome",        "Welcome Email",             "email_welcome",
      "Welcome to CoFounderBay, {{userName}}!",
      `<h1>Welcome, {{userName}}!</h1><p>Your account is ready. <a href="{{dashboardUrl}}">Complete your profile</a> to start connecting with co-founders.</p>`,
      `Welcome, {{userName}}!\n\nYour account is ready. Visit {{dashboardUrl}} to complete your profile.`,
      '["userName","dashboardUrl"]', "CoFounderBay", "hello@cofounderbay.com"],
    ["etpl-match-new",      "New Match Notification",    "email_match_new",
      "You have a new co-founder match on CoFounderBay",
      `<h1>New Match!</h1><p>{{matchName}} may be a great fit for your venture. <a href="{{matchUrl}}">View match</a></p>`,
      `You have a new match: {{matchName}}. View at {{matchUrl}}`,
      '["matchName","matchUrl"]', "CoFounderBay Matches", "matches@cofounderbay.com"],
    ["etpl-trial-ending",   "Trial Ending Reminder",     "email_trial_ending",
      "Your CoFounderBay trial ends in {{days}} days",
      `<h1>Trial Ending Soon</h1><p>Your trial expires on <strong>{{date}}</strong>. <a href="{{upgradeUrl}}">Upgrade now</a> to keep access.</p>`,
      `Your trial ends on {{date}}. Upgrade: {{upgradeUrl}}`,
      '["days","date","upgradeUrl"]', "CoFounderBay Billing", "billing@cofounderbay.com"],
    ["etpl-payment-failed", "Payment Failed",            "email_payment_failed",
      "Action required: payment failed for your CoFounderBay account",
      `<h1>Payment Failed</h1><p>We could not process your payment. <a href="{{billingUrl}}">Update billing details</a></p>`,
      `Payment failed. Update billing: {{billingUrl}}`,
      '["billingUrl"]', "CoFounderBay Billing", "billing@cofounderbay.com"],
    ["etpl-reengagement",   "Re-engagement Email",       "email_reengagement",
      "{{userName}}, there's a lot happening on CoFounderBay",
      `<h1>We miss you, {{userName}}!</h1><p>New matches and opportunities have appeared since your last visit. <a href="{{dashboardUrl}}">See what's new</a></p>`,
      `Hi {{userName}}, check what's new: {{dashboardUrl}}`,
      '["userName","dashboardUrl"]', "CoFounderBay", "hello@cofounderbay.com"],
  ];
  const insertAllEmails = db.transaction(() => {
    for (const [id, name, slug, subject, html, text, vars, fromName, fromEmail] of emailTemplates) {
      insertEmail.run(id, name, slug, subject, html, text, vars, fromName, fromEmail);
    }
  });
  insertAllEmails();
}

// ── Seed default automation rules ────────────────────────────────────────────

const ruleCount = (db.prepare(`SELECT COUNT(*) as c FROM automation_rules`).get() as { c: number }).c;

if (ruleCount === 0) {
  console.log("Seeding default automation_rules…");
  const insertRule = db.prepare(`
    INSERT INTO automation_rules
      (id, name, description, trigger_type, entity_scope, condition_definition, action_definition,
       schedule_delay, is_active, priority, max_retries, is_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 2, 1)
  `);

  const defaultRules = [
    // ── Onboarding ──────────────────────────────────────────────────────────
    ["rule-onboarding-welcome",
      "Welcome new user",
      "Send an in-app welcome notification immediately after signup.",
      "user_signed_up", "user",
      "[]",
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "onboarding_welcome" }]),
      0, 10],

    ["rule-onboarding-profile-nudge",
      "Profile completion nudge (24h)",
      "If profile completion is below 60% after 24 hours, send reminder.",
      "user_profile_incomplete_check", "user",
      JSON.stringify([{ field: "profileCompletionPct", operator: "lt", value: 60 }]),
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "onboarding_profile_nudge" }]),
      1440, 20],

    // ── Matching ────────────────────────────────────────────────────────────
    ["rule-match-generated",
      "Notify on new match",
      "Send in-app notification when a new match is generated.",
      "match_generated", "user",
      "[]",
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "match_new" }]),
      0, 10],

    ["rule-match-view-nudge",
      "Nudge unread matches (3 days)",
      "If user has unread matches after 3 days, send a nudge.",
      "match_unviewed_check", "user",
      JSON.stringify([{ field: "unreadMatchCount", operator: "gt", value: 0 }]),
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "match_view_nudge" }]),
      4320, 30],

    // ── Connections ─────────────────────────────────────────────────────────
    ["rule-connection-request-notify",
      "Notify on connection request",
      "Notify recipient of incoming connection request.",
      "connection_request_sent", "user",
      "[]",
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "connection_request" }]),
      0, 10],

    ["rule-connection-accepted-notify",
      "Notify on connection accepted",
      "Notify sender when their request is accepted.",
      "connection_request_accepted", "user",
      "[]",
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "connection_accepted" }]),
      0, 10],

    ["rule-connection-reminder",
      "Unanswered connection reminder (2 days)",
      "Remind recipient of pending connection request after 2 days.",
      "connection_request_pending_check", "user",
      JSON.stringify([{ field: "daysSinceRequest", operator: "gte", value: 2 }]),
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "connection_request_reminder" }]),
      2880, 30],

    // ── Mentorship ──────────────────────────────────────────────────────────
    ["rule-mentor-request-notify",
      "Notify mentor of new request",
      "Send notification to mentor when a mentee submits a request.",
      "mentor_request_created", "user",
      "[]",
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "mentor_request_received" }]),
      0, 10],

    ["rule-mentor-accepted-notify",
      "Notify mentee: request accepted",
      "Send notification to mentee when mentor accepts their request.",
      "mentor_request_accepted", "user",
      "[]",
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "mentor_request_accepted" }]),
      0, 10],

    ["rule-mentor-idle-nudge",
      "Mentorship inactivity nudge (7 days)",
      "Nudge both parties if a mentorship session hasn't occurred in 7 days.",
      "mentorship_idle_check", "user",
      JSON.stringify([{ field: "daysSinceLastActivity", operator: "gte", value: 7 }]),
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "mentor_idle_nudge" }]),
      10080, 40],

    // ── Community ───────────────────────────────────────────────────────────
    ["rule-community-welcome",
      "Welcome new community member",
      "Send welcome notification when user joins a community.",
      "community_member_joined", "user",
      "[]",
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "community_welcome" }]),
      0, 10],

    // ── Billing ─────────────────────────────────────────────────────────────
    ["rule-trial-ending-3d",
      "Trial ending in 3 days",
      "Notify user when trial expires in 3 days.",
      "billing_trial_ending_check", "user",
      JSON.stringify([{ field: "trialDaysRemaining", operator: "lte", value: 3 }]),
      JSON.stringify([
        { type: "send_in_app_notification", templateSlug: "billing_trial_ending" },
        { type: "send_email", templateSlug: "email_trial_ending" },
      ]),
      0, 15],

    ["rule-payment-failed",
      "Payment failed notification",
      "Notify user immediately when a payment fails.",
      "billing_payment_failed", "user",
      "[]",
      JSON.stringify([
        { type: "send_in_app_notification", templateSlug: "billing_payment_failed" },
        { type: "send_email", templateSlug: "email_payment_failed" },
      ]),
      0, 5],

    ["rule-seat-limit-alert",
      "Seat limit at 80% alert",
      "Alert tenant admin when seat usage reaches 80% of limit.",
      "billing_seat_limit_check", "tenant",
      JSON.stringify([{ field: "seatUsagePct", operator: "gte", value: 80 }]),
      JSON.stringify([{ type: "send_in_app_notification", templateSlug: "billing_seat_limit" }]),
      0, 15],

    // ── Admin / Moderation ──────────────────────────────────────────────────
    ["rule-moderation-alert",
      "Moderation queue alert",
      "Alert admins when moderation queue reaches 5+ items.",
      "moderation_queue_threshold", "admin",
      JSON.stringify([{ field: "queueSize", operator: "gte", value: 5 }]),
      JSON.stringify([{ type: "send_admin_alert", templateSlug: "admin_moderation_alert" }]),
      0, 5],

    ["rule-tenant-setup-incomplete",
      "Tenant setup reminder",
      "Remind super admin if tenant has not completed setup after 48h.",
      "tenant_setup_incomplete_check", "admin",
      JSON.stringify([{ field: "hoursActivated", operator: "gte", value: 48 }]),
      JSON.stringify([{ type: "send_admin_alert", templateSlug: "admin_tenant_setup_alert" }]),
      2880, 20],

    // ── Re-engagement ────────────────────────────────────────────────────────
    ["rule-reengagement-30d",
      "Re-engage inactive users (30 days)",
      "Send re-engagement prompt if user hasn't logged in for 30 days.",
      "user_inactive_check", "user",
      JSON.stringify([{ field: "daysSinceLastLogin", operator: "gte", value: 30 }]),
      JSON.stringify([
        { type: "send_in_app_notification", templateSlug: "reengagement_idle_user" },
        { type: "send_email", templateSlug: "email_reengagement" },
      ]),
      43200, 50],
  ];

  const insertAllRules = db.transaction(() => {
    for (const [id, name, desc, trigger, scope, cond, action, delay, priority] of defaultRules) {
      insertRule.run(id, name, desc, trigger, scope, cond, action, delay, priority);
    }
  });
  insertAllRules();
}

console.log("✅ Automation migration complete.");
db.close();
