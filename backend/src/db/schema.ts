import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
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
  country: text("country"),
  availability: text("availability"),
  stage: text("stage"),
  commitment: text("commitment"),
  compensation: text("compensation"),
  lookingFor: text("looking_for"),
  skills: text("skills").notNull().default("[]"),       // JSON array
  interests: text("interests").notNull().default("[]"), // JSON array
  /** JSON array of roles: founder | cofounder | mentor | advisor | investor | operator */
  roles: text("roles").notNull().default('["founder"]'),
  /** JSON array of language codes, e.g. ["en", "el", "de"] */
  languages: text("languages").notNull().default('["en"]'),
  /** Years of professional experience */
  experienceYears: integer("experience_years"),
  /** Current job title / occupation */
  currentOccupation: text("current_occupation"),
  /** Education background (free text or JSON) */
  education: text("education"),
  /** Portfolio URL */
  portfolioUrl: text("portfolio_url"),
  linkedin: text("linkedin"),
  github: text("github"),
  website: text("website"),
  /** Profile visibility: public | connections | private */
  visibility: text("visibility").notNull().default("public"),
  /** Verification status: unverified | pending | verified */
  verificationStatus: text("verification_status").notNull().default("unverified"),
  /** 0-100 computed profile completion score */
  profileCompletionScore: integer("profile_completion_score").notNull().default(0),
  /** JSON: work style preferences { missionOrientation, riskTolerance, communicationStyle, decisionMakingStyle, speedVsStability, soloVsCollaborative } */
  workStyle: text("work_style").notNull().default("{}"),
  /** JSON: values and goals { primaryGoal, secondaryGoals, dealBreakers } */
  valuesAndGoals: text("values_and_goals").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ── Skills Taxonomy ──────────────────────────────────────────────────────────
// Master list of skills with categories for structured skill selection.

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  /** Category: technical | business | design | marketing | operations | leadership | domain */
  category: text("category").notNull().default("technical"),
  description: text("description"),
  /** Parent skill ID for hierarchical skills */
  parentId: text("parent_id"),
  /** Display order within category */
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_skills_slug").on(table.slug),
  index("idx_skills_category").on(table.category),
]);

// ── User Skills ──────────────────────────────────────────────────────────────
// Junction table linking users to skills with proficiency levels.

export const userSkills = sqliteTable("user_skills", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  /** Proficiency: beginner | intermediate | advanced | expert */
  proficiency: text("proficiency").notNull().default("intermediate"),
  /** Years of experience with this skill */
  yearsExperience: integer("years_experience"),
  /** Priority: primary | secondary | tertiary */
  priority: text("priority").notNull().default("secondary"),
  /** Is this skill actively being used / offered */
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_user_skills_pair").on(table.userId, table.skillId),
  index("idx_user_skills_user").on(table.userId),
]);

// ── Industries Taxonomy ──────────────────────────────────────────────────────
// Master list of industries for filtering and matching.

export const industries = sqliteTable("industries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  /** Parent industry ID for hierarchical industries */
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_industries_slug").on(table.slug),
]);

// ── User Industries ──────────────────────────────────────────────────────────
// Industries a user is interested in or has experience with.

export const userIndustries = sqliteTable("user_industries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  industryId: text("industry_id").notNull().references(() => industries.id, { onDelete: "cascade" }),
  /** interest | experience | both */
  relationshipType: text("relationship_type").notNull().default("interest"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_user_industries_pair").on(table.userId, table.industryId),
  index("idx_user_industries_user").on(table.userId),
]);

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

// ═══════════════════════════════════════════════════════════════════════════
// BILLING & SUBSCRIPTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// ── Billing Plans ─────────────────────────────────────────────────────────
// The product catalog: every plan the platform offers, including enterprise.

