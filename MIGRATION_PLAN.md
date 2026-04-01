# CoFounderBay → Cofound-Connect-Nexus: Comprehensive Migration Plan

## Executive Summary

Migrate **ALL** features from CoFounderBay (NestJS + Prisma + PostgreSQL + Docker) into cofound-connect-nexus using **superior, lighter, faster technologies** — without Prisma and without Docker — while preserving the **unique UI/UX identity** of cofound-connect-nexus (Vite SPA with animated page transitions, compact sidebar, Framer Motion).

---

## 1. TECHNOLOGY COMPARISON & DECISIONS

### 1.1 Current Stacks

| Layer | CoFounderBay | cofound-connect-nexus (current) | cofound-connect-nexus (target) |
|-------|-------------|-------------------------------|-------------------------------|
| **Frontend Framework** | Next.js 15 (SSR/SSG) | Vite + React 18 (SPA) | **Vite + React 18 (SPA)** ✅ Keep |
| **UI Library** | shadcn/ui + Tailwind | shadcn/ui + Tailwind | **shadcn/ui + Tailwind** ✅ Keep |
| **Animations** | Minimal | Framer Motion (page transitions) | **Framer Motion** ✅ Keep (unique) |
| **State/Data** | TanStack Query v5 | TanStack Query v5 | **TanStack Query v5** ✅ Keep |
| **Routing** | Next.js App Router | React Router v6 | **React Router v6** ✅ Keep |
| **Backend Framework** | NestJS (Express) | Fastify 5 | **Hono** 🔄 Upgrade (3x faster, edge-ready) |
| **ORM** | Prisma (heavy binary) | Prisma | **Drizzle ORM** 🔄 Replace (no binary, type-safe SQL) |
| **Database** | PostgreSQL (Docker) | SQLite (file) | **Turso (LibSQL)** 🔄 Upgrade (edge SQLite, no Docker) |
| **Auth** | Passport.js + JWT | bcrypt + JWT | **Better-Auth** 🔄 Upgrade (modern, built-in OAuth/2FA) |
| **Real-time** | Socket.io + Redis | None | **PartyKit / Hono WebSocket** 🆕 Add |
| **Search** | Meilisearch (Docker) | None | **Orama** 🆕 Add (in-process full-text, no Docker) |
| **Cache** | Redis (Docker) | None | **lru-cache + Unstorage** 🆕 Add (no Docker) |
| **Email** | Nodemailer + SMTP | None | **Resend** 🆕 Add (modern API, no SMTP config) |
| **Payments** | Stripe | None | **Stripe** 🆕 Add |
| **File Upload** | AWS S3 | None | **Uploadthing** 🆕 Add (no S3 config) |
| **Job Queue** | BullMQ + Redis | None | **Inngest** 🆕 Add (serverless, no Redis) |
| **AI** | Ollama + custom | None | **Vercel AI SDK** 🆕 Add (multi-provider) |
| **Monitoring** | Sentry + PostHog | None | **Sentry + PostHog** 🆕 Add |
| **Validation** | class-validator + Zod | Zod | **Zod** ✅ Keep |

### 1.2 Why These Choices Are Superior

- **Hono**: ~150k req/s vs NestJS ~25k req/s. Zero dependencies. Runs on Node, Bun, Deno, Cloudflare Workers, Vercel Edge.
- **Drizzle ORM**: No binary engine (Prisma downloads ~15MB platform-specific binary). SQL-like syntax. 2-5x faster queries. Migrations via `drizzle-kit`.
- **Turso (LibSQL)**: SQLite-compatible, embedded replicas for ultra-low latency (<1ms reads). No Docker/PostgreSQL needed. Free tier: 9GB storage, 500M reads/month.
- **Better-Auth**: Built-in OAuth (Google/GitHub/LinkedIn), 2FA (TOTP/SMS), sessions, rate limiting. Single library replaces Passport + 5 strategies.
- **Orama**: Full-text search engine that runs in-process (no external service). Supports faceted search, typo tolerance, vector search.
- **Resend**: REST API for email. No SMTP server config. React email templates.
- **Uploadthing**: Type-safe file uploads. No AWS credentials needed. Built for React.
- **Inngest**: Event-driven job queue. No Redis needed. Serverless-native. Automatic retries.

---

## 2. FULL FEATURE GAP ANALYSIS

