import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── Profiles ─────────────────────────────────────────────────────────────────

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  location: text("location"),
  availability: text("availability"),
  stage: text("stage"),
  commitment: text("commitment"),
  compensation: text("compensation"),
  lookingFor: text("looking_for"),
  skills: text("skills").notNull().default("[]"),       // JSON array
  interests: text("interests").notNull().default("[]"), // JSON array
  linkedin: text("linkedin"),
  github: text("github"),
  website: text("website"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── User Settings ────────────────────────────────────────────────────────────

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("Europe/Athens"),
  notifications: text("notifications").notNull().default("{}"), // JSON
  privacy: text("privacy").notNull().default("{}"),             // JSON
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── Password Reset Tokens ────────────────────────────────────────────────────

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Refresh Tokens ───────────────────────────────────────────────────────────

export const refreshTokens = sqliteTable("refresh_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_refresh_tokens_user").on(table.userId),
  index("idx_refresh_tokens_token").on(table.token),
]);

// ── Connections ──────────────────────────────────────────────────────────────

export const connections = sqliteTable("connections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_connection_pair").on(table.userId, table.targetId),
  index("idx_connections_user").on(table.userId),
  index("idx_connections_target").on(table.targetId),
]);

// ── Connection Requests ──────────────────────────────────────────────────────

export const connectionRequests = sqliteTable("connection_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromId: text("from_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toId: text("to_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending | accepted | declined
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_conn_req_pair").on(table.fromId, table.toId),
  index("idx_conn_req_to").on(table.toId),
  index("idx_conn_req_from").on(table.fromId),
]);

// ── Milestones ─────────────────────────────────────────────────────────────────
// Lightweight per-user venture progress tracker.

export const milestones = sqliteTable("milestones", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  /** Product | Business | Team | Fundraising | Marketing | Legal */
  category: text("category").notNull().default("Product"),
  /** completed | in-progress | upcoming | at-risk */
  status: text("status").notNull().default("upcoming"),
  targetDate: text("target_date"),
  notes: text("notes"),
  /** 0–100 */
  progress: integer("progress").notNull().default(0),
  /** display order within user's milestones */
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_milestones_user").on(table.userId),
  index("idx_milestones_status").on(table.userId, table.status),
]);

// ── Opportunities ────────────────────────────────────────────────────────────

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("cofounder"), // cofounder | job | freelance
  skills: text("skills").notNull().default("[]"),    // JSON array
  location: text("location"),
  compensation: text("compensation"),
  stage: text("stage"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_opportunities_user").on(table.userId),
]);

// ── Applications ─────────────────────────────────────────────────────────────

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  opportunityId: text("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending | reviewing | accepted | rejected
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_app_opp_user").on(table.opportunityId, table.userId),
  index("idx_applications_user").on(table.userId),
  index("idx_applications_opp").on(table.opportunityId),
]);

// ── Conversations ────────────────────────────────────────────────────────────

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── Conversation Participants ────────────────────────────────────────────────

export const conversationParticipants = sqliteTable("conversation_participants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: text("joined_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_conv_participant").on(table.conversationId, table.userId),
  index("idx_conv_participants_user").on(table.userId),
]);

// ── Messages ─────────────────────────────────────────────────────────────────

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  readAt: text("read_at"),
}, (table) => [
  index("idx_messages_conv").on(table.conversationId),
]);

// ── Notifications ────────────────────────────────────────────────────────────
// Persistent notification records. The computed-from-data approach in the
// notifications route handles real-time unread counts; this table stores
// permanent records for the full notifications history page.

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // connection_request | connection_accepted | new_message | opportunity_match | application_update
  title: text("title").notNull(),
  body: text("body"),
  /** JSON: arbitrary context, e.g. { fromUserId, opportunityId, conversationId } */
  meta: text("meta").notNull().default("{}"),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_user_unread").on(table.userId, table.readAt),
]);

// ── Startup Profiles ─────────────────────────────────────────────────────────
// A user may have one active startup they are building. More than one is
// intentionally out of scope for MVP — kept as a 1-to-many FK so it can
// be relaxed later without a destructive migration.

export const startupProfiles = sqliteTable("startup_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  industry: text("industry"),
  stage: text("stage"),           // idea | mvp | early_traction | growth | scale
  teamSize: integer("team_size").notNull().default(1),
  fundingStatus: text("funding_status"),
  techStack: text("tech_stack").notNull().default("[]"), // JSON array
  tags: text("tags").notNull().default("[]"),            // JSON array
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_startup_profiles_owner").on(table.ownerId),
]);