export const billingPlans = sqliteTable("billing_plans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  /** Internal slug, e.g. "free", "premium", "org_starter", "org_pro", "enterprise" */
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  /**
   * Plan tier: individual_free | individual_premium |
   *             org_starter | org_pro | enterprise | custom
   */
  tier: text("tier").notNull().default("individual_free"),
  /** monthly | annual | one_time | custom */
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  /** Price in smallest currency unit (e.g. cents). Null = contact sales. */
  priceMonthly: integer("price_monthly"),
  priceAnnual: integer("price_annual"),
  currency: text("currency").notNull().default("USD"),
  /** Max users / seats; null = unlimited */
  seatLimit: integer("seat_limit"),
  /** JSON: feature flags map, e.g. {"sso":true,"whiteLable":true,"advancedAnalytics":false} */
  featureFlags: text("feature_flags").notNull().default("{}"),
  /** JSON: limits map, e.g. {"matchesPerMonth":50,"exportRows":1000} */
  limits: text("limits").notNull().default("{}"),
  /** JSON: human-readable feature list for pricing page */
  marketingFeatures: text("marketing_features").notNull().default("[]"),
  /** JSON: overage policy config */
  overagePolicy: text("overage_policy").notNull().default("{}"),
  isSsoIncluded: integer("is_sso_included", { mode: "boolean" }).notNull().default(false),
  isWhiteLabelIncluded: integer("is_white_label_included", { mode: "boolean" }).notNull().default(false),
  isAdvancedAnalyticsIncluded: integer("is_advanced_analytics_included", { mode: "boolean" }).notNull().default(false),
  isMentorModuleIncluded: integer("is_mentor_module_included", { mode: "boolean" }).notNull().default(true),
  isCommunityModuleIncluded: integer("is_community_module_included", { mode: "boolean" }).notNull().default(true),
  isCohortModuleIncluded: integer("is_cohort_module_included", { mode: "boolean" }).notNull().default(false),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  trialDays: integer("trial_days").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_billing_plans_slug").on(table.slug),
  index("idx_billing_plans_tier").on(table.tier),
]);

// ── Customer Accounts ─────────────────────────────────────────────────────
// Billing identity for an individual user (B2C).

export const customerAccounts = sqliteTable("customer_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** individual | enterprise */
  customerType: text("customer_type").notNull().default("individual"),
  /** Stripe / payment provider customer ID */
  providerCustomerId: text("provider_customer_id"),
  billingEmail: text("billing_email"),
  billingName: text("billing_name"),
  billingAddressLine1: text("billing_address_line1"),
  billingAddressLine2: text("billing_address_line2"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingPostalCode: text("billing_postal_code"),
  billingCountry: text("billing_country"),
  taxId: text("tax_id"),
  vatNumber: text("vat_number"),
  legalEntityName: text("legal_entity_name"),
  currency: text("currency").notNull().default("USD"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_customer_accounts_user").on(table.userId),
  index("idx_customer_accounts_provider").on(table.providerCustomerId),
]);

// ── Tenant Billing Accounts ───────────────────────────────────────────────
// Billing identity for an organization / tenant (B2B).

export const tenantBillingAccounts = sqliteTable("tenant_billing_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /** Stripe / payment provider customer ID */
  providerCustomerId: text("provider_customer_id"),
  billingContactName: text("billing_contact_name"),
  billingContactEmail: text("billing_contact_email"),
  billingContactPhone: text("billing_contact_phone"),
  billingAddressLine1: text("billing_address_line1"),
  billingAddressLine2: text("billing_address_line2"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingPostalCode: text("billing_postal_code"),
  billingCountry: text("billing_country"),
  taxId: text("tax_id"),
  vatNumber: text("vat_number"),
  legalEntityName: text("legal_entity_name"),
  purchaseOrderNumber: text("purchase_order_number"),
  currency: text("currency").notNull().default("USD"),
  /** JSON: notes / contract details for enterprise accounts */
  contractDetails: text("contract_details").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_billing_tenant").on(table.tenantId),
]);

// ── Subscriptions ─────────────────────────────────────────────────────────
// One active subscription per customer or tenant.

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  planId: text("plan_id").notNull().references(() => billingPlans.id),
  /** Either set (B2C) or null */
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  /** Either set (B2B) or null */
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  /** individual | tenant | enterprise */
  customerType: text("customer_type").notNull().default("individual"),
  /**
   * Status: trialing | active | past_due | canceled | unpaid |
   *          paused | incomplete | incomplete_expired
   */
  status: text("status").notNull().default("active"),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  startDate: text("start_date").notNull().default(sql`(datetime('now'))`),
  currentPeriodStart: text("current_period_start").notNull().default(sql`(datetime('now'))`),
  currentPeriodEnd: text("current_period_end"),
  renewalDate: text("renewal_date"),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
  canceledAt: text("canceled_at"),
  cancelReason: text("cancel_reason"),
  trialStart: text("trial_start"),
  trialEnd: text("trial_end"),
  seatLimit: integer("seat_limit"),
  activeSeatCount: integer("active_seat_count").notNull().default(0),
  /** Payment provider subscription ID */
  providerSubscriptionId: text("provider_subscription_id"),
  /** JSON: feature flag overrides for this specific subscription (admin overrides) */
  featureFlagOverrides: text("feature_flag_overrides").notNull().default("{}"),
  /** JSON: limit overrides for this subscription */
  limitOverrides: text("limit_overrides").notNull().default("{}"),
  /** Grace period for failed payments (ISO date) */
  gracePeriodEnd: text("grace_period_end"),
  lastPaymentStatus: text("last_payment_status"),
  lastPaymentAt: text("last_payment_at"),
  failedPaymentCount: integer("failed_payment_count").notNull().default(0),
  /** Admin notes for enterprise / custom deals */
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_subscriptions_user").on(table.userId),
  index("idx_subscriptions_tenant").on(table.tenantId),
  index("idx_subscriptions_plan").on(table.planId),
  index("idx_subscriptions_status").on(table.status),
  index("idx_subscriptions_provider").on(table.providerSubscriptionId),
]);

