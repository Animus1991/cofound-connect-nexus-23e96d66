/**
 * Idempotent SSO schema migration.
 * Creates the 7 enterprise SSO tables if they don't already exist.
 * Run with: npx tsx src/db/runSsoMigration.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../data/dev.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = OFF");

let added = 0;
let skipped = 0;

function hasTable(name: string): boolean {
  return !!(db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name));
}

function exec(label: string, sql: string) {
  try { db.exec(sql); console.log(`  + ${label}`); added++; }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists")) { skipped++; }
    else throw e;
  }
}

// ── identity_providers ────────────────────────────────────────────────────────
console.log("\n1. identity_providers…");
if (!hasTable("identity_providers")) {
  db.exec(`
    CREATE TABLE "identity_providers" (
      "id"                         text PRIMARY KEY NOT NULL,
      "tenant_id"                  text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "provider_type"              text NOT NULL DEFAULT 'oidc',
      "provider_name"              text NOT NULL,
      "issuer_url"                 text,
      "client_id"                  text,
      "client_secret_encrypted"    text,
      "metadata_url"               text,
      "metadata_xml"               text,
      "authorization_endpoint"     text,
      "token_endpoint"             text,
      "userinfo_endpoint"          text,
      "scopes"                     text NOT NULL DEFAULT '["openid","email","profile"]',
      "login_button_text"          text,
      "login_button_logo_url"      text,
      "is_active"                  integer NOT NULL DEFAULT 1,
      "extra_config"               text NOT NULL DEFAULT '{}',
      "created_at"                 text NOT NULL DEFAULT (datetime('now')),
      "updated_at"                 text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  exec("idx_identity_providers_tenant", `CREATE INDEX "idx_identity_providers_tenant" ON "identity_providers"("tenant_id");`);
  console.log("  + created identity_providers"); added++;
} else { console.log("  ~ already exists"); skipped++; }

// ── tenant_sso_configs ─────────────────────────────────────────────────────────
console.log("\n2. tenant_sso_configs…");
if (!hasTable("tenant_sso_configs")) {
  db.exec(`
    CREATE TABLE "tenant_sso_configs" (
      "id"                       text PRIMARY KEY NOT NULL,
      "tenant_id"                text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "sso_mode"                 text NOT NULL DEFAULT 'none',
      "allowed_domains"          text NOT NULL DEFAULT '[]',
      "auto_provision_enabled"   integer NOT NULL DEFAULT 1,
      "default_role"             text NOT NULL DEFAULT 'founder',
      "show_sso_button_publicly" integer NOT NULL DEFAULT 0,
      "post_login_redirect_url"  text,
      "post_logout_redirect_url" text,
      "deactivate_on_sso_revoke" integer NOT NULL DEFAULT 0,
      "policy_config"            text NOT NULL DEFAULT '{}',
      "updated_at"               text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  exec("idx_tenant_sso_config_tenant", `CREATE UNIQUE INDEX "idx_tenant_sso_config_tenant" ON "tenant_sso_configs"("tenant_id");`);
  console.log("  + created tenant_sso_configs"); added++;
} else { console.log("  ~ already exists"); skipped++; }

// ── domain_mappings ────────────────────────────────────────────────────────────
console.log("\n3. domain_mappings…");
if (!hasTable("domain_mappings")) {
  db.exec(`
    CREATE TABLE "domain_mappings" (
      "id"                   text PRIMARY KEY NOT NULL,
      "domain"               text NOT NULL,
      "tenant_id"            text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "identity_provider_id" text REFERENCES "identity_providers"("id") ON DELETE SET NULL,
      "sso_required"         integer NOT NULL DEFAULT 0,
      "is_verified"          integer NOT NULL DEFAULT 0,
      "verification_token"   text,
      "verified_at"          text,
      "created_at"           text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  exec("idx_domain_mappings_domain", `CREATE UNIQUE INDEX "idx_domain_mappings_domain" ON "domain_mappings"("domain");`);
  exec("idx_domain_mappings_tenant", `CREATE INDEX "idx_domain_mappings_tenant" ON "domain_mappings"("tenant_id");`);
  console.log("  + created domain_mappings"); added++;
} else { console.log("  ~ already exists"); skipped++; }

// ── user_identities ────────────────────────────────────────────────────────────
console.log("\n4. user_identities…");
if (!hasTable("user_identities")) {
  db.exec(`
    CREATE TABLE "user_identities" (
      "id"                   text PRIMARY KEY NOT NULL,
      "user_id"              text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "identity_provider_id" text NOT NULL REFERENCES "identity_providers"("id") ON DELETE CASCADE,
      "external_subject"     text NOT NULL,
      "external_email"       text,
      "external_name"        text,
      "raw_claims"           text NOT NULL DEFAULT '{}',
      "last_login_at"        text,
      "created_at"           text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  exec("idx_user_identities_provider_subject", `CREATE UNIQUE INDEX "idx_user_identities_provider_subject" ON "user_identities"("identity_provider_id","external_subject");`);
  exec("idx_user_identities_user", `CREATE INDEX "idx_user_identities_user" ON "user_identities"("user_id");`);
  console.log("  + created user_identities"); added++;
} else { console.log("  ~ already exists"); skipped++; }

// ── role_mapping_rules ─────────────────────────────────────────────────────────
console.log("\n5. role_mapping_rules…");
if (!hasTable("role_mapping_rules")) {
  db.exec(`
    CREATE TABLE "role_mapping_rules" (
      "id"                   text PRIMARY KEY NOT NULL,
      "identity_provider_id" text NOT NULL REFERENCES "identity_providers"("id") ON DELETE CASCADE,
      "claim_key"            text NOT NULL,
      "claim_value"          text NOT NULL,
      "mapped_role"          text NOT NULL DEFAULT 'founder',
      "priority"             integer NOT NULL DEFAULT 100,
      "is_active"            integer NOT NULL DEFAULT 1,
      "created_at"           text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  exec("idx_role_mapping_provider", `CREATE INDEX "idx_role_mapping_provider" ON "role_mapping_rules"("identity_provider_id");`);
  console.log("  + created role_mapping_rules"); added++;
} else { console.log("  ~ already exists"); skipped++; }

// ── sso_audit_logs ─────────────────────────────────────────────────────────────
console.log("\n6. sso_audit_logs…");
if (!hasTable("sso_audit_logs")) {
  db.exec(`
    CREATE TABLE "sso_audit_logs" (
      "id"                   text PRIMARY KEY NOT NULL,
      "tenant_id"            text REFERENCES "tenants"("id") ON DELETE SET NULL,
      "identity_provider_id" text REFERENCES "identity_providers"("id") ON DELETE SET NULL,
      "user_id"              text REFERENCES "users"("id") ON DELETE SET NULL,
      "event_type"           text NOT NULL,
      "outcome"              text NOT NULL,
      "email"                text,
      "external_subject"     text,
      "error_code"           text,
      "error_message"        text,
      "ip_address"           text,
      "user_agent"           text,
      "metadata"             text NOT NULL DEFAULT '{}',
      "created_at"           text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  exec("idx_sso_audit_tenant",  `CREATE INDEX "idx_sso_audit_tenant"  ON "sso_audit_logs"("tenant_id");`);
  exec("idx_sso_audit_user",    `CREATE INDEX "idx_sso_audit_user"    ON "sso_audit_logs"("user_id");`);
  exec("idx_sso_audit_type",    `CREATE INDEX "idx_sso_audit_type"    ON "sso_audit_logs"("event_type");`);
  exec("idx_sso_audit_created", `CREATE INDEX "idx_sso_audit_created" ON "sso_audit_logs"("created_at");`);
  console.log("  + created sso_audit_logs"); added++;
} else { console.log("  ~ already exists"); skipped++; }

// ── sso_state_tokens ───────────────────────────────────────────────────────────
console.log("\n7. sso_state_tokens…");
if (!hasTable("sso_state_tokens")) {
  db.exec(`
    CREATE TABLE "sso_state_tokens" (
      "id"                   text PRIMARY KEY NOT NULL,
      "state"                text NOT NULL,
      "tenant_id"            text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "identity_provider_id" text NOT NULL REFERENCES "identity_providers"("id") ON DELETE CASCADE,
      "code_verifier"        text,
      "redirect_to"          text NOT NULL DEFAULT '/dashboard',
      "expires_at"           text NOT NULL,
      "used_at"              text,
      "created_at"           text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  exec("idx_sso_state_state",   `CREATE UNIQUE INDEX "idx_sso_state_state"   ON "sso_state_tokens"("state");`);
  exec("idx_sso_state_expires", `CREATE INDEX "idx_sso_state_expires" ON "sso_state_tokens"("expires_at");`);
  console.log("  + created sso_state_tokens"); added++;
} else { console.log("  ~ already exists"); skipped++; }

db.pragma("foreign_keys = ON");
db.close();
console.log(`\n✅ SSO migration complete — applied: ${added}, already present: ${skipped}`);