### 2.1 Backend Services — CoFounderBay has 42 modules, cofound-connect-nexus has 6

| # | Module | CoFounderBay | cofound-connect-nexus | Gap | Priority |
|---|--------|-------------|----------------------|-----|----------|
| 1 | **Auth** | JWT + Google/LinkedIn OAuth + 2FA + CSRF + Email verification + Password reset | JWT + Password reset | OAuth, 2FA, Email verify, CSRF | P0 |
| 2 | **Profile** | Full profile + skills + role payload + visibility rules + portfolio + public profile | Basic profile (headline, bio, skills as JSON) | Skills as entities, visibility, portfolio, public URL | P0 |
| 3 | **Search** | Meilisearch full-text + faceted filters | None | Full-text search engine | P1 |
| 4 | **Messaging** | Socket.io real-time + attachments + read receipts + typing + validation + transcript | Basic REST messages | Real-time, attachments, read receipts, typing indicators | P0 |
| 5 | **Uploads** | S3 multipart + avatar/message/event/research kinds | None | File upload system | P1 |
| 6 | **Mailer** | Nodemailer + templates + digests | None | Email system | P1 |
| 7 | **Notifications** | 30+ types + in-app + email + push + channel preferences | None (hardcoded badge) | Full notification system | P1 |
| 8 | **Billing** | Stripe + plans + subscriptions + invoices + seats + promo codes | None | Full billing system | P2 |
| 9 | **Health** | API health + DB health + Redis health | Basic /health | Comprehensive health checks | P3 |
| 10 | **Events** | CRUD + RSVP + types + capacity + online/offline + featured | None | Full event system | P1 |
| 11 | **Mentoring** | Availability + Booking + Video/Chat/In-person + Payments | None (static mentor cards) | Full mentoring booking system | P1 |
| 12 | **Moderation** | Reports + Block/Unblock + Admin review + Resolution | None | Report/block system | P2 |
| 13 | **Dashboard** | Role-specific (founder/investor/mentor/incubator/provider) + VRS | Single generic dashboard | Multi-role dashboards | P0 |
| 14 | **Polls** | Create + Vote + Results + Expiry | None | Poll system | P3 |
| 15 | **Jobs** | Job postings + Remote filter + Featured | None | Job board | P2 |
| 16 | **Connections** | Smart matching + Accept/Decline/Block + Collaboration starter | Basic request/accept | Matching algorithm, block, collaboration | P0 |
| 17 | **Groups** | CRUD + Members + Roles + Posts + Comments + Reactions + Events + Privacy | Basic communities page | Full group system | P1 |
| 18 | **Analytics** | Profile views + User activity + Platform analytics | None | Analytics engine | P2 |
| 19 | **Security** | Rate limiting + CSRF + Helmet + CORS + Audit logs | Basic rate limit | Security hardening | P1 |
| 20 | **Monitoring** | Sentry + Performance interceptor | None | Error tracking | P2 |
| 21 | **Opportunities** | CRUD + Types + Applications + Status tracking | Basic CRUD + apply | Application status management | P0 |
| 22 | **Learning** | Resources + Types + Categories + Difficulty + Featured | Static learning page | Dynamic learning resources | P1 |
| 23 | **Marketplace** | Services + Categories + Pricing + Featured | None | Service marketplace | P2 |
| 24 | **Admin** | Users + Reports + Moderation + Gamification + Score Inspector + Abuse + Experiments | Basic admin page | Full admin dashboard | P1 |
| 25 | **Organization** | Org types + Members + Roles + Mentors + Programs + Branding | None | Organization system | P2 |
| 26 | **Matching** | AI feature vectors + Inference logs + Outcomes + Model versioning + A/B testing | Basic suggested (matchScore) | AI matching engine | P1 |
| 27 | **AI** | Chat + Streaming + Job queue + Rate limit + Provider abstraction + 10 agents | AI service (client-side only) | Full AI backend | P1 |
| 28 | **Tenant** | Multi-tenant + Branding + Domains + Feature flags + SSO | None | Multi-tenant system | P3 |
| 29 | **SSO** | SAML + OIDC + OAuth2 + Identity providers + JIT provisioning | None | Enterprise SSO | P3 |
| 30 | **Automation** | Rules + Triggers + Actions + Execution logs + Scheduling | None | Automation framework | P3 |
| 31 | **Milestones** | CRUD + Collaborator + Priority + Category + Progress | Basic milestone cards | Full milestone system | P1 |
| 32 | **Shortlist** | Save profiles + Notes | None | Profile shortlisting | P2 |
| 33 | **Endorsements** | Give/Receive + Skills + Relationship + Approval flow | None | Endorsement system | P2 |
| 34 | **Research Canvas** | FigJam-like + Nodes + Connectors + Comments + Snapshots + Version control + Branches + Merge | None | Research canvas | P2 |
| 35 | **Builder** | Workspace + 30+ document types + Sections + Versions + Collaboration + AI gen + Reviews + Readiness | None | Startup builder | P2 |
| 36 | **Roles** | Multi-role persona system (22 role types) + Scopes | Single role | Multi-role system | P1 |
| 37 | **Mentorship** | Relationships + Sessions + Requests + Status management | None | Mentorship relationships | P1 |
| 38 | **Digests** | Activity digest preferences + Email digests | None | Digest system | P3 |
| 39 | **Gamification** | XP + Badges + Streaks + Contribution scores + Team momentum + Readiness | None | Gamification engine | P2 |
| 40 | **Behavioral AI** | State classification + Next-action recommender + Nudge fatigue | None | Behavioral optimizer | P3 |
| 41 | **Feed** | Posts + Comments + Likes + Bookmarks | None | Social feed | P2 |
| 42 | **Fundraising** | Rounds + Pipeline leads + Data room + Investor watchlist | None | Fundraising tools | P2 |