// ── Subscription Items ────────────────────────────────────────────────────
// Line items within a subscription (base plan + add-ons).

export const subscriptionItems = sqliteTable("subscription_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  /** "plan" | "addon" | "seat_pack" | "usage" */
  itemType: text("item_type").notNull().default("plan"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitAmountCents: integer("unit_amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  providerItemId: text("provider_item_id"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_sub_items_subscription").on(table.subscriptionId),
]);

// ── Payment Methods ───────────────────────────────────────────────────────

export const paymentMethods = sqliteTable("payment_methods", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  /** "card" | "bank_transfer" | "sepa_debit" | "paypal" | "invoice" */
  methodType: text("method_type").notNull().default("card"),
  providerPaymentMethodId: text("provider_payment_method_id"),
  /** Last 4 digits for cards */
  last4: text("last4"),
  brand: text("brand"),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  billingName: text("billing_name"),
  billingEmail: text("billing_email"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_payment_methods_user").on(table.userId),
  index("idx_payment_methods_tenant").on(table.tenantId),
]);

// ── Invoices ──────────────────────────────────────────────────────────────

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  /** Human-readable invoice number, e.g. INV-2025-00042 */
  invoiceNumber: text("invoice_number").notNull(),
  /** draft | open | paid | void | uncollectible */
  status: text("status").notNull().default("draft"),
  currency: text("currency").notNull().default("USD"),
  /** Total before tax, cents */
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  /** Tax amount, cents */
  taxCents: integer("tax_cents").notNull().default(0),
  /** Discount applied, cents */
  discountCents: integer("discount_cents").notNull().default(0),
  /** Total due, cents */
  totalCents: integer("total_cents").notNull().default(0),
  /** Amount paid, cents */
  amountPaidCents: integer("amount_paid_cents").notNull().default(0),
  taxRate: text("tax_rate"),
  taxRegion: text("tax_region"),
  billingName: text("billing_name"),
  billingEmail: text("billing_email"),
  billingAddressLine1: text("billing_address_line1"),
  billingCity: text("billing_city"),
  billingCountry: text("billing_country"),
  vatNumber: text("vat_number"),
  legalEntityName: text("legal_entity_name"),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  dueDate: text("due_date"),
  paidAt: text("paid_at"),
  voidedAt: text("voided_at"),
  providerInvoiceId: text("provider_invoice_id"),
  providerHostedUrl: text("provider_hosted_url"),
  providerPdfUrl: text("provider_pdf_url"),
  /** JSON: raw provider invoice data for debugging */
  providerData: text("provider_data").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_invoices_number").on(table.invoiceNumber),
  index("idx_invoices_user").on(table.userId),
  index("idx_invoices_tenant").on(table.tenantId),
  index("idx_invoices_subscription").on(table.subscriptionId),
  index("idx_invoices_status").on(table.status),
  index("idx_invoices_created").on(table.createdAt),
]);

// ── Invoice Lines ─────────────────────────────────────────────────────────

export const invoiceLines = sqliteTable("invoice_lines", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitAmountCents: integer("unit_amount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  /** "subscription" | "addon" | "usage" | "credit" | "adjustment" */
  lineType: text("line_type").notNull().default("subscription"),
  providerLineId: text("provider_line_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_invoice_lines_invoice").on(table.invoiceId),
]);