// ── Startup Team Members ──────────────────────────────────────────────────────

export const startupTeamMembers = sqliteTable("startup_team_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  startupId: text("startup_id").notNull().references(() => startupProfiles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner | cofounder | member | advisor
  title: text("title"),
  joinedAt: text("joined_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_startup_member_pair").on(table.startupId, table.userId),
  index("idx_startup_members_startup").on(table.startupId),
  index("idx_startup_members_user").on(table.userId),
]);

// ── Activity Log ─────────────────────────────────────────────────────────────
// Lightweight append-only audit trail for user-triggered events.
// Used for the dashboard "recent activity" feed and future analytics.

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // profile_updated | connection_made | opportunity_posted | application_sent | intro_sent | message_sent
  /** JSON: action-specific context, e.g. { targetUserId, opportunityId } */
  context: text("context").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_activity_log_user").on(table.userId),
  index("idx_activity_log_user_time").on(table.userId, table.createdAt),
]);

// ── Match Preferences ────────────────────────────────────────────────────────

export const matchPreferences = sqliteTable("match_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** JSON array of role values the user is looking for */
  lookingForRoles: text("looking_for_roles").notNull().default("[]"),
  /** JSON array of skill tags */
  preferredSkills: text("preferred_skills").notNull().default("[]"),
  /** JSON array of industry tags */
  preferredIndustries: text("preferred_industries").notNull().default("[]"),
  preferredStage: text("preferred_stage"),
  preferredCommitment: text("preferred_commitment"),
  preferredLocation: text("preferred_location"),
  remoteOk: integer("remote_ok", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_match_prefs_user").on(table.userId),
]);

// ── Match Suggestions ────────────────────────────────────────────────────────

export const matchSuggestions = sqliteTable("match_suggestions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  /** JSON: dimension breakdown { skills, role, industry, stage, commitment, location, workStyle } */
  breakdown: text("breakdown").notNull().default("{}"),
  status: text("status").notNull().default("pending"), // pending | accepted | declined | skipped
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_match_pair").on(table.userId, table.targetUserId),
  index("idx_match_sugg_user").on(table.userId),
]);

// ── Mentor Availability ───────────────────────────────────────────────────────

export const mentorAvailability = sqliteTable("mentor_availability", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  bio: text("bio"),
  expertise: text("expertise").notNull().default("[]"), // JSON array
  industries: text("industries").notNull().default("[]"), // JSON array
  sessionTypes: text("session_types").notNull().default("[]"), // JSON: ["video","async","text"]
  hourlyRate: integer("hourly_rate"),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone"),
  maxMentees: integer("max_mentees").notNull().default(5),
  currentMentees: integer("current_mentees").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  rating: integer("rating").notNull().default(0), // 0-50 (×10 for decimals)
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_mentor_avail_user").on(table.userId),
]);

// ── Mentorship Requests ───────────────────────────────────────────────────────

export const mentorshipRequests = sqliteTable("mentorship_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  menteeId: text("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mentorId: text("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note"),
  goals: text("goals").notNull().default("[]"), // JSON array
  status: text("status").notNull().default("pending"), // pending | accepted | declined | completed
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_mentorship_mentee").on(table.menteeId),
  index("idx_mentorship_mentor").on(table.mentorId),
]);

// ── Communities ───────────────────────────────────────────────────────────────

export const communities = sqliteTable("communities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("General"),
  tags: text("tags").notNull().default("[]"), // JSON array
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  memberCount: integer("member_count").notNull().default(1),
  postCount: integer("post_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_communities_owner").on(table.ownerId),
  index("idx_communities_category").on(table.category),
]);

// ── Community Memberships ─────────────────────────────────────────────────────

export const communityMemberships = sqliteTable("community_memberships", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner | moderator | member
  joinedAt: text("joined_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_community_member_pair").on(table.communityId, table.userId),
  index("idx_community_memberships_user").on(table.userId),
]);

// ── Community Posts ───────────────────────────────────────────────────────────

export const communityPosts = sqliteTable("community_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  communityId: text("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  type: text("type").notNull().default("post"), // post | question | announcement
  commentCount: integer("comment_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_community_posts_community").on(table.communityId),
  index("idx_community_posts_author").on(table.authorId),
]);