### 2.2 Frontend Pages — CoFounderBay has 51+ pages, cofound-connect-nexus has 23

| # | Route | CoFounderBay | cofound-connect-nexus | Status |
|---|-------|-------------|----------------------|--------|
| 1 | `/` | LandingHome | LandingPage | ✅ Both have (different UI) |
| 2 | `/login` | Auth pages | LoginPage | ✅ Both have |
| 3 | `/signup` | Auth pages | SignupPage | ✅ Both have |
| 4 | `/onboarding` | Multi-step onboarding | OnboardingPage | ✅ Both have |
| 5 | `/dashboard` | Role-specific (5 variants) | DashboardPage (generic) | 🔶 Needs role variants |
| 6 | `/discover` | Advanced discover + ProfileCard | DiscoverPage | 🔶 Needs matching integration |
| 7 | `/messages` | Real-time + validation + transcript | MessagesPage | 🔶 Needs real-time |
| 8 | `/network` | — | NetworkPage | ✅ Nexus-unique |
| 9 | `/opportunities` | Full CRUD + applications | OpportunitiesPage | 🔶 Needs status management |
| 10 | `/profile` | Full profile + portfolio + public | ProfilePage | 🔶 Needs portfolio, public |
| 11 | `/learning` | Dynamic resources | LearningPage | 🔶 Needs API integration |
| 12 | `/settings` | Multi-tab + billing + SSO | SettingsPage | 🔶 Needs billing tab |
| 13 | `/mentors` | — | MentorsPage | ✅ Nexus-unique |
| 14 | `/communities` | Full groups system | CommunitiesPage | 🔶 Needs full CRUD |
| 15 | `/communities/:id` | Group detail | CommunityDetailPage | 🔶 Needs posts/members |
| 16 | `/milestones` | Full CRUD + progress | MilestonesPage | 🔶 Needs API |
| 17 | `/admin` | 11+ tabs | AdminDashboardPage | 🔶 Needs all tabs |
| 18 | `/demo` | Demo mode | DemoPage | ✅ Both have |
| 19 | `/forgot-password` | Password reset flow | ForgotPasswordPage | ✅ Both have |
| 20 | `/reset-password` | Token-based reset | ResetPasswordPage | ✅ Both have |
| 21 | `/privacy` | Privacy policy | PrivacyPage | ✅ Both have |
| 22 | `/terms` | Terms of service | TermsPage | ✅ Both have |
| 23 | `/connections` | Connections + Collaboration starter | — | 🔴 MISSING |
| 24 | `/endorsements` | Endorsement system | — | 🔴 MISSING |
| 25 | `/achievements` | Badges + XP + Reputation | — | 🔴 MISSING |
| 26 | `/events` | Event list + RSVP | — | 🔴 MISSING |
| 27 | `/events/[id]` | Event detail | — | 🔴 MISSING |
| 28 | `/calendar` | Calendar view | — | 🔴 MISSING |
| 29 | `/coaching` | Coaching sessions | — | 🔴 MISSING |
| 30 | `/builder` | Startup builder workspace | — | 🔴 MISSING |
| 31 | `/research` | Research canvas list | — | 🔴 MISSING |
| 32 | `/research/[boardId]` | FigJam-like canvas | — | 🔴 MISSING |
| 33 | `/feed` | Social feed | — | 🔴 MISSING |
| 34 | `/investor/*` | Investor dashboard + watchlist + pipeline | — | 🔴 MISSING |
| 35 | `/mentor/*` | Mentor dashboard + availability + sessions | — | 🔴 MISSING |
| 36 | `/provider/*` | Service provider dashboard | — | 🔴 MISSING |
| 37 | `/org/*` | Organization management (14 sub-pages) | — | 🔴 MISSING |
| 38 | `/tenant/*` | Multi-tenant management (12 sub-pages) | — | 🔴 MISSING |
| 39 | `/fundraising` | Fundraising rounds | — | 🔴 MISSING |
| 40 | `/data-room/[id]` | Investor data room | — | 🔴 MISSING |
| 41 | `/pitch/[id]` | Public pitch deck viewer | — | 🔴 MISSING |
| 42 | `/marketplace` | Service marketplace | — | 🔴 MISSING |
| 43 | `/jobs` | Job board | — | 🔴 MISSING |
| 44 | `/groups/*` | Group management | — | 🔴 MISSING |
| 45 | `/compare` | Profile comparison | — | 🔴 MISSING |
| 46 | `/saved-searches` | Saved search queries | — | 🔴 MISSING |
| 47 | `/pricing` | Pricing plans | — | 🔴 MISSING |
| 48 | `/notifications` | Notification center | — | 🔴 MISSING |
| 49 | `/readiness` | Startup readiness assessment | — | 🔴 MISSING |
| 50 | `/reputation` | Reputation/XP dashboard | — | 🔴 MISSING |
| 51 | `/shortlist` | Saved profiles | — | 🔴 MISSING |
| 52 | `/referrals` | Referral program | — | 🔴 MISSING |
| 53 | `/expert-reviews` | Expert review requests | — | 🔴 MISSING |
| 54 | `/recommendations` | AI recommendations | — | 🔴 MISSING |
| 55 | `/profiles/[userId]` | Public profile view | — | 🔴 MISSING |
| 56 | `/search` | Advanced search | — | 🔴 MISSING |