// ── Billing Events ────────────────────────────────────────────────────────
// Immutable audit log of billing actions.

export const billingEvents = sqliteTable("billing_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  /**
   * Event types:
   * subscription_created | subscription_upgraded | subscription_downgraded
   * subscription_canceled | subscription_reactivated | trial_started | trial_ended
   * payment_succeeded | payment_failed | payment_refunded | invoice_created
   * seat_added | seat_removed | feature_override | admin_action | coupon_applied
   */
  eventType: text("event_type").notNull(),
  /** success | failure | pending */
  outcome: text("outcome").notNull().default("success"),
  /** Actor: user | admin | system | webhook */
  actor: text("actor").notNull().default("system"),
  actorId: text("actor_id"),
  /** JSON: before/after state snapshot for upgrades/downgrades */
  payload: text("payload").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_billing_events_subscription").on(table.subscriptionId),
  index("idx_billing_events_user").on(table.userId),
  index("idx_billing_events_tenant").on(table.tenantId),
  index("idx_billing_events_type").on(table.eventType),
  index("idx_billing_events_created").on(table.createdAt),
]);

// ── Seat Allocations ──────────────────────────────────────────────────────
// Individual seat assignments within an org subscription.

export const seatAllocations = sqliteTable("seat_allocations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  /** Email invitation for not-yet-registered users */
  inviteEmail: text("invite_email"),
  /** active | pending | revoked */
  status: text("status").notNull().default("active"),
  /** founder | investor | mentor | member | admin */
  role: text("role").notNull().default("member"),
  allocatedAt: text("allocated_at").notNull().default(sql`(datetime('now'))`),
  revokedAt: text("revoked_at"),
  allocatedBy: text("allocated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_seat_allocations_subscription").on(table.subscriptionId),
  index("idx_seat_allocations_tenant").on(table.tenantId),
  index("idx_seat_allocations_user").on(table.userId),
]);

// ── Usage Snapshots ───────────────────────────────────────────────────────
// Periodic snapshots of metered usage per subscription (ready for usage billing).

export const usageSnapshots = sqliteTable("usage_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  snapshotDate: text("snapshot_date").notNull(),
  /** JSON: usage counters, e.g. {"activeSeats":8,"matchRequests":120,"apiCalls":4500} */
  metrics: text("metrics").notNull().default("{}"),
  billingPeriodStart: text("billing_period_start"),
  billingPeriodEnd: text("billing_period_end"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_usage_snapshots_subscription").on(table.subscriptionId),
  index("idx_usage_snapshots_date").on(table.snapshotDate),
]);

// ── Discount Coupons / Promo Codes ────────────────────────────────────────