// ── Community Post Comments ───────────────────────────────────────────────────

export const communityPostComments = sqliteTable("community_post_comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_community_comments_post").on(table.postId),
  index("idx_community_comments_author").on(table.authorId),
]);

// ── Organizations ─────────────────────────────────────────────────────────────

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  type: text("type").notNull().default("accelerator"), // accelerator | vc | incubator | corporate | community
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"), // free | pro | enterprise
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_orgs_slug").on(table.slug),
  index("idx_orgs_owner").on(table.ownerId),
]);

// ── Organization Memberships ──────────────────────────────────────────────────

export const organizationMemberships = sqliteTable("organization_memberships", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner | admin | member
  joinedAt: text("joined_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_org_member_pair").on(table.organizationId, table.userId),
  index("idx_org_memberships_user").on(table.userId),
]);

// ── Tenants ───────────────────────────────────────────────────────────────────
// Multi-tenant SaaS: an organization can be a tenant with custom branding + config.

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  /** URL-safe identifier used in /t/:slug routing */
  slug: text("slug").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  aboutText: text("about_text"),
  domain: text("domain"),
  /** Deprecated JSON blob — superseded by normalized branding tables below */
  customBranding: text("custom_branding").notNull().default("{}"),
  features: text("features").notNull().default("[]"), // JSON: enabled feature flags
  /** When true, apply tenant branding everywhere in the app */
  isBrandingActive: integer("is_branding_active", { mode: "boolean" }).notNull().default(false),
  publishedAt: text("published_at"),
  maxSeats: integer("max_seats").notNull().default(50),
  currentSeats: integer("current_seats").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenants_org").on(table.organizationId),
  uniqueIndex("idx_tenants_slug").on(table.slug),
]);

// ── Tenant Branding ───────────────────────────────────────────────────────────
// Visual identity: colors, typography, logos, hero image.

export const tenantBranding = sqliteTable("tenant_branding", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** Hex color, e.g. #0d9373 */
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  /** light | dark | auto */
  backgroundStyle: text("background_style").notNull().default("auto"),
  /** Uploaded asset URL */
  logoUrl: text("logo_url"),
  /** Square icon used as favicon / app icon */
  faviconUrl: text("favicon_url"),
  logoAltText: text("logo_alt_text"),
  /** Hero / banner image for landing and login pages */
  heroImageUrl: text("hero_image_url"),
  headingFont: text("heading_font"),
  bodyFont: text("body_font"),
  /** borderRadius multiplier: sharp | default | rounded */
  cornerStyle: text("corner_style").notNull().default("default"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_branding_tenant").on(table.tenantId),
]);

// ── Tenant Content Settings ───────────────────────────────────────────────────
// Copy, labels and text specific to this tenant's product experience.

export const tenantContentSettings = sqliteTable("tenant_content_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  heroCtaLabel: text("hero_cta_label"),
  heroCtaSecondaryLabel: text("hero_cta_secondary_label"),
  platformDescription: text("platform_description"),
  tagline: text("tagline"),
  onboardingIntroText: text("onboarding_intro_text"),
  onboardingStep1Text: text("onboarding_step1_text"),
  onboardingStep2Text: text("onboarding_step2_text"),
  dashboardWelcomeText: text("dashboard_welcome_text"),
  /** Custom label for "community" concept, e.g. "Cohort", "Program" */
  communityLabel: text("community_label"),
  /** Custom label for "member" concept */
  memberLabel: text("member_label"),
  /** Custom label for "mentor" concept, e.g. "Coach", "Advisor" */
  mentorLabel: text("mentor_label"),
  /** Custom label for "match" concept */
  matchLabel: text("match_label"),
  /** JSON: custom role labels map, e.g. {"founder": "Builder", "investor": "Partner"} */
  roleLabels: text("role_labels").notNull().default("{}"),
  /** Custom feature: "apply now" button label */
  applyCtaLabel: text("apply_cta_label"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_content_tenant").on(table.tenantId),
]);

// ── Tenant Legal Settings ─────────────────────────────────────────────────────
// Legal URLs and support contact information.

export const tenantLegalSettings = sqliteTable("tenant_legal_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  privacyPolicyUrl: text("privacy_policy_url"),
  termsOfServiceUrl: text("terms_of_service_url"),
  cookiePolicyUrl: text("cookie_policy_url"),
  supportEmail: text("support_email"),
  supportPhone: text("support_phone"),
  supportUrl: text("support_url"),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_legal_tenant").on(table.tenantId),
]);