### 2.3 Data Models — CoFounderBay has 120+ models, cofound-connect-nexus has 10

**Models to add (grouped by domain):**

#### Core (Priority P0)
- Skill, ProfileSkill (normalized skills system)
- Enhanced Profile (avatarUrl, rolePayload, visibilityRules, portfolio)
- PublicProfile, ProfilePortfolioItem
- UserRoleFacet (multi-role system)

#### Social (P0-P1)
- Event, EventRsvp
- Group, GroupMember, GroupPost, GroupPostComment, GroupPostReaction, GroupEvent
- Endorsement, SkillEndorsement
- SavedProfile
- UserFollow
- FeedPost, FeedComment, FeedLike, FeedBookmark
- UserBlock, Report

#### Messaging Enhanced (P0)
- MessageAttachment, ConversationValidation
- Upload

#### Matching & Discovery (P1)
- MatchFeatureVector, MatchInferenceLog, MatchOutcome
- UserBehaviorSignal, MatchModelVersion
- MatchSuggestion, UserPreference, MatchProfile

#### Mentoring (P1)
- MentorProfile, MentorAvailability, MentorBooking
- MentorshipRelationship, MentorshipSession, MentorRequest
- MentorReview

#### Notifications (P1)
- Notification (30+ types)
- UserNotificationChannel
- NotificationTemplate

#### Builder/Workspace (P2)
- BuilderWorkspace, BuilderDocument, BuilderDocumentSection
- BuilderDocumentVersion, BuilderWorkspaceVersion
- BuilderCollaborator, BuilderComment, BuilderSectionComment
- BuilderReview, BuilderReadinessScore, BuilderAIGeneration
- BuilderExport, BuilderActivityLog, BuilderApplication

