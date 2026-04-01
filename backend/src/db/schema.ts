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