export const discountCoupons = sqliteTable("discount_coupons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  /** percentage | fixed_amount | trial_extension */
  discountType: text("discount_type").notNull().default("percentage"),
  /** For percentage: 0–100. For fixed_amount: cents. For trial_extension: days. */
  discountValue: integer("discount_value").notNull(),
  currency: text("currency"),
  /** null = all plans, or JSON array of plan slugs */
  applicablePlanSlugs: text("applicable_plan_slugs"),
  /** null = all customer types, or "individual" | "tenant" */
  applicableCustomerType: text("applicable_customer_type"),
  maxRedemptions: integer("max_redemptions"),
  redemptionCount: integer("redemption_count").notNull().default(0),
  /** Number of billing periods the discount applies (null = forever) */
  durationMonths: integer("duration_months"),
  validFrom: text("valid_from"),
  validUntil: text("valid_until"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  providerCouponId: text("provider_coupon_id"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_discount_coupons_code").on(table.code),
]);

// ── Trial Periods ─────────────────────────────────────────────────────────

export const trialPeriods = sqliteTable("trial_periods", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  trialPlanId: text("trial_plan_id").references(() => billingPlans.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  /** active | expired | converted | canceled */
  status: text("status").notNull().default("active"),
  convertedAt: text("converted_at"),
  extendedAt: text("extended_at"),
  extensionDays: integer("extension_days").notNull().default(0),
  extendedBy: text("extended_by").references(() => users.id, { onDelete: "set null" }),
  reminderSent7d: integer("reminder_sent_7d", { mode: "boolean" }).notNull().default(false),
  reminderSent1d: integer("reminder_sent_1d", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_trial_periods_subscription").on(table.subscriptionId),
  index("idx_trial_periods_end").on(table.endDate),
]);

// ── Add-Ons ───────────────────────────────────────────────────────────────
// Purchasable feature packs on top of a base plan.

export const addOns = sqliteTable("add_ons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  /** Internal slug, e.g. "extra_seats_5", "advanced_analytics", "white_label" */
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  /** one_time | monthly | annual */
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  priceMonthly: integer("price_monthly"),
  priceAnnual: integer("price_annual"),
  currency: text("currency").notNull().default("USD"),
  /** JSON: feature flags this add-on unlocks */
  featureFlags: text("feature_flags").notNull().default("{}"),
  /** JSON: limits this add-on adds/overrides */
  limits: text("limits").notNull().default("{}"),
  /** null = compatible with all plans, or JSON array of plan slugs */
  compatiblePlanSlugs: text("compatible_plan_slugs"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  providerProductId: text("provider_product_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_add_ons_slug").on(table.slug),
]);

// ═══════════════════════════════════════════════════════════════════════════
// TENANT DOMAIN MAPPING
// ═══════════════════════════════════════════════════════════════════════════

// ── Tenant Domains ────────────────────────────────────────────────────────
// Maps a hostname (subdomain or custom domain) to a tenant.
// One tenant can have multiple domains; exactly one should be isPrimary.

export const tenantDomains = sqliteTable("tenant_domains", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /**
   * Fully-qualified domain name, lower-cased.
   * Examples:
   *   athens.cofounderbay.com   (platform subdomain)
   *   founders.example.org      (custom domain)
   */
  domainName: text("domain_name").notNull(),
  /**
   * subdomain  — platform-managed *.cofounderbay.com subdomain
   * custom     — externally-owned domain pointed via CNAME/ALIAS
   */
  domainType: text("domain_type").notNull().default("custom"),
  /** True if this is the canonical/primary domain for the tenant */
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  /**
   * Verification state:
   *   pending     — newly added, not yet verified
   *   verified    — DNS verification token confirmed
   *   failed      — verification attempt failed
   */
  verificationStatus: text("verification_status").notNull().default("pending"),
  /** Random token the tenant must publish as a DNS TXT record */
  verificationToken: text("verification_token").notNull(),
  /** ISO timestamp of last verification attempt */
  lastVerifiedAt: text("last_verified_at"),
  /**
   * SSL / TLS status (future use — managed by infrastructure):
   *   none | provisioning | active | failed | expired
   */
  sslStatus: text("ssl_status").notNull().default("none"),
  /** True when domain is fully active and will serve tenant context */
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  /**
   * redirect_behavior:
   *   serve    — serve tenant landing on this domain (default)
   *   redirect — 301 to primary domain instead
   */
  redirectBehavior: text("redirect_behavior").notNull().default("serve"),
  /** Target URL for 'redirect' behavior (e.g. primary domain) */
  redirectTarget: text("redirect_target"),
  /** JSON: structured DNS instructions for CNAME/TXT records */
  dnsInstructions: text("dns_instructions").notNull().default("{}"),
  /** Admin notes */
  notes: text("notes"),
  /** Super-admin who approved / activated this domain */
  approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_domains_name").on(table.domainName),
  index("idx_tenant_domains_tenant").on(table.tenantId),
  index("idx_tenant_domains_active").on(table.isActive),
  index("idx_tenant_domains_type").on(table.domainType),
]);

// ── Domain Verifications ──────────────────────────────────────────────────
// Immutable audit log of every domain verification attempt.

export const domainVerifications = sqliteTable("domain_verifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  domainId: text("domain_id").notNull().references(() => tenantDomains.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /**
   * Method used:
   *   dns_txt   — TXT record lookup
   *   dns_cname — CNAME resolution check
   *   http_file — /.well-known/cofounderbay.txt HTTP probe
   *   manual    — super-admin manual approval
   */
  method: text("method").notNull().default("dns_txt"),
  /** success | failure | pending */
  outcome: text("outcome").notNull(),
  /** IP or hostname resolved during the check */
  resolvedValue: text("resolved_value"),
  /** Human-readable error message on failure */
  errorMessage: text("error_message"),
  /** Actor: system | admin */
  actor: text("actor").notNull().default("system"),
  actorId: text("actor_id"),
  /** JSON: raw DNS response or HTTP probe metadata */
  metadata: text("metadata").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_domain_verif_domain").on(table.domainId),
  index("idx_domain_verif_tenant").on(table.tenantId),
  index("idx_domain_verif_created").on(table.createdAt),
]);