#### Research Canvas (P2)
- ResearchBoard, ResearchNode, ResearchConnector
- ResearchBoardCollaborator, ResearchComment, ResearchBoardSnapshot
- CanvasVersion, CanvasBranch, CanvasMerge

#### Investor/Fundraising (P2)
- InvestorProfile, InvestorWatchlistItem
- FundraisingRound, InvestorPipelineLead, DataRoomDocument, DataRoomAccessLog
- StartupSnapshot, VenturePortfolio
- ServiceProviderProfile

#### Organization (P2)
- Organization, OrganizationMembership, OrganizationMentor
- Program, ProgramParticipant
- Cohort, CohortMember

#### Billing (P2)
- BillingPlan, Subscription, SeatAllocation
- Invoice, InvoiceLine, BillingContact
- PromotionCode, PaymentRecord, UsageRecord

#### Gamification (P2)
- XPEvent, UserGamificationBadge, StreakRecord
- ContributionScore, TeamMomentumScore
- GamificationReadinessScore, MentorFeedbackMetric

#### Admin/Enterprise (P3)
- AdminAuditLog, AuditLog
- Tenant, TenantBranding, TenantSSOConfig, TenantMembership
- IdentityProvider, UserIdentity, SSOAuthEvent, DomainMapping, TenantDomain
- AutomationRule, AutomationExecution, AutomationLog, ScheduledJob
- Experiment, ExperimentAssignment, SystemConfig
- AbuseFlag, UserBehavioralState, NudgeLog, BehaviorPolicy
- TenantFeatureFlag, Webhook, ApiKey, Announcement

#### AI (P1)
- AIConversation, AIMessage, AIAssistantSession
- AIUserPreference, AIPromptTemplate, AIUsageLog

#### Misc (P2-P3)
- CalendarEvent, CoachingSession, ExpertReview
- ServiceOffer, ServiceInquiry
- JobPosting, Poll, PollOption, PollVote
- Invite, Referral
- UserActivity, ProfileView
- SupportTicket, TicketMessage
- SavedSearch, PlatformAnnouncement
- ActivityDigestPreference

---

## 3. IMPLEMENTATION PHASES

### PHASE 0: Backend Foundation Swap (Est: 1 session)
**Goal: Replace Prisma + Fastify + SQLite with Hono + Drizzle + Turso**

1. Install new dependencies:
   ```
   hono @hono/node-server drizzle-orm @libsql/client drizzle-kit
   better-auth @better-auth/core
   ```
2. Remove old dependencies: `fastify @fastify/cors @fastify/rate-limit @prisma/client prisma`
3. Create `backend/src/db/schema.ts` — Drizzle schema (start with existing 10 models)
4. Create `backend/src/db/index.ts` — Turso/LibSQL client
5. Create `backend/drizzle.config.ts` — migration config
6. Rewrite `backend/src/index.ts` — Hono app with middleware
7. Migrate 6 existing route files to Hono handlers
8. Run `drizzle-kit generate` + `drizzle-kit migrate`
9. Verify all existing frontend pages still work

### PHASE 1: Core Schema Expansion (Est: 2 sessions)
**Goal: Add all missing data models via Drizzle**

**Session 1A — Social & Profile models:**
- Enhanced User model (slug, moderationStatus, emailVerified, 2FA fields, OAuth IDs)
- Skill + ProfileSkill (normalized)
- Enhanced Profile (avatar, rolePayload, visibility, portfolio)
- PublicProfile
- UserRoleFacet
- Event + EventRsvp
- UserFollow, UserBlock, Report
- Notification + UserNotificationChannel

**Session 1B — Communication & Matching:**
- MessageAttachment, ConversationValidation, Upload
- MatchFeatureVector, MatchInferenceLog, MatchOutcome, UserBehaviorSignal
- MentorProfile, MentorAvailability, MentorBooking
- MentorshipRelationship, MentorshipSession, MentorRequest
- Group, GroupMember, GroupPost, GroupPostComment, GroupPostReaction, GroupEvent
- Endorsement, SkillEndorsement
- SavedProfile, FeedPost, FeedComment, FeedLike, FeedBookmark

### PHASE 2: Auth & Security Upgrade (Est: 1 session)
**Goal: Full auth system with OAuth, 2FA, email verification**

