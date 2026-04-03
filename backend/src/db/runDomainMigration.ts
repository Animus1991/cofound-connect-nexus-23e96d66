/**
 * runDomainMigration.ts
 * Idempotent migration: creates the 3 tenant domain mapping tables.
 * Run with: npx tsx src/db/runDomainMigration.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../data/dev.db");

const db = new Database(dbPath);
db.pragma("foreign_keys = OFF");

let created = 0;
let skipped = 0;

function hasTable(name: string): boolean {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name);
  return !!row;
}

function hasColumn(table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

function addColumn(table: string, column: string, def: string) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${def};`);
    console.log(`  + "${table}"."${column}"`);
    created++;
  } else {
    skipped++;
  }
}

function execOnce(label: string, sql: string) {
  try {
    db.exec(sql);
    console.log(`  + ${label}`);
    created++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      skipped++;
    } else {
      throw err;
    }
  }
}

console.log("\n═══════════════════════════════════════════════");
console.log("  Tenant Domain Mapping — Migration");
console.log("═══════════════════════════════════════════════\n");

// ── Step 1: Ensure `domain` column on tenants (may already exist) ─────────
console.log("Step 1: tenants table — ensure domain column…");
addColumn("tenants", "domain", "text");

// ── Step 2: tenant_domains ────────────────────────────────────────────────
console.log("\nStep 2: tenant_domains table…");
if (!hasTable("tenant_domains")) {
  db.exec(`
    CREATE TABLE "tenant_domains" (
      "id"                  text PRIMARY KEY NOT NULL,
      "tenant_id"           text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "domain_name"         text NOT NULL,
      "domain_type"         text NOT NULL DEFAULT 'custom',
      "is_primary"          integer NOT NULL DEFAULT 0,
      "verification_status" text NOT NULL DEFAULT 'pending',
      "verification_token"  text NOT NULL,
      "last_verified_at"    text,
      "ssl_status"          text NOT NULL DEFAULT 'none',
      "is_active"           integer NOT NULL DEFAULT 0,
      "redirect_behavior"   text NOT NULL DEFAULT 'serve',
      "redirect_target"     text,
      "dns_instructions"    text NOT NULL DEFAULT '{}',
      "notes"               text,
      "approved_by"         text REFERENCES "users"("id") ON DELETE SET NULL,
      "approved_at"         text,
      "created_at"          text NOT NULL DEFAULT (datetime('now')),
      "updated_at"          text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("  + created tenant_domains");
  created++;
} else {
  console.log("  ~ tenant_domains already exists");
  skipped++;
}

execOnce(
  "UNIQUE INDEX idx_tenant_domains_name",
  `CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_domains_name" ON "tenant_domains"("domain_name");`,
);
execOnce(
  "INDEX idx_tenant_domains_tenant",
  `CREATE INDEX IF NOT EXISTS "idx_tenant_domains_tenant" ON "tenant_domains"("tenant_id");`,
);
execOnce(
  "INDEX idx_tenant_domains_active",
  `CREATE INDEX IF NOT EXISTS "idx_tenant_domains_active" ON "tenant_domains"("is_active");`,
);
execOnce(
  "INDEX idx_tenant_domains_type",
  `CREATE INDEX IF NOT EXISTS "idx_tenant_domains_type" ON "tenant_domains"("domain_type");`,
);

// ── Step 3: domain_verifications ──────────────────────────────────────────
console.log("\nStep 3: domain_verifications table…");
if (!hasTable("domain_verifications")) {
  db.exec(`
    CREATE TABLE "domain_verifications" (
      "id"             text PRIMARY KEY NOT NULL,
      "domain_id"      text NOT NULL REFERENCES "tenant_domains"("id") ON DELETE CASCADE,
      "tenant_id"      text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "method"         text NOT NULL DEFAULT 'dns_txt',
      "outcome"        text NOT NULL,
      "resolved_value" text,
      "error_message"  text,
      "actor"          text NOT NULL DEFAULT 'system',
      "actor_id"       text,
      "metadata"       text NOT NULL DEFAULT '{}',
      "created_at"     text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("  + created domain_verifications");
  created++;
} else {
  console.log("  ~ domain_verifications already exists");
  skipped++;
}

execOnce(
  "INDEX idx_domain_verif_domain",
  `CREATE INDEX IF NOT EXISTS "idx_domain_verif_domain" ON "domain_verifications"("domain_id");`,
);
execOnce(
  "INDEX idx_domain_verif_tenant",
  `CREATE INDEX IF NOT EXISTS "idx_domain_verif_tenant" ON "domain_verifications"("tenant_id");`,
);
execOnce(
  "INDEX idx_domain_verif_created",
  `CREATE INDEX IF NOT EXISTS "idx_domain_verif_created" ON "domain_verifications"("created_at");`,
);

// ── Step 4: domain_routing_rules ──────────────────────────────────────────
console.log("\nStep 4: domain_routing_rules table…");
if (!hasTable("domain_routing_rules")) {
  db.exec(`
    CREATE TABLE "domain_routing_rules" (
      "id"         text PRIMARY KEY NOT NULL,
      "domain_id"  text NOT NULL REFERENCES "tenant_domains"("id") ON DELETE CASCADE,
      "tenant_id"  text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "rule_type"  text NOT NULL,
      "rule_value" text NOT NULL,
      "config"     text NOT NULL DEFAULT '{}',
      "is_active"  integer NOT NULL DEFAULT 1,
      "created_at" text NOT NULL DEFAULT (datetime('now')),
      "updated_at" text NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("  + created domain_routing_rules");
  created++;
} else {
  console.log("  ~ domain_routing_rules already exists");
  skipped++;
}

execOnce(
  "INDEX idx_domain_rules_domain",
  `CREATE INDEX IF NOT EXISTS "idx_domain_rules_domain" ON "domain_routing_rules"("domain_id");`,
);
execOnce(
  "INDEX idx_domain_rules_tenant",
  `CREATE INDEX IF NOT EXISTS "idx_domain_rules_tenant" ON "domain_routing_rules"("tenant_id");`,
);

// ── Done ──────────────────────────────────────────────────────────────────
console.log(`\n✓ Done — ${created} created, ${skipped} already up to date.\n`);
db.close();
