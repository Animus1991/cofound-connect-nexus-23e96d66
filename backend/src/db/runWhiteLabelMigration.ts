/**
 * One-off migration: creates the 5 white-label tenant branding tables and
 * adds the new columns to the existing tenants table.
 * Run with: npx tsx src/db/runWhiteLabelMigration.ts
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

// ── Helper: check if a column exists in a table ───────────────────────────────
function hasColumn(table: string, column: string): boolean {
  const row = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{ name: string }>;
  return row.some((r) => r.name === column);
}

// ── Helper: check if a table exists ──────────────────────────────────────────
function hasTable(name: string): boolean {
  const row = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
  ).get(name);
  return !!row;
}

// ── Helper: add column if missing ─────────────────────────────────────────────
function addColumn(table: string, column: string, def: string) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${def};`);
    console.log(`  + "${table}"."${column}"`);
    added++;
  } else {
    skipped++;
  }
}

// ── Helper: exec DDL idempotently ─────────────────────────────────────────────
function execOnce(label: string, sql: string) {
  try {
    db.exec(sql);
    console.log(`  + ${label}`);
    added++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      skipped++;
    } else {
      throw err;
    }
  }
}

// ── Step 1: Expand tenants table ─────────────────────────────────────────────
console.log("\nStep 1: expanding tenants table…");
addColumn("tenants", "slug",               "text NOT NULL DEFAULT ''");
addColumn("tenants", "display_name",       "text");
addColumn("tenants", "description",        "text");
addColumn("tenants", "about_text",         "text");
addColumn("tenants", "is_branding_active", "integer NOT NULL DEFAULT 0");
addColumn("tenants", "published_at",       "text");

// Backfill slug from id for any existing rows
db.exec(`UPDATE tenants SET slug = id WHERE slug IS NULL OR slug = '';`);

execOnce(
  'UNIQUE INDEX idx_tenants_slug',
  `CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenants_slug" ON tenants("slug");`,
);

// ── Step 2: tenant_branding ───────────────────────────────────────────────────
console.log("\nStep 2: tenant_branding table…");
if (!hasTable("tenant_branding")) {
  db.exec(`
    CREATE TABLE "tenant_branding" (
      "id"               text PRIMARY KEY NOT NULL,
      "tenant_id"        text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "primary_color"    text,
      "secondary_color"  text,
      "accent_color"     text,
      "background_style" text NOT NULL DEFAULT 'auto',
      "logo_url"         text,
      "favicon_url"      text,
      "logo_alt_text"    text,
      "hero_image_url"   text,
      "heading_font"     text,
      "body_font"        text,
      "corner_style"     text NOT NULL DEFAULT 'default',
      "updated_at"       text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(`CREATE UNIQUE INDEX "idx_tenant_branding_tenant" ON "tenant_branding"("tenant_id");`);
  console.log("  + created tenant_branding");
  added++;
} else {
  console.log("  ~ tenant_branding already exists");
  skipped++;
}

// ── Step 3: tenant_content_settings ──────────────────────────────────────────
console.log("\nStep 3: tenant_content_settings table…");
if (!hasTable("tenant_content_settings")) {
  db.exec(`
    CREATE TABLE "tenant_content_settings" (
      "id"                       text PRIMARY KEY NOT NULL,
      "tenant_id"                text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "hero_title"               text,
      "hero_subtitle"            text,
      "hero_cta_label"           text,
      "hero_cta_secondary_label" text,
      "platform_description"     text,
      "tagline"                  text,
      "onboarding_intro_text"    text,
      "onboarding_step1_text"    text,
      "onboarding_step2_text"    text,
      "dashboard_welcome_text"   text,
      "community_label"          text,
      "member_label"             text,
      "mentor_label"             text,
      "match_label"              text,
      "role_labels"              text NOT NULL DEFAULT '{}',
      "apply_cta_label"          text,
      "updated_at"               text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(`CREATE UNIQUE INDEX "idx_tenant_content_tenant" ON "tenant_content_settings"("tenant_id");`);
  console.log("  + created tenant_content_settings");
  added++;
} else {
  console.log("  ~ tenant_content_settings already exists");
  skipped++;
}

// ── Step 4: tenant_legal_settings ────────────────────────────────────────────
console.log("\nStep 4: tenant_legal_settings table…");
if (!hasTable("tenant_legal_settings")) {
  db.exec(`
    CREATE TABLE "tenant_legal_settings" (
      "id"                   text PRIMARY KEY NOT NULL,
      "tenant_id"            text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "privacy_policy_url"   text,
      "terms_of_service_url" text,
      "cookie_policy_url"    text,
      "support_email"        text,
      "support_phone"        text,
      "support_url"          text,
      "company_name"         text,
      "company_address"      text,
      "updated_at"           text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(`CREATE UNIQUE INDEX "idx_tenant_legal_tenant" ON "tenant_legal_settings"("tenant_id");`);
  console.log("  + created tenant_legal_settings");
  added++;
} else {
  console.log("  ~ tenant_legal_settings already exists");
  skipped++;
}

// ── Step 5: tenant_email_settings ────────────────────────────────────────────
console.log("\nStep 5: tenant_email_settings table…");
if (!hasTable("tenant_email_settings")) {
  db.exec(`
    CREATE TABLE "tenant_email_settings" (
      "id"                    text PRIMARY KEY NOT NULL,
      "tenant_id"             text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "from_name"             text,
      "from_email"            text,
      "reply_to_email"        text,
      "email_header_logo_url" text,
      "email_signature"       text,
      "email_footer_branding" text,
      "subject_prefix"        text,
      "updated_at"            text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(`CREATE UNIQUE INDEX "idx_tenant_email_tenant" ON "tenant_email_settings"("tenant_id");`);
  console.log("  + created tenant_email_settings");
  added++;
} else {
  console.log("  ~ tenant_email_settings already exists");
  skipped++;
}

// ── Step 6: tenant_social_links ───────────────────────────────────────────────
console.log("\nStep 6: tenant_social_links table…");
if (!hasTable("tenant_social_links")) {
  db.exec(`
    CREATE TABLE "tenant_social_links" (
      "id"            text PRIMARY KEY NOT NULL,
      "tenant_id"     text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "website_url"   text,
      "linkedin_url"  text,
      "twitter_url"   text,
      "instagram_url" text,
      "facebook_url"  text,
      "youtube_url"   text,
      "github_url"    text,
      "updated_at"    text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(`CREATE UNIQUE INDEX "idx_tenant_social_tenant" ON "tenant_social_links"("tenant_id");`);
  console.log("  + created tenant_social_links");
  added++;
} else {
  console.log("  ~ tenant_social_links already exists");
  skipped++;
}

db.pragma("foreign_keys = ON");
db.close();

console.log(`\n✅ Migration complete — applied: ${added}, already present: ${skipped}`);