1. Integrate Better-Auth with Hono
2. Google OAuth + LinkedIn OAuth providers
3. TOTP 2FA (speakeasy-compatible)
4. Email verification flow (via Resend)
5. Password reset enhancement (token expiry, used tracking)
6. Session management (refresh tokens with device info)
7. CSRF protection middleware
8. Rate limiting per-route
9. Helmet-equivalent security headers

### PHASE 3: Backend Services — Core (Est: 3-4 sessions)

**Session 3A — Dashboard + Connections + Profile:**
- Role-specific dashboard endpoints (founder/investor/mentor/incubator/provider)
- Venture Readiness Score computation
- Enhanced connections: matching algorithm, block system, collaboration starter
- Profile: public profiles, portfolio items, visibility rules
- Skills CRUD with categories

**Session 3B — Events + Mentoring + Groups:**
- Events CRUD + RSVP + capacity management
- Mentor availability + booking system
- Mentorship relationships + sessions + requests
- Groups CRUD + members + roles + posts + comments + reactions

**Session 3C — Messaging Enhanced + Notifications:**
- WebSocket real-time messaging (Hono WebSocket or PartyKit)
- Message attachments + read receipts + typing indicators
- Conversation validation modes
- Notification system (30+ types, in-app + email via Resend)
- Notification channel preferences

**Session 3D — Search + AI + Matching:**
- Orama full-text search (profiles, opportunities, events, groups)
- AI chat backend (Vercel AI SDK, multi-provider)
- AI job queue (Inngest)
- Matching engine: feature vectors, scoring, A/B testing

### PHASE 4: Backend Services — Extended (Est: 3-4 sessions)

**Session 4A — Builder + Research:**
- Builder workspace CRUD + documents (30+ types) + sections
- Document versioning + collaboration
- Research canvas: boards + nodes + connectors + snapshots
- Canvas versioning + branches + merging

**Session 4B — Billing + Marketplace + Jobs:**
- Stripe integration: plans, subscriptions, invoices, seats
- Promo codes + billing contacts
- Marketplace services CRUD
- Job postings CRUD
- Learning resources CRUD

**Session 4C — Admin + Moderation + Analytics:**
- Admin dashboard: users, reports, moderation actions
- Gamification admin: score inspector, abuse detection, experiments
- Profile view analytics + user activity tracking
- Admin audit logs

**Session 4D — Organization + Fundraising + Feed:**
- Organization CRUD + membership + programs + cohorts
- Fundraising rounds + pipeline + data room
- Investor dashboard + watchlist
- Social feed: posts + comments + likes + bookmarks

### PHASE 5: Backend Services — Enterprise (Est: 2 sessions)

**Session 5A — Multi-tenant + SSO:**
- Tenant management + branding
- Domain mapping + subdomain routing
- Identity providers (SAML/OIDC/OAuth2)
- SSO config + user identity linking
- Feature flags per tenant

**Session 5B — Automation + Gamification + Behavioral AI:**
- Automation rules + triggers + execution engine
- Gamification: XP events, badges, streaks, contribution scores
- Behavioral optimizer: state classification, next-action recommender, nudge fatigue
- Digest preferences + email digest worker
- Scheduled jobs

### PHASE 6: Frontend Pages — Core (Est: 3-4 sessions)

**Session 6A — Dashboard Variants + Connections:**
- `/dashboard/founder` — VRS, onboarding checklist, next-action banner
- `/dashboard/investor` — Watchlist, pipeline, portfolio
- `/dashboard/mentor` — Availability, upcoming sessions, reviews
- `/connections` — Smart matching, collaboration starter
- `/profiles/[userId]` — Public profile view

**Session 6B — Events + Mentoring + Groups:**
- `/events` — Event list with type filters + RSVP
- `/events/[id]` — Event detail
- `/calendar` — Calendar view
- `/coaching` — Coaching session management
- `/groups/*` — Group management pages

**Session 6C — Communication + Social:**
- Enhanced `/messages` — Real-time + attachments + validation
- `/feed` — Social feed with posts/comments/likes
- `/notifications` — Notification center
- `/endorsements` — Endorsement system

**Session 6D — Discovery + Search:**
- Enhanced `/discover` — Matching integration + ProfileCard
- `/search` — Advanced search with Orama
- `/compare` — Profile comparison
- `/saved-searches` — Saved search queries
- `/shortlist` — Saved profiles

### PHASE 7: Frontend Pages — Extended (Est: 3-4 sessions)

