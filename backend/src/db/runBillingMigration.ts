/**
 * Idempotent billing schema migration.
 * Creates 14 billing tables and seeds the 5 default plans.
 * Run with: node_modules/.bin/tsx src/db/runBillingMigration.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../data/dev.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = OFF");

function hasTable(name: string): boolean {
  return !!(db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name));
}

function createIfMissing(name: string, sql: string): boolean {
  if (hasTable(name)) { console.log(`  ~ ${name} already exists`); return false; }
  db.exec(sql);
  console.log(`  + created ${name}`);
  return true;
}

// ── 1. billing_plans ──────────────────────────────────────────────────────
console.log("\n1. billing_plans…");
createIfMissing("billing_plans", `
  CREATE TABLE "billing_plans" (
    "id"                            text PRIMARY KEY NOT NULL,
    "slug"                          text NOT NULL UNIQUE,
    "name"                          text NOT NULL,
    "description"                   text,
    "tier"                          text NOT NULL DEFAULT 'individual_free',
    "billing_cycle"                 text NOT NULL DEFAULT 'monthly',
    "price_monthly"                 integer,
    "price_annual"                  integer,
    "currency"                      text NOT NULL DEFAULT 'USD',
    "seat_limit"                    integer,
    "feature_flags"                 text NOT NULL DEFAULT '{}',
    "limits"                        text NOT NULL DEFAULT '{}',
    "marketing_features"            text NOT NULL DEFAULT '[]',
    "overage_policy"                text NOT NULL DEFAULT '{}',
    "is_sso_included"               integer NOT NULL DEFAULT 0,
    "is_white_label_included"       integer NOT NULL DEFAULT 0,
    "is_advanced_analytics_included" integer NOT NULL DEFAULT 0,
    "is_mentor_module_included"     integer NOT NULL DEFAULT 1,
    "is_community_module_included"  integer NOT NULL DEFAULT 1,
    "is_cohort_module_included"     integer NOT NULL DEFAULT 0,
    "is_public"                     integer NOT NULL DEFAULT 1,
    "trial_days"                    integer NOT NULL DEFAULT 0,
    "sort_order"                    integer NOT NULL DEFAULT 0,
    "is_active"                     integer NOT NULL DEFAULT 1,
    "created_at"                    text NOT NULL DEFAULT (datetime('now')),
    "updated_at"                    text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX "idx_billing_plans_slug" ON "billing_plans"("slug");
  CREATE INDEX "idx_billing_plans_tier" ON "billing_plans"("tier");
`);

// ── 2. customer_accounts ──────────────────────────────────────────────────
console.log("\n2. customer_accounts…");
createIfMissing("customer_accounts", `
  CREATE TABLE "customer_accounts" (
    "id"                      text PRIMARY KEY NOT NULL,
    "user_id"                 text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "customer_type"           text NOT NULL DEFAULT 'individual',
    "provider_customer_id"    text,
    "billing_email"           text,
    "billing_name"            text,
    "billing_address_line1"   text,
    "billing_address_line2"   text,
    "billing_city"            text,
    "billing_state"           text,
    "billing_postal_code"     text,
    "billing_country"         text,
    "tax_id"                  text,
    "vat_number"              text,
    "legal_entity_name"       text,
    "currency"                text NOT NULL DEFAULT 'USD',
    "created_at"              text NOT NULL DEFAULT (datetime('now')),
    "updated_at"              text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX "idx_customer_accounts_user" ON "customer_accounts"("user_id");
  CREATE INDEX "idx_customer_accounts_provider" ON "customer_accounts"("provider_customer_id");
`);

// ── 3. tenant_billing_accounts ────────────────────────────────────────────
console.log("\n3. tenant_billing_accounts…");
createIfMissing("tenant_billing_accounts", `
  CREATE TABLE "tenant_billing_accounts" (
    "id"                        text PRIMARY KEY NOT NULL,
    "tenant_id"                 text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "provider_customer_id"      text,
    "billing_contact_name"      text,
    "billing_contact_email"     text,
    "billing_contact_phone"     text,
    "billing_address_line1"     text,
    "billing_address_line2"     text,
    "billing_city"              text,
    "billing_state"             text,
    "billing_postal_code"       text,
    "billing_country"           text,
    "tax_id"                    text,
    "vat_number"                text,
    "legal_entity_name"         text,
    "purchase_order_number"     text,
    "currency"                  text NOT NULL DEFAULT 'USD',
    "contract_details"          text NOT NULL DEFAULT '{}',
    "created_at"                text NOT NULL DEFAULT (datetime('now')),
    "updated_at"                text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX "idx_tenant_billing_tenant" ON "tenant_billing_accounts"("tenant_id");
`);

// ── 4. subscriptions ──────────────────────────────────────────────────────
console.log("\n4. subscriptions…");
createIfMissing("subscriptions", `
  CREATE TABLE "subscriptions" (
    "id"                          text PRIMARY KEY NOT NULL,
    "plan_id"                     text NOT NULL REFERENCES "billing_plans"("id"),
    "user_id"                     text REFERENCES "users"("id") ON DELETE CASCADE,
    "tenant_id"                   text REFERENCES "tenants"("id") ON DELETE CASCADE,
    "customer_type"               text NOT NULL DEFAULT 'individual',
    "status"                      text NOT NULL DEFAULT 'active',
    "billing_cycle"               text NOT NULL DEFAULT 'monthly',
    "start_date"                  text NOT NULL DEFAULT (datetime('now')),
    "current_period_start"        text NOT NULL DEFAULT (datetime('now')),
    "current_period_end"          text,
    "renewal_date"                text,
    "cancel_at_period_end"        integer NOT NULL DEFAULT 0,
    "canceled_at"                 text,
    "cancel_reason"               text,
    "trial_start"                 text,
    "trial_end"                   text,
    "seat_limit"                  integer,
    "active_seat_count"           integer NOT NULL DEFAULT 0,
    "provider_subscription_id"    text,
    "feature_flag_overrides"      text NOT NULL DEFAULT '{}',
    "limit_overrides"             text NOT NULL DEFAULT '{}',
    "grace_period_end"            text,
    "last_payment_status"         text,
    "last_payment_at"             text,
    "failed_payment_count"        integer NOT NULL DEFAULT 0,
    "admin_notes"                 text,
    "created_at"                  text NOT NULL DEFAULT (datetime('now')),
    "updated_at"                  text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_subscriptions_user" ON "subscriptions"("user_id");
  CREATE INDEX "idx_subscriptions_tenant" ON "subscriptions"("tenant_id");
  CREATE INDEX "idx_subscriptions_plan" ON "subscriptions"("plan_id");
  CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");
  CREATE INDEX "idx_subscriptions_provider" ON "subscriptions"("provider_subscription_id");
`);

// ── 5. subscription_items ─────────────────────────────────────────────────
console.log("\n5. subscription_items…");
createIfMissing("subscription_items", `
  CREATE TABLE "subscription_items" (
    "id"                  text PRIMARY KEY NOT NULL,
    "subscription_id"     text NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
    "item_type"           text NOT NULL DEFAULT 'plan',
    "description"         text NOT NULL,
    "quantity"            integer NOT NULL DEFAULT 1,
    "unit_amount_cents"   integer NOT NULL DEFAULT 0,
    "currency"            text NOT NULL DEFAULT 'USD',
    "provider_item_id"    text,
    "is_active"           integer NOT NULL DEFAULT 1,
    "created_at"          text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_sub_items_subscription" ON "subscription_items"("subscription_id");
`);

// ── 6. payment_methods ────────────────────────────────────────────────────
console.log("\n6. payment_methods…");
createIfMissing("payment_methods", `
  CREATE TABLE "payment_methods" (
    "id"                          text PRIMARY KEY NOT NULL,
    "user_id"                     text REFERENCES "users"("id") ON DELETE CASCADE,
    "tenant_id"                   text REFERENCES "tenants"("id") ON DELETE CASCADE,
    "method_type"                 text NOT NULL DEFAULT 'card',
    "provider_payment_method_id"  text,
    "last4"                       text,
    "brand"                       text,
    "exp_month"                   integer,
    "exp_year"                    integer,
    "is_default"                  integer NOT NULL DEFAULT 0,
    "billing_name"                text,
    "billing_email"               text,
    "created_at"                  text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_payment_methods_user" ON "payment_methods"("user_id");
  CREATE INDEX "idx_payment_methods_tenant" ON "payment_methods"("tenant_id");
`);

// ── 7. invoices ───────────────────────────────────────────────────────────
console.log("\n7. invoices…");
createIfMissing("invoices", `
  CREATE TABLE "invoices" (
    "id"                      text PRIMARY KEY NOT NULL,
    "subscription_id"         text REFERENCES "subscriptions"("id") ON DELETE SET NULL,
    "user_id"                 text REFERENCES "users"("id") ON DELETE SET NULL,
    "tenant_id"               text REFERENCES "tenants"("id") ON DELETE SET NULL,
    "invoice_number"          text NOT NULL UNIQUE,
    "status"                  text NOT NULL DEFAULT 'draft',
    "currency"                text NOT NULL DEFAULT 'USD',
    "subtotal_cents"          integer NOT NULL DEFAULT 0,
    "tax_cents"               integer NOT NULL DEFAULT 0,
    "discount_cents"          integer NOT NULL DEFAULT 0,
    "total_cents"             integer NOT NULL DEFAULT 0,
    "amount_paid_cents"       integer NOT NULL DEFAULT 0,
    "tax_rate"                text,
    "tax_region"              text,
    "billing_name"            text,
    "billing_email"           text,
    "billing_address_line1"   text,
    "billing_city"            text,
    "billing_country"         text,
    "vat_number"              text,
    "legal_entity_name"       text,
    "period_start"            text,
    "period_end"              text,
    "due_date"                text,
    "paid_at"                 text,
    "voided_at"               text,
    "provider_invoice_id"     text,
    "provider_hosted_url"     text,
    "provider_pdf_url"        text,
    "provider_data"           text NOT NULL DEFAULT '{}',
    "created_at"              text NOT NULL DEFAULT (datetime('now')),
    "updated_at"              text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX "idx_invoices_number" ON "invoices"("invoice_number");
  CREATE INDEX "idx_invoices_user" ON "invoices"("user_id");
  CREATE INDEX "idx_invoices_tenant" ON "invoices"("tenant_id");
  CREATE INDEX "idx_invoices_subscription" ON "invoices"("subscription_id");
  CREATE INDEX "idx_invoices_status" ON "invoices"("status");
  CREATE INDEX "idx_invoices_created" ON "invoices"("created_at");
`);

// ── 8. invoice_lines ──────────────────────────────────────────────────────
console.log("\n8. invoice_lines…");
createIfMissing("invoice_lines", `
  CREATE TABLE "invoice_lines" (
    "id"                  text PRIMARY KEY NOT NULL,
    "invoice_id"          text NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
    "description"         text NOT NULL,
    "quantity"            integer NOT NULL DEFAULT 1,
    "unit_amount_cents"   integer NOT NULL DEFAULT 0,
    "total_cents"         integer NOT NULL DEFAULT 0,
    "currency"            text NOT NULL DEFAULT 'USD',
    "period_start"        text,
    "period_end"          text,
    "line_type"           text NOT NULL DEFAULT 'subscription',
    "provider_line_id"    text,
    "created_at"          text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_invoice_lines_invoice" ON "invoice_lines"("invoice_id");
`);

// ── 9. billing_events ─────────────────────────────────────────────────────
console.log("\n9. billing_events…");
createIfMissing("billing_events", `
  CREATE TABLE "billing_events" (
    "id"                text PRIMARY KEY NOT NULL,
    "subscription_id"   text REFERENCES "subscriptions"("id") ON DELETE SET NULL,
    "user_id"           text REFERENCES "users"("id") ON DELETE SET NULL,
    "tenant_id"         text REFERENCES "tenants"("id") ON DELETE SET NULL,
    "event_type"        text NOT NULL,
    "outcome"           text NOT NULL DEFAULT 'success',
    "actor"             text NOT NULL DEFAULT 'system',
    "actor_id"          text,
    "payload"           text NOT NULL DEFAULT '{}',
    "created_at"        text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_billing_events_subscription" ON "billing_events"("subscription_id");
  CREATE INDEX "idx_billing_events_user" ON "billing_events"("user_id");
  CREATE INDEX "idx_billing_events_tenant" ON "billing_events"("tenant_id");
  CREATE INDEX "idx_billing_events_type" ON "billing_events"("event_type");
  CREATE INDEX "idx_billing_events_created" ON "billing_events"("created_at");
`);

// ── 10. seat_allocations ──────────────────────────────────────────────────
console.log("\n10. seat_allocations…");
createIfMissing("seat_allocations", `
  CREATE TABLE "seat_allocations" (
    "id"                text PRIMARY KEY NOT NULL,
    "subscription_id"   text NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
    "tenant_id"         text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "user_id"           text REFERENCES "users"("id") ON DELETE SET NULL,
    "invite_email"      text,
    "status"            text NOT NULL DEFAULT 'active',
    "role"              text NOT NULL DEFAULT 'member',
    "allocated_at"      text NOT NULL DEFAULT (datetime('now')),
    "revoked_at"        text,
    "allocated_by"      text REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at"        text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_seat_allocations_subscription" ON "seat_allocations"("subscription_id");
  CREATE INDEX "idx_seat_allocations_tenant" ON "seat_allocations"("tenant_id");
  CREATE INDEX "idx_seat_allocations_user" ON "seat_allocations"("user_id");
`);

// ── 11. usage_snapshots ───────────────────────────────────────────────────
console.log("\n11. usage_snapshots…");
createIfMissing("usage_snapshots", `
  CREATE TABLE "usage_snapshots" (
    "id"                    text PRIMARY KEY NOT NULL,
    "subscription_id"       text NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
    "user_id"               text REFERENCES "users"("id") ON DELETE SET NULL,
    "tenant_id"             text REFERENCES "tenants"("id") ON DELETE SET NULL,
    "snapshot_date"         text NOT NULL,
    "metrics"               text NOT NULL DEFAULT '{}',
    "billing_period_start"  text,
    "billing_period_end"    text,
    "created_at"            text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_usage_snapshots_subscription" ON "usage_snapshots"("subscription_id");
  CREATE INDEX "idx_usage_snapshots_date" ON "usage_snapshots"("snapshot_date");
`);

// ── 12. discount_coupons ──────────────────────────────────────────────────
console.log("\n12. discount_coupons…");
createIfMissing("discount_coupons", `
  CREATE TABLE "discount_coupons" (
    "id"                        text PRIMARY KEY NOT NULL,
    "code"                      text NOT NULL UNIQUE,
    "name"                      text NOT NULL,
    "description"               text,
    "discount_type"             text NOT NULL DEFAULT 'percentage',
    "discount_value"            integer NOT NULL,
    "currency"                  text,
    "applicable_plan_slugs"     text,
    "applicable_customer_type"  text,
    "max_redemptions"           integer,
    "redemption_count"          integer NOT NULL DEFAULT 0,
    "duration_months"           integer,
    "valid_from"                text,
    "valid_until"               text,
    "is_active"                 integer NOT NULL DEFAULT 1,
    "provider_coupon_id"        text,
    "created_by"                text REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at"                text NOT NULL DEFAULT (datetime('now')),
    "updated_at"                text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX "idx_discount_coupons_code" ON "discount_coupons"("code");
`);

// ── 13. trial_periods ─────────────────────────────────────────────────────
console.log("\n13. trial_periods…");
createIfMissing("trial_periods", `
  CREATE TABLE "trial_periods" (
    "id"                text PRIMARY KEY NOT NULL,
    "subscription_id"   text NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
    "user_id"           text REFERENCES "users"("id") ON DELETE SET NULL,
    "tenant_id"         text REFERENCES "tenants"("id") ON DELETE SET NULL,
    "trial_plan_id"     text REFERENCES "billing_plans"("id"),
    "start_date"        text NOT NULL,
    "end_date"          text NOT NULL,
    "status"            text NOT NULL DEFAULT 'active',
    "converted_at"      text,
    "extended_at"       text,
    "extension_days"    integer NOT NULL DEFAULT 0,
    "extended_by"       text REFERENCES "users"("id") ON DELETE SET NULL,
    "reminder_sent_7d"  integer NOT NULL DEFAULT 0,
    "reminder_sent_1d"  integer NOT NULL DEFAULT 0,
    "created_at"        text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX "idx_trial_periods_subscription" ON "trial_periods"("subscription_id");
  CREATE INDEX "idx_trial_periods_end" ON "trial_periods"("end_date");
`);

// ── 14. add_ons ───────────────────────────────────────────────────────────
console.log("\n14. add_ons…");
createIfMissing("add_ons", `
  CREATE TABLE "add_ons" (
    "id"                      text PRIMARY KEY NOT NULL,
    "slug"                    text NOT NULL UNIQUE,
    "name"                    text NOT NULL,
    "description"             text,
    "billing_cycle"           text NOT NULL DEFAULT 'monthly',
    "price_monthly"           integer,
    "price_annual"            integer,
    "currency"                text NOT NULL DEFAULT 'USD',
    "feature_flags"           text NOT NULL DEFAULT '{}',
    "limits"                  text NOT NULL DEFAULT '{}',
    "compatible_plan_slugs"   text,
    "is_public"               integer NOT NULL DEFAULT 1,
    "is_active"               integer NOT NULL DEFAULT 1,
    "provider_product_id"     text,
    "created_at"              text NOT NULL DEFAULT (datetime('now')),
    "updated_at"              text NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX "idx_add_ons_slug" ON "add_ons"("slug");
`);

// ── Seed default billing plans ────────────────────────────────────────────
console.log("\n15. Seeding default billing plans…");

const existingPlanCount = (db.prepare(`SELECT COUNT(*) as n FROM billing_plans`).get() as { n: number }).n;

if (existingPlanCount === 0) {
  const now = new Date().toISOString();

  const plans = [
    {
      id: randomUUID(),
      slug: "free",
      name: "Free",
      description: "Start building connections for free",
      tier: "individual_free",
      billing_cycle: "monthly",
      price_monthly: 0,
      price_annual: 0,
      currency: "USD",
      seat_limit: 1,
      feature_flags: JSON.stringify({ basicMatching: true, communities: false, privateCommunities: false, mentorDiscovery: true, advancedMentorFilters: false, premiumMatchFilters: false, advancedAnalytics: false, whiteLabelBranding: false, sso: false, apiAccess: false, exportCsv: false, prioritySupport: false }),
      limits: JSON.stringify({ matchesPerMonth: 10, savedProfiles: 20, communities: 0, messages: 50 }),
      marketing_features: JSON.stringify(["Up to 10 matches/month", "Basic profile", "Standard discovery", "Community browsing", "50 messages/month"]),
      overage_policy: JSON.stringify({ action: "block", message: "Upgrade to continue" }),
      is_sso_included: 0, is_white_label_included: 0, is_advanced_analytics_included: 0,
      is_mentor_module_included: 1, is_community_module_included: 1, is_cohort_module_included: 0,
      is_public: 1, trial_days: 0, sort_order: 0, is_active: 1, created_at: now, updated_at: now,
    },
    {
      id: randomUUID(),
      slug: "premium",
      name: "Premium",
      description: "Unlock the full power of CoFounder Connect",
      tier: "individual_premium",
      billing_cycle: "monthly",
      price_monthly: 2900,
      price_annual: 24900,
      currency: "USD",
      seat_limit: 1,
      feature_flags: JSON.stringify({ basicMatching: true, communities: true, privateCommunities: true, mentorDiscovery: true, advancedMentorFilters: true, premiumMatchFilters: true, advancedAnalytics: true, whiteLabelBranding: false, sso: false, apiAccess: false, exportCsv: true, prioritySupport: false }),
      limits: JSON.stringify({ matchesPerMonth: -1, savedProfiles: 500, communities: 10, messages: -1 }),
      marketing_features: JSON.stringify(["Unlimited matches", "Premium match filters", "Private communities", "Advanced mentor discovery", "CSV export", "Advanced analytics", "Unlimited messages"]),
      overage_policy: JSON.stringify({ action: "allow" }),
      is_sso_included: 0, is_white_label_included: 0, is_advanced_analytics_included: 1,
      is_mentor_module_included: 1, is_community_module_included: 1, is_cohort_module_included: 0,
      is_public: 1, trial_days: 14, sort_order: 1, is_active: 1, created_at: now, updated_at: now,
    },
    {
      id: randomUUID(),
      slug: "org_starter",
      name: "Organization Starter",
      description: "For teams and growing organizations",
      tier: "org_starter",
      billing_cycle: "monthly",
      price_monthly: 14900,
      price_annual: 129900,
      currency: "USD",
      seat_limit: 10,
      feature_flags: JSON.stringify({ basicMatching: true, communities: true, privateCommunities: true, mentorDiscovery: true, advancedMentorFilters: true, premiumMatchFilters: true, advancedAnalytics: true, whiteLabelBranding: false, sso: false, apiAccess: false, exportCsv: true, prioritySupport: false, orgDashboard: true, seatManagement: true }),
      limits: JSON.stringify({ matchesPerMonth: -1, savedProfiles: -1, communities: 20, messages: -1, seats: 10 }),
      marketing_features: JSON.stringify(["Up to 10 seats", "All Premium features", "Organization dashboard", "Shared team spaces", "Team analytics", "CSV export", "Priority email support"]),
      overage_policy: JSON.stringify({ action: "notify_admin", extraSeatPriceCents: 1500 }),
      is_sso_included: 0, is_white_label_included: 0, is_advanced_analytics_included: 1,
      is_mentor_module_included: 1, is_community_module_included: 1, is_cohort_module_included: 1,
      is_public: 1, trial_days: 14, sort_order: 2, is_active: 1, created_at: now, updated_at: now,
    },
    {
      id: randomUUID(),
      slug: "org_pro",
      name: "Organization Pro",
      description: "Advanced organization features with white-labeling and SSO",
      tier: "org_pro",
      billing_cycle: "monthly",
      price_monthly: 49900,
      price_annual: 479900,
      currency: "USD",
      seat_limit: 50,
      feature_flags: JSON.stringify({ basicMatching: true, communities: true, privateCommunities: true, mentorDiscovery: true, advancedMentorFilters: true, premiumMatchFilters: true, advancedAnalytics: true, whiteLabelBranding: true, sso: true, apiAccess: true, exportCsv: true, prioritySupport: true, orgDashboard: true, seatManagement: true, cohortManagement: true }),
      limits: JSON.stringify({ matchesPerMonth: -1, savedProfiles: -1, communities: -1, messages: -1, seats: 50 }),
      marketing_features: JSON.stringify(["Up to 50 seats", "White-label branding", "SSO (SAML/OIDC)", "API access", "Cohort management", "Advanced analytics", "Dedicated support"]),
      overage_policy: JSON.stringify({ action: "notify_admin", extraSeatPriceCents: 1200 }),
      is_sso_included: 1, is_white_label_included: 1, is_advanced_analytics_included: 1,
      is_mentor_module_included: 1, is_community_module_included: 1, is_cohort_module_included: 1,
      is_public: 1, trial_days: 0, sort_order: 3, is_active: 1, created_at: now, updated_at: now,
    },
    {
      id: randomUUID(),
      slug: "enterprise",
      name: "Enterprise",
      description: "Custom contracts, unlimited scale, dedicated support",
      tier: "enterprise",
      billing_cycle: "custom",
      price_monthly: null,
      price_annual: null,
      currency: "USD",
      seat_limit: null,
      feature_flags: JSON.stringify({ basicMatching: true, communities: true, privateCommunities: true, mentorDiscovery: true, advancedMentorFilters: true, premiumMatchFilters: true, advancedAnalytics: true, whiteLabelBranding: true, sso: true, apiAccess: true, exportCsv: true, prioritySupport: true, orgDashboard: true, seatManagement: true, cohortManagement: true, customIntegrations: true, slaSupport: true }),
      limits: JSON.stringify({ matchesPerMonth: -1, savedProfiles: -1, communities: -1, messages: -1, seats: -1 }),
      marketing_features: JSON.stringify(["Unlimited seats", "All Pro features", "Custom integrations", "SLA support", "Dedicated account manager", "Procurement & invoicing", "Custom contract & pricing", "On-premise option"]),
      overage_policy: JSON.stringify({ action: "allow" }),
      is_sso_included: 1, is_white_label_included: 1, is_advanced_analytics_included: 1,
      is_mentor_module_included: 1, is_community_module_included: 1, is_cohort_module_included: 1,
      is_public: 1, trial_days: 0, sort_order: 4, is_active: 1, created_at: now, updated_at: now,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO billing_plans (
      id, slug, name, description, tier, billing_cycle,
      price_monthly, price_annual, currency, seat_limit,
      feature_flags, limits, marketing_features, overage_policy,
      is_sso_included, is_white_label_included, is_advanced_analytics_included,
      is_mentor_module_included, is_community_module_included, is_cohort_module_included,
      is_public, trial_days, sort_order, is_active, created_at, updated_at
    ) VALUES (
      @id, @slug, @name, @description, @tier, @billing_cycle,
      @price_monthly, @price_annual, @currency, @seat_limit,
      @feature_flags, @limits, @marketing_features, @overage_policy,
      @is_sso_included, @is_white_label_included, @is_advanced_analytics_included,
      @is_mentor_module_included, @is_community_module_included, @is_cohort_module_included,
      @is_public, @trial_days, @sort_order, @is_active, @created_at, @updated_at
    )
  `);

  const insertMany = db.transaction((rows: typeof plans) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(plans);
  console.log(`  + seeded ${plans.length} billing plans`);
} else {
  console.log(`  ~ ${existingPlanCount} plans already exist — skipping seed`);
}

// ── Seed 3 default add-ons ─────────────────────────────────────────────────
console.log("\n16. Seeding default add-ons…");
const existingAddOnCount = (db.prepare(`SELECT COUNT(*) as n FROM add_ons`).get() as { n: number }).n;
if (existingAddOnCount === 0) {
  const now = new Date().toISOString();
  const addOnsData = [
    { id: randomUUID(), slug: "extra_seats_5", name: "Extra 5 Seats", description: "Add 5 additional member seats", billing_cycle: "monthly", price_monthly: 5900, price_annual: 59900, currency: "USD", feature_flags: "{}", limits: JSON.stringify({ extraSeats: 5 }), compatible_plan_slugs: JSON.stringify(["org_starter", "org_pro"]), is_public: 1, is_active: 1, created_at: now, updated_at: now },
    { id: randomUUID(), slug: "advanced_analytics_addon", name: "Advanced Analytics", description: "Deep analytics and reporting dashboard", billing_cycle: "monthly", price_monthly: 4900, price_annual: 47900, currency: "USD", feature_flags: JSON.stringify({ advancedAnalytics: true }), limits: "{}", compatible_plan_slugs: JSON.stringify(["free", "premium"]), is_public: 1, is_active: 1, created_at: now, updated_at: now },
    { id: randomUUID(), slug: "white_label_addon", name: "White-Label Branding", description: "Custom branding, domain and colors", billing_cycle: "monthly", price_monthly: 9900, price_annual: 99900, currency: "USD", feature_flags: JSON.stringify({ whiteLabelBranding: true }), limits: "{}", compatible_plan_slugs: JSON.stringify(["org_starter"]), is_public: 1, is_active: 1, created_at: now, updated_at: now },
  ];
  const ins = db.prepare(`INSERT INTO add_ons (id,slug,name,description,billing_cycle,price_monthly,price_annual,currency,feature_flags,limits,compatible_plan_slugs,is_public,is_active,created_at,updated_at) VALUES (@id,@slug,@name,@description,@billing_cycle,@price_monthly,@price_annual,@currency,@feature_flags,@limits,@compatible_plan_slugs,@is_public,@is_active,@created_at,@updated_at)`);
  const insertAddOns = db.transaction((rows: typeof addOnsData) => { for (const r of rows) ins.run(r); });
  insertAddOns(addOnsData);
  console.log(`  + seeded ${addOnsData.length} add-ons`);
} else {
  console.log(`  ~ ${existingAddOnCount} add-ons already exist — skipping seed`);
}

db.pragma("foreign_keys = ON");
db.close();
console.log("\n✅ Billing migration complete");