// ── Domain Routing Rules ──────────────────────────────────────────────────
// Optional per-domain overrides: custom landing path, access gating, etc.

export const domainRoutingRules = sqliteTable("domain_routing_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  domainId: text("domain_id").notNull().references(() => tenantDomains.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  /**
   * landing_path   — custom frontend path to render on root visit (default: /t/:slug)
   * auth_mode      — open | invite_only | sso_required | disabled
   * feature_preset — preset feature-flag profile to apply for this domain
   */
  ruleType: text("rule_type").notNull(),
  ruleValue: text("rule_value").notNull(),
  /** JSON: additional rule-specific config */
  config: text("config").notNull().default("{}"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_domain_rules_domain").on(table.domainId),
  index("idx_domain_rules_tenant").on(table.tenantId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATION FRAMEWORK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * automation_rules — core workflow definitions.
 *
 * trigger_type  — see TriggerType enum in automationEngine.ts
 * entity_scope  — 'user' | 'tenant' | 'connection' | 'mentor' | 'community' |
 *                 'billing' | 'admin' | 'global'
 * condition_definition — JSON array of AutomationCondition objects
 * action_definition    — JSON array of AutomationAction objects
 * schedule_delay       — delay in minutes before executing the action (0 = immediate)
 * priority             — lower number = higher priority (1 = highest)
 */
export const automationRules = sqliteTable("automation_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  /** Nullable = global rule; set = tenant-specific */
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  triggerType: text("trigger_type").notNull(),
  entityScope: text("entity_scope").notNull().default("global"),
  /** JSON: AutomationCondition[] */
  conditionDefinition: text("condition_definition").notNull().default("[]"),
  /** JSON: AutomationAction[] */
  actionDefinition: text("action_definition").notNull().default("[]"),
  /** Minutes to wait before executing — 0 = immediate */
  scheduleDelay: integer("schedule_delay").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  /** 1 = highest priority */
  priority: integer("priority").notNull().default(50),
  failureCount: integer("failure_count").notNull().default(0),
  lastRunAt: text("last_run_at"),
  nextRunAt: text("next_run_at"),
  /** How many times to retry a failed action (0 = no retry) */
  maxRetries: integer("max_retries").notNull().default(2),
  /** Built-in system rule that cannot be deleted */
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_automation_rules_tenant").on(table.tenantId),
  index("idx_automation_rules_trigger").on(table.triggerType),
  index("idx_automation_rules_active").on(table.isActive),
]);

/**
 * automation_executions — one record per rule invocation.
 *
 * status: queued | running | completed | failed | skipped | cancelled
 */
export const automationExecutions = sqliteTable("automation_executions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ruleId: text("rule_id").notNull().references(() => automationRules.id, { onDelete: "cascade" }),
  /** The event that fired this execution */
  triggerEvent: text("trigger_event").notNull(),
  /** The primary entity affected (userId, tenantId, connectionId, …) */
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  status: text("status").notNull().default("queued"),
  retryCount: integer("retry_count").notNull().default(0),
  /** JSON snapshot of the trigger context */
  contextSnapshot: text("context_snapshot").notNull().default("{}"),
  errorMessage: text("error_message"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  scheduledFor: text("scheduled_for"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_auto_exec_rule").on(table.ruleId),
  index("idx_auto_exec_status").on(table.status),
  index("idx_auto_exec_entity").on(table.entityType, table.entityId),
  index("idx_auto_exec_scheduled").on(table.scheduledFor),
]);

/**
 * automation_logs — granular log lines per execution step.
 * level: info | warn | error | debug
 */
export const automationLogs = sqliteTable("automation_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  executionId: text("execution_id").notNull().references(() => automationExecutions.id, { onDelete: "cascade" }),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  /** JSON: arbitrary structured metadata */
  metadata: text("metadata").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_auto_logs_execution").on(table.executionId),
  index("idx_auto_logs_level").on(table.level),
]);

/**
 * notification_templates — reusable in-app notification templates.
 *
 * channel: in_app | email | push | admin_alert
 * variables_schema — JSON: string[] list of interpolation keys (e.g. ["userName","orgName"])
 */
export const notificationTemplates = sqliteTable("notification_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  channel: text("channel").notNull().default("in_app"),
  /** e.g. "You have a new match!" */
  subject: text("subject").notNull(),
  /** Handlebars-style: "Hi {{userName}}, you matched with {{matchName}}." */
  bodyTemplate: text("body_template").notNull(),
  /** JSON: string[] — declared interpolation variables */
  variablesSchema: text("variables_schema").notNull().default("[]"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_notif_tpl_slug").on(table.slug),
]);

/**
 * email_templates — transactional email content (HTML + text).
 */
export const emailTemplates = sqliteTable("email_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  subjectTemplate: text("subject_template").notNull(),
  htmlTemplate: text("html_template").notNull(),
  textTemplate: text("text_template").notNull(),
  /** JSON: string[] */
  variablesSchema: text("variables_schema").notNull().default("[]"),
  fromName: text("from_name"),
  fromEmail: text("from_email"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_email_tpl_slug").on(table.slug),
]);

/**
 * tenant_automation_config — per-tenant overrides for global automation behavior.
 *
 * notification_sensitivity: all | important_only | none
 * email_digest_frequency:   realtime | daily | weekly | none
 */
export const tenantAutomationConfig = sqliteTable("tenant_automation_config", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  isAutomationEnabled: integer("is_automation_enabled", { mode: "boolean" }).notNull().default(true),
  notificationSensitivity: text("notification_sensitivity").notNull().default("all"),
  emailDigestFrequency: text("email_digest_frequency").notNull().default("realtime"),
  /** JSON: TriggerType[] — specific trigger types this tenant has disabled */
  disabledTriggers: text("disabled_triggers").notNull().default("[]"),
  /** Max automations allowed to fire per user per day (anti-spam) */
  maxDailyPerUser: integer("max_daily_per_user").notNull().default(20),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_tenant_auto_cfg_tenant").on(table.tenantId),
]);

/**
 * notification_preferences — per-user channel preferences per automation category.
 *
 * category: matches | connections | mentorship | community | billing |
 *           admin_alerts | platform | digest
 */
export const notificationPreferences = sqliteTable("notification_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  inAppEnabled: integer("in_app_enabled", { mode: "boolean" }).notNull().default(true),
  emailEnabled: integer("email_enabled", { mode: "boolean" }).notNull().default(true),
  pushEnabled: integer("push_enabled", { mode: "boolean" }).notNull().default(false),
  /** realtime | daily | weekly | none — per-category email delivery mode */
  emailDigestFrequency: text("email_digest_frequency").notNull().default("realtime"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_notif_pref_user_cat").on(table.userId, table.category),
  index("idx_notif_pref_user").on(table.userId),
]);

export const matchModelVersions = sqliteTable("match_model_versions", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  version:     text("version").notNull().unique(),
  stage:       text("stage").notNull().default("stage1"),
  description: text("description"),
  weights:     text("weights").notNull().default("{}"),
  isActive:    integer("is_active",   { mode: "boolean" }).notNull().default(false),
  isFallback:  integer("is_fallback", { mode: "boolean" }).notNull().default(false),
  createdAt:   text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const matchScores = sqliteTable("match_scores", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceUserId:     text("source_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId:     text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelVersion:     text("model_version").notNull().default("v1"),
  matchType:        text("match_type").notNull().default("co-founder"),
  explicitScore:    real("explicit_score").notNull().default(0),
  semanticScore:    real("semantic_score").notNull().default(0),
  behavioralScore:  real("behavioral_score").notNull().default(0),
  outcomePriorScore:real("outcome_prior_score").notNull().default(0),
  finalScore:       real("final_score").notNull().default(0),
  confidenceScore:  real("confidence_score").notNull().default(0.5),
  sharedDimensions:        text("shared_dimensions").notNull().default("[]"),
  complementaryDimensions: text("complementary_dims").notNull().default("[]"),
  frictionDimensions:      text("friction_dims").notNull().default("[]"),
  recommendationReason:    text("recommendation_reason"),
  isNewUserBoost:          integer("is_new_user_boost",  { mode: "boolean" }).notNull().default(false),
  isExplorationMatch:      integer("is_exploration",     { mode: "boolean" }).notNull().default(false),
  computedAt: text("computed_at").notNull().default(sql`(datetime('now'))`),
  expiresAt:  text("expires_at"),
}, (table) => [
  uniqueIndex("idx_match_scores_pair_type").on(table.sourceUserId, table.targetUserId, table.matchType),
  index("idx_match_scores_source_score").on(table.sourceUserId, table.finalScore),
  index("idx_match_scores_target").on(table.targetUserId),
]);

export const matchFeedback = sqliteTable("match_feedback", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceUserId:   text("source_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId:   text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feedbackType:   text("feedback_type").notNull(),
  feedbackReason: text("feedback_reason"),
  modelVersion:   text("model_version"),
  createdAt:      text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_match_feedback_source").on(table.sourceUserId),
  index("idx_match_feedback_target").on(table.targetUserId),
  uniqueIndex("idx_match_feedback_pair").on(table.sourceUserId, table.targetUserId),
]);

export const userBehaviorSignals = sqliteTable("user_behavior_signals", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  signalType:   text("signal_type").notNull(),
  targetUserId: text("target_user_id").references(() => users.id, { onDelete: "set null" }),
  weight:       real("weight").notNull().default(1.0),
  metadata:     text("metadata").notNull().default("{}"),
  createdAt:    text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_behavior_signals_user_type").on(table.userId, table.signalType),
  index("idx_behavior_signals_target").on(table.targetUserId),
]);

export const matchOutcomes = sqliteTable("match_outcomes", {
  id:                     text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceUserId:           text("source_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId:           text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchScoreId:           text("match_score_id").references(() => matchScores.id, { onDelete: "set null" }),
  modelVersion:           text("model_version"),
  shownAt:                text("shown_at"),
  clickedAt:              text("clicked_at"),
  requestedAt:            text("requested_at"),
  acceptedAt:             text("accepted_at"),
  rejectedAt:             text("rejected_at"),
  conversationStartedAt:  text("conversation_started_at"),
  conversationSustainedAt:text("conversation_sustained_at"),
  engagementDepth:        integer("engagement_depth").notNull().default(0),
  qualityFlag:            text("quality_flag"),
  createdAt:              text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_match_outcomes_source").on(table.sourceUserId),
  index("idx_match_outcomes_pair").on(table.sourceUserId, table.targetUserId),
  index("idx_match_outcomes_model").on(table.modelVersion),
]);

export const matchExperiments = sqliteTable("match_experiments", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:         text("name").notNull(),
  description:  text("description"),
  strategyA:    text("strategy_a").notNull(),
  strategyB:    text("strategy_b").notNull(),
  trafficSplit: real("traffic_split").notNull().default(0.5),
  isActive:     integer("is_active", { mode: "boolean" }).notNull().default(false),
  startedAt:    text("started_at"),
  endedAt:      text("ended_at"),
  metrics:      text("metrics").notNull().default("{}"),
  createdAt:    text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const matchFeatureVectors = sqliteTable("match_feature_vectors", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceUserId: text("source_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelVersion: text("model_version").notNull().default("v1"),
  featureJson:  text("feature_json").notNull().default("{}"),
  createdAt:    text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_match_feature_pair").on(table.sourceUserId, table.targetUserId, table.modelVersion),
  index("idx_match_feature_source").on(table.sourceUserId),
]);

export const matchEmbeddings = sqliteTable("match_embeddings", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelVersion: text("model_version").notNull().default("embed-v1"),
  vectorJson:   text("vector_json").notNull().default("[]"),
  createdAt:    text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("idx_match_embed_user_model").on(table.userId, table.modelVersion),
]);

export const matchInferenceLogs = sqliteTable("match_inference_logs", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceUserId: text("source_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  modelVersion: text("model_version").notNull(),
  matchType:    text("match_type").notNull().default("co-founder"),
  scoreId:      text("score_id").references(() => matchScores.id, { onDelete: "set null" }),
  breakdownJson:text("breakdown_json").notNull().default("{}"),
  createdAt:    text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_match_infer_source").on(table.sourceUserId),
  index("idx_match_infer_model").on(table.modelVersion),
  index("idx_match_infer_created").on(table.createdAt),
]);

export const matchEvaluationMetrics = sqliteTable("match_evaluation_metrics", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  modelVersion: text("model_version").notNull(),
  windowStart:  text("window_start").notNull(),
  windowEnd:    text("window_end").notNull(),
  metricsJson:  text("metrics_json").notNull().default("{}"),
  createdAt:    text("created_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  index("idx_match_eval_model").on(table.modelVersion),
  index("idx_match_eval_window").on(table.windowStart, table.windowEnd),
]);
