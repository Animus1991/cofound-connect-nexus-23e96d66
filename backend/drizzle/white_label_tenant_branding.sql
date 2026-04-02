-- White-Label Tenant Branding Migration
-- Run this manually if drizzle db:push is blocked by pre-existing schema drift.
-- Safe to run multiple times (uses IF NOT EXISTS / ALTER TABLE checks).

-- ── Step 1: Expand tenants table ────────────────────────────────────────────

-- Add new columns to tenants (SQLite: one ALTER TABLE per column)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "display_name" text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "about_text" text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "is_branding_active" integer NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "published_at" text;

-- Backfill slug from organization id for existing rows (avoids NOT NULL violation)
UPDATE tenants SET slug = id WHERE slug IS NULL OR slug = '';

-- Create unique index for slug
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenants_slug" ON tenants("slug");

-- ── Step 2: Tenant Branding table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tenant_branding" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "primary_color" text,
  "secondary_color" text,
  "accent_color" text,
  "background_style" text NOT NULL DEFAULT 'auto',
  "logo_url" text,
  "favicon_url" text,
  "logo_alt_text" text,
  "hero_image_url" text,
  "heading_font" text,
  "body_font" text,
  "corner_style" text NOT NULL DEFAULT 'default',
  "updated_at" text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_branding_tenant" ON "tenant_branding"("tenant_id");

-- ── Step 3: Tenant Content Settings table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS "tenant_content_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "hero_title" text,
  "hero_subtitle" text,
  "hero_cta_label" text,
  "hero_cta_secondary_label" text,
  "platform_description" text,
  "tagline" text,
  "onboarding_intro_text" text,
  "onboarding_step1_text" text,
  "onboarding_step2_text" text,
  "dashboard_welcome_text" text,
  "community_label" text,
  "member_label" text,
  "mentor_label" text,
  "match_label" text,
  "role_labels" text NOT NULL DEFAULT '{}',
  "apply_cta_label" text,
  "updated_at" text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_content_tenant" ON "tenant_content_settings"("tenant_id");

-- ── Step 4: Tenant Legal Settings table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tenant_legal_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "privacy_policy_url" text,
  "terms_of_service_url" text,
  "cookie_policy_url" text,
  "support_email" text,
  "support_phone" text,
  "support_url" text,
  "company_name" text,
  "company_address" text,
  "updated_at" text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_legal_tenant" ON "tenant_legal_settings"("tenant_id");

-- ── Step 5: Tenant Email Settings table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tenant_email_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "from_name" text,
  "from_email" text,
  "reply_to_email" text,
  "email_header_logo_url" text,
  "email_signature" text,
  "email_footer_branding" text,
  "subject_prefix" text,
  "updated_at" text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_email_tenant" ON "tenant_email_settings"("tenant_id");

-- ── Step 6: Tenant Social Links table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tenant_social_links" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "website_url" text,
  "linkedin_url" text,
  "twitter_url" text,
  "instagram_url" text,
  "facebook_url" text,
  "youtube_url" text,
  "github_url" text,
  "updated_at" text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_social_tenant" ON "tenant_social_links"("tenant_id");