// ── Tenant Email Settings ─────────────────────────────────────────────────────
// Email branding: from/reply-to fields and signature blocks.

export const tenantEmailSettings = sqliteTable("tenant_email_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  fromName: text("from_name"),
  fromEmail: text("from_email"),
  replyToEmail: text("reply_to_email"),
  emailHeaderLogoUrl: text("email_header_logo_url"),
  emailSignature: text("email_signature"),
  emailFooterBranding: text("email_footer_branding"),
  /** JSON: custom transactional email subject prefix, e.g. "[Accel Hub] " */
  subjectPrefix: text("subject_prefix"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_email_tenant").on(table.tenantId),
]);

// ── Tenant Social Links ───────────────────────────────────────────────────────
// Social and web presence links shown in landing pages and footers.

export const tenantSocialLinks = sqliteTable("tenant_social_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  websiteUrl: text("website_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  youtubeUrl: text("youtube_url"),
  githubUrl: text("github_url"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_social_tenant").on(table.tenantId),
]);

// ═══════════════════════════════════════════════════════════════════════════
// ── ENTERPRISE SSO LAYER ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

// ── Identity Providers ────────────────────────────────────────────────────
// Stores SAML / OIDC provider configuration per tenant.

export const identityProviders = sqliteTable("identity_providers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** oidc | saml | google_workspace | microsoft_entra | okta | ping | custom */
  providerType: text("provider_type").notNull().default("oidc"),
  /** Human-readable display name, e.g. "Athens University SSO" */
  providerName: text("provider_name").notNull(),
  /** OIDC: issuer URL  /  SAML: entityId */
  issuerUrl: text("issuer_url"),
  /** OIDC client_id */
  clientId: text("client_id"),
  /** OIDC client_secret — store encrypted in production */
  clientSecretEncrypted: text("client_secret_encrypted"),
  /** SAML: URL to IdP metadata XML */
  metadataUrl: text("metadata_url"),
  /** SAML: raw metadata XML (fallback if URL unreachable) */
  metadataXml: text("metadata_xml"),
  /** OIDC: explicit authorization_endpoint override */
  authorizationEndpoint: text("authorization_endpoint"),
  /** OIDC: explicit token_endpoint override */
  tokenEndpoint: text("token_endpoint"),
  /** OIDC: explicit userinfo_endpoint override */
  userinfoEndpoint: text("userinfo_endpoint"),
  /** JSON array of OIDC scopes, e.g. ["openid","email","profile","groups"] */
  scopes: text("scopes").notNull().default('["openid","email","profile"]'),
  /** Text shown on the SSO login button, e.g. "Sign in with Athens University" */
  loginButtonText: text("login_button_text"),
  /** Logo URL for the SSO login button */
  loginButtonLogoUrl: text("login_button_logo_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  /** JSON: provider-specific extra config (attribute mappings, claim overrides, etc.) */
  extraConfig: text("extra_config").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_identity_providers_tenant").on(table.tenantId),
]);

// ── Tenant SSO Config ─────────────────────────────────────────────────────
// SSO access mode, provisioning policy, and session rules per tenant.

export const tenantSsoConfigs = sqliteTable("tenant_sso_configs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** none | optional | required */
  ssoMode: text("sso_mode").notNull().default("none"),
  /** JSON array of email domains restricted to this tenant, e.g. ["uni.edu","corp.com"] */
  allowedDomains: text("allowed_domains").notNull().default("[]"),
  /** Auto-create platform user on first SSO login (JIT provisioning) */
  autoProvisionEnabled: integer("auto_provision_enabled", { mode: "boolean" }).notNull().default(true),
  /** Default platform role for JIT-provisioned users */
  defaultRole: text("default_role").notNull().default("founder"),
  /** Show SSO login button on /login for all users (not only domain-matched) */
  showSsoButtonPublicly: integer("show_sso_button_publicly", { mode: "boolean" }).notNull().default(false),
  /** URL to navigate to after successful SSO login — overrides default /dashboard */
  postLoginRedirectUrl: text("post_login_redirect_url"),
  /** URL for IdP-initiated logout */
  postLogoutRedirectUrl: text("post_logout_redirect_url"),
  /** Deactivate platform user when SSO session is revoked at IdP level */
  deactivateOnSsoRevoke: integer("deactivate_on_sso_revoke", { mode: "boolean" }).notNull().default(false),
  /** JSON: additional policy settings */
  policyConfig: text("policy_config").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_sso_config_tenant").on(table.tenantId),
]);