**Session 7A — Builder + Research:**
- `/builder` — Startup builder workspace (unique Nexus UI)
- `/research` — Research canvas list
- `/research/[boardId]` — FigJam-like canvas (xyflow/react)

**Session 7B — Investor + Fundraising:**
- `/investor/*` — Investor dashboard, watchlist, pipeline
- `/fundraising` — Fundraising rounds
- `/data-room/[id]` — Data room document sharing
- `/pitch/[id]` — Public pitch deck viewer

**Session 7C — Admin + Settings:**
- Enhanced `/admin` — All 11+ tabs (users, reports, gamification, abuse, experiments, behavior AI)
- Enhanced `/settings` — Billing tab, SSO tab, notification preferences
- `/pricing` — Pricing plans page

**Session 7D — Remaining Pages:**
- `/marketplace` — Service marketplace
- `/jobs` — Job board
- `/achievements` — Badges + XP + Reputation
- `/reputation` — Reputation dashboard
- `/readiness` — Startup readiness assessment
- `/expert-reviews` — Expert review requests
- `/recommendations` — AI recommendations
- `/referrals` — Referral program
- `/org/*` — Organization management
- `/mentor/*` — Mentor management

### PHASE 8: Real-time + Performance + Polish (Est: 1-2 sessions)

1. WebSocket integration for messaging, notifications, canvas collaboration
2. Optimistic updates for all mutations
3. Request deduplication + cache invalidation strategy
4. Lazy loading for heavy components (canvas, charts, mermaid)
5. Bundle analysis + code splitting
6. Mobile responsiveness audit
7. Accessibility audit (keyboard nav, screen readers)
8. Error boundary improvements
9. Loading state skeletons for all pages

---

## 4. UI/UX DIFFERENTIATION STRATEGY

### cofound-connect-nexus KEEPS its unique identity:

| Feature | CoFounderBay | cofound-connect-nexus (UNIQUE) |
|---------|-------------|-------------------------------|
| **Navigation** | Collapsible sidebar (68px→240px) | Fixed compact sidebar (56 nav width) |
| **Page transitions** | None (SSR) | Framer Motion AnimatePresence |
| **Layout** | AppShell with dynamic side panels | AppLayout with sticky header |
| **Mobile** | Responsive sidebar | Bottom nav + hamburger menu |
| **Search** | Dropdown search panel | Full-screen GlobalSearch overlay |
| **Theme** | CSS variables + dark mode | next-themes ThemeProvider |
| **Chat** | Popup chat bubble + messaging context | ChatWidget floating component |
| **Cards** | Standard Card component | Cards with hover animations |
| **Tables** | DataTable with pagination | Inline lists with scroll |
| **Modals** | Sheet drawers (right side) | Dialog modals (centered) |
| **Toasts** | shadcn Toast | Sonner toasts |
| **Loading** | Skeleton components | SkeletonLoaders + PageTransition |
| **Brand** | "CoFounderBay" with Rocket icon | "CoFounderBay" with Rocket (customize later) |
| **Color palette** | Indigo primary | Keep/customize independently |

### New pages in cofound-connect-nexus will follow ITS OWN design language:
- Use `AppLayout` wrapper (not CoFounderBay's `AppShell`)
- Use Framer Motion page transitions
- Use compact card layouts (cofound-connect-nexus style)
- Use sonner toasts (not shadcn toast)
- Use centered Dialog modals (not Sheet drawers)
- Use the existing GlobalSearch pattern
- Follow the existing SkeletonLoaders pattern

---

## 5. FILE STRUCTURE (Target)

```
cofound-connect-nexus/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema/          # Drizzle schema files (grouped by domain)
│   │   │   │   ├── auth.ts
│   │   │   │   ├── profile.ts
│   │   │   │   ├── social.ts
│   │   │   │   ├── messaging.ts
│   │   │   │   ├── matching.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── mentoring.ts
│   │   │   │   ├── builder.ts
│   │   │   │   ├── research.ts
│   │   │   │   ├── billing.ts
│   │   │   │   ├── gamification.ts
│   │   │   │   ├── admin.ts
│   │   │   │   ├── tenant.ts
│   │   │   │   └── index.ts      # Re-exports all tables
│   │   │   ├── index.ts          # DB client (Turso/LibSQL)
│   │   │   └── migrate.ts        # Migration runner
│   │   ├── routes/               # Hono route handlers (grouped by domain)
│   │   │   ├── auth.ts
│   │   │   ├── profiles.ts
│   │   │   ├── connections.ts
│   │   │   ├── messages.ts
│   │   │   ├── opportunities.ts
│   │   │   ├── settings.ts
│   │   │   ├── events.ts
│   │   │   ├── mentoring.ts
│   │   │   ├── groups.ts
│   │   │   ├── notifications.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── matching.ts
│   │   │   ├── ai.ts
│   │   │   ├── search.ts
│   │   │   ├── builder.ts
│   │   │   ├── research.ts
│   │   │   ├── billing.ts
│   │   │   ├── admin.ts
│   │   │   ├── gamification.ts
│   │   │   ├── feed.ts
│   │   │   ├── uploads.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── rate-limit.ts
│   │   │   ├── cors.ts
│   │   │   └── security.ts
│   │   ├── services/             # Business logic layer
│   │   │   ├── matching.ts
│   │   │   ├── notifications.ts
│   │   │   ├── search.ts
│   │   │   ├── ai.ts
│   │   │   ├── email.ts
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── auth.ts           # Better-Auth config
│   │   │   ├── jwt.ts
│   │   │   ├── cache.ts          # LRU cache
│   │   │   └── validation.ts     # Zod schemas
│   │   └── index.ts              # Hono app entry
│   ├── drizzle/                  # Generated migrations
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
├── src/                          # Vite React frontend (existing + expanded)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui (existing)
│   │   ├── AppLayout.tsx         # Keep unique layout
│   │   ├── ChatWidget.tsx        # Keep unique chat
│   │   ├── GlobalSearch.tsx      # Keep unique search
│   │   ├── builder/              # NEW: Builder components
│   │   ├── research/             # NEW: Canvas components
│   │   ├── gamification/         # NEW: XP, badges, streaks
│   │   ├── admin/                # NEW: Admin panels
│   │   ├── feed/                 # NEW: Social feed
│   │   ├── notifications/        # NEW: Notification center
│   │   └── ...
│   ├── pages/                    # All pages (existing + 30+ new)
│   ├── hooks/                    # Custom hooks
│   ├── contexts/                 # React contexts
│   ├── lib/
│   │   ├── api.ts                # API client (expanded)
│   │   └── ...
│   └── ...
├── package.json
└── ...
```

---

## 6. MIGRATION METRICS

| Metric | Current cofound-connect-nexus | Target (after migration) |
|--------|------------------------------|--------------------------|
| Frontend pages | 23 | 56+ |
| Backend routes | 6 files, ~20 endpoints | 20+ files, ~200+ endpoints |
| Data models | 10 | 120+ |
| UI components | ~60 | ~150+ |
| Backend binary size | ~15MB (Prisma engine) | ~0MB (Drizzle, no binary) |
| Cold start time | ~2s (Prisma connect) | ~50ms (LibSQL embedded) |
| API response time (p50) | ~80ms | ~15ms (Hono + Drizzle) |
| Real-time support | None | WebSocket (messaging, canvas, notifications) |
| Search | None | Full-text (Orama, in-process) |
| AI integration | Client-side only | Full backend (multi-provider) |
| Auth methods | Email/password | Email + Google + LinkedIn + 2FA + SSO |
| File uploads | None | Type-safe (Uploadthing) |
| Payments | None | Stripe (plans, subscriptions, invoices) |
| Email | None | Transactional + Digest (Resend) |
| Job queue | None | Event-driven (Inngest) |
| Monitoring | None | Sentry + PostHog |

---

## 7. ESTIMATED TIMELINE

| Phase | Sessions | Description |
|-------|----------|-------------|
| Phase 0 | 1 | Backend foundation swap |
| Phase 1 | 2 | Schema expansion |
| Phase 2 | 1 | Auth upgrade |
| Phase 3 | 3-4 | Core backend services |
| Phase 4 | 3-4 | Extended backend services |
| Phase 5 | 2 | Enterprise features |
| Phase 6 | 3-4 | Core frontend pages |
| Phase 7 | 3-4 | Extended frontend pages |
| Phase 8 | 1-2 | Polish & performance |
| **Total** | **19-24 sessions** | **Full feature parity + superior tech** |

---

## 8. STARTING POINT — PHASE 0

We begin NOW with Phase 0: replacing the backend foundation.