// ── Domain Mappings ───────────────────────────────────────────────────────
// Maps an email domain to a tenant + identity provider for SSO auto-discovery.

export const domainMappings = sqliteTable("domain_mappings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  /** Lowercase email domain, e.g. "uni.edu" */
  domain: text("domain").notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  identityProviderId: text("identity_provider_id").references(() => identityProviders.id, { onDelete: "set null" }),
  /** If true, users with this domain MUST use SSO; password login blocked */
  ssoRequired: integer("sso_required", { mode: "boolean" }).notNull().default(false),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  /** DNS TXT record token for domain ownership verification */
  verificationToken: text("verification_token").$defaultFn(() => `cfb-verify-${crypto.randomUUID()}`),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_domain_mappings_domain").on(table.domain),
  index("idx_domain_mappings_tenant").on(table.tenantId),
]);

// ── User Identities ───────────────────────────────────────────────────────
// Links a platform user account to one or more external IdP identities.

export const userIdentities = sqliteTable("user_identities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  identityProviderId: text("identity_provider_id").notNull().references(() => identityProviders.id, { onDelete: "cascade" }),
  /** External subject identifier from IdP (OIDC: sub claim, SAML: NameID) */
  externalSubject: text("external_subject").notNull(),
  /** Email as reported by the IdP */
  externalEmail: text("external_email"),
  /** Display name from IdP */
  externalName: text("external_name"),
  /** JSON: raw normalized claims from IdP for role-mapping and debugging */
  rawClaims: text("raw_claims").notNull().default("{}"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_user_identities_provider_subject").on(table.identityProviderId, table.externalSubject),
  index("idx_user_identities_user").on(table.userId),
]);

// ── Role Mapping Rules ────────────────────────────────────────────────────
// Maps an IdP claim value to a platform role for JIT provisioning.

export const roleMappingRules = sqliteTable("role_mapping_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identityProviderId: text("identity_provider_id").notNull().references(() => identityProviders.id, { onDelete: "cascade" }),
  /** JSON path or claim name from IdP token, e.g. "groups", "department", "role" */
  claimKey: text("claim_key").notNull(),
  /** Value to match against, e.g. "faculty", "engineering", "staff" */
  claimValue: text("claim_value").notNull(),
  /** Platform role to assign: founder | investor | mentor | member | admin */
  mappedRole: text("mapped_role").notNull().default("founder"),
  /** Lower number = evaluated first; first match wins */
  priority: integer("priority").notNull().default(100),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_role_mapping_provider").on(table.identityProviderId),
]);

// ── SSO Audit Logs ────────────────────────────────────────────────────────
// Immutable, append-only log of every SSO authentication event.

export const ssoAuditLogs = sqliteTable("sso_audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  identityProviderId: text("identity_provider_id").references(() => identityProviders.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  /**
   * Event types:
   * login_attempt | login_success | login_failure | jit_provision
   * link_identity | unlink_identity | sso_revoke | domain_verify
   * config_change | test_connection
   */
  eventType: text("event_type").notNull(),
  /** success | failure | pending */
  outcome: text("outcome").notNull(),
  email: text("email"),
  externalSubject: text("external_subject"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  /** JSON: additional event-specific metadata */
  metadata: text("metadata").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_sso_audit_tenant").on(table.tenantId),
  index("idx_sso_audit_user").on(table.userId),
  index("idx_sso_audit_type").on(table.eventType),
  index("idx_sso_audit_created").on(table.createdAt),
]);

// ── SSO State Tokens ──────────────────────────────────────────────────────
// Short-lived state tokens for OIDC PKCE and SAML RelayState flows.
// Replaces in-memory Map from oauth.ts for persistence across restarts.

export const ssoStateTokens = sqliteTable("sso_state_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  state: text("state").notNull().unique(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  identityProviderId: text("identity_provider_id").notNull().references(() => identityProviders.id, { onDelete: "cascade" }),
  /** PKCE code verifier for OIDC PKCE flow */
  codeVerifier: text("code_verifier"),
  /** Frontend URL to redirect to after auth completes */
  redirectTo: text("redirect_to").notNull().default("/dashboard"),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_sso_state_state").on(table.state),
  index("idx_sso_state_expires").on(table.expiresAt),
]);
