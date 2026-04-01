# MASTER MIGRATION PLAN: CoFounderBay → cofound-connect-nexus

**Version**: 1.0 | **Date**: 2026-04-01 | **Constraint**: No Prisma, No Docker

---

## SECTION A — Executive Interpretation

This is a **strategic functional inheritance project** — not a clone, not a port. Two products share a domain vision (startup ecosystem networking) but must remain distinct:

- **CoFounderBay**: NestJS+Prisma+PostgreSQL+Next.js monorepo, 120+ schema models, 48 API modules, 70+ pages, enterprise-grade (multi-tenant, SSO, Stripe, AI matching, gamification, research canvas)
- **cofound-connect-nexus**: Hono+Drizzle+SQLite+Vite SPA, 12 schema tables, 6 API routes, 23 pages, early-stage (basic CRUD, mock data fallbacks)

**The goal**: Transfer CoFounderBay's business logic maturity, data model depth, and feature completeness into cofound-connect-nexus — while preserving its identity as a faster, lighter, more focused product with its own aesthetic personality.

### Quantified Gap (Real Repo Audit)

| Dimension | CoFounderBay | cofound-connect-nexus | Gap |
|---|---|---|---|
| Schema models | ~120+ Prisma models (7,205 lines) | 12 Drizzle tables (169 lines) | **10x** |
| Backend modules | 48 NestJS modules | 6 Hono route files | **8x** |
| Frontend pages | 70+ Next.js pages | 23 Vite/React pages | **3x** |
| API endpoints | ~300+ | ~25 | **12x** |
| Backend deps | 40+ (Stripe, BullMQ, S3, Socket.io, etc.) | 6 (Hono, Drizzle, bcryptjs, JWT, zod) | **7x** |

---

## SECTION B — Methodology

### B.1 Completed Audits

**Source (CoFounderBay)** — Examined: `apps/api/prisma/schema.prisma` (7,205 lines, ~120 models), `apps/api/src/app.module.ts` (48 module imports), `apps/web/src/app/` (70+ route dirs), `apps/web/src/components/` (38+ dirs), `apps/api/package.json` (40+ deps), `apps/web/package.json` (25+ deps), `apps/web/src/app/layout.tsx` (12 provider wrappers).

**Target (cofound-connect-nexus)** — Examined: `backend/src/db/schema.ts` (169 lines, 12 tables), `backend/src/routes/` (6 files), `src/pages/` (23 files), `src/App.tsx` (23 eagerly-imported routes), `src/components/` (12 files + 49 ui), `src/stores/useMessaging.ts`, `src/lib/api.ts`, `backend/package.json`, `package.json`.

### B.2 Methodology Steps

1. Source project functional inventory → **DONE** (48 modules catalogued)
2. Target project functional inventory → **DONE** (6 modules + 17 frontend-only pages)
3. Gap mapping → **DONE** (42 modules missing, 6 partial)
4. Architecture comparison → **DONE** (every layer compared)
5. UI/UX identity inventory → **DONE** (visual/interaction differences documented)
6. Technology decision framework → Sections E & F
7. Feature transfer classification → Section D
8. Phased roadmap → Section H
9. Module transfer matrix → Section I
10. Risk analysis → Section J
11. Final architecture → Section K

---

## SECTION C — Full Comparative Audit

### C.1 Product/Functional Layer

| Feature | CFB | CCN | Gap Level |
|---|---|---|---|
| Email/password auth | ✅ Argon2+Passport | ✅ bcryptjs+JWT | Parity |
| OAuth (Google/LinkedIn) | ✅ | ❌ | **Critical** |
| 2FA/TOTP | ✅ speakeasy | ❌ | Important |
| Email verification | ✅ | ❌ | Important |
| Onboarding | ✅ DB-tracked progress | ✅ Local only | Partial |
| Profiles | ✅ Rich (skills model, rolePayload, portfolio, visibility) | ✅ Basic (JSON skills, headline, bio) | **Significant** |
| Multi-role personas | ✅ 23 role types | ❌ | Major |
| Messaging | ✅ WebSocket, attachments, validation modes, read receipts | ✅ Basic conversations | Significant |
| AI chat | ✅ 10 agents, Ollama, BullMQ, rate-limiting | ⚠️ Local frontend only | Major |
| Matching/Discovery | ✅ ML pipeline, 6 models, A/B experiments | ❌ Mock suggestions | **Critical** |
| Search | ✅ Meilisearch full-text | ❌ Frontend filter only | Critical |
| Notifications | ✅ 30+ types, email+in-app, templates | ❌ | Critical |
| Dashboard | ✅ 5 role-specific dashboards, VRS, gamification | ⚠️ Single mock dashboard | Significant |
| Admin | ✅ 18 pages (users, reports, billing, SSO, A/B) | ⚠️ Single mock page | Major |
| Groups/Communities | ✅ Full (privacy, posts, comments, reactions, events) | ⚠️ Mock frontend only | Significant |
| Events | ✅ CRUD, RSVP, types, capacity | ❌ No page | Major |
| Mentoring | ✅ Two systems (availability+booking AND relationships) | ⚠️ Mock page | Major |
| Milestones | ✅ Full CRUD with collaborators | ⚠️ Mock page | Significant |
| Opportunities | ✅ 6 types, tags, deadlines | ✅ 3 types, basic | Minor |
| Learning | ✅ Resources with types, difficulty | ⚠️ Mock page | Significant |
| Billing/Subscriptions | ✅ Stripe (plans, invoices, seats) | ❌ | Major (monetization) |
| File uploads | ✅ S3, multiple upload kinds | ❌ | Critical |
| Research Canvas | ✅ 9 models, FigJam-like, git versioning | ❌ | Unique to CFB |
| Startup Builder | ✅ 8+ models, AI generation, reviews | ❌ | Unique to CFB |
| Gamification | ✅ XP, badges, streaks, VRS | ❌ | Unique to CFB |
| Multi-tenant | ✅ Full white-label, SSO, domains | ❌ | Enterprise only |
| Automation | ✅ 20+ triggers, cron, execution logs | ❌ | Enterprise only |
| Feed | ✅ Posts, comments, likes, bookmarks | ❌ | Social feature |
| Fundraising | ✅ Rounds, data rooms, watchlists | ❌ | Unique to CFB |
| Video calls | ✅ Daily.co | ❌ | Major |

### C.2 Architecture Layer

| Aspect | CoFounderBay | cofound-connect-nexus |
|---|---|---|
| Backend | NestJS 10 (DI, decorators, modules) | Hono (functional, middleware) |
| Database | PostgreSQL | SQLite (better-sqlite3) |
| ORM | Prisma 6 | Drizzle ORM |
| Frontend | Next.js 15 (App Router, SSR, React 19) | Vite + React 18 (SPA, CSR) |
| Real-time | Socket.io | None |
| Jobs | BullMQ (Redis) | None |
| Email | Nodemailer | None |
| Files | S3 (@aws-sdk) | None |
| Search | Meilisearch | None |
| Billing | Stripe | None |
| Analytics | PostHog | None |
| Security | Helmet + CSRF + Throttler | CORS only |
| Logging | Pino (structured) | Hono basic logger |
| Project structure | pnpm monorepo + Turborepo | Standalone |

---

## SECTION D — Feature Transfer Logic

### Transfer Categories

**Category 1 — Transfer (adapt implementation):** OAuth, email verification, notifications, file uploads, groups/communities backend, events, milestones backend, learning backend, mentor profiles

**Category 2 — Redesign before transfer:** Matching/discovery (simplify to skill+interest scoring), dashboard (single adaptive vs 5 role-specific), admin (essential tabs only), AI chat (direct API vs BullMQ), real-time messaging (SSE/WS vs Socket.io)

**Category 3 — Partially adapt:** Endorsements (simplify), shortlist/bookmarks (simple table), polls (embed in groups), job postings (merge with opportunities), invites (simple flow), feed (lightweight activity)

**Category 4 — Discard:** Multi-tenant/white-label, SSO (SAML/OIDC), automation framework, canvas versioning, billing seat management, tenant domains, A/B experiment framework

**Category 5 — Postpone:** Research canvas (Phase 3+), startup builder (Phase 3+), gamification (Phase 3+), behavioral AI (Phase 4+), Stripe billing (Phase 3), video calls (Phase 3), fundraising/data rooms (Phase 4)

### Decision Criteria (per feature)

| Criterion | Weight | Description |
|---|---|---|
| Business Impact | 30% | Essential for viable product? |
| Implementation Effort | 25% | LOC, schema changes, new deps |
| UX Fit | 20% | Fits lighter/faster identity? |
| Technical Coupling | 15% | Enables other features? |
| Identity Conflict | 10% | Would make products too similar? |

---

## SECTION E — Backend Technology Decision

### E.1 Recommendation: **Keep Hono + Drizzle, migrate SQLite → PostgreSQL**

| Stack | Startup Perf | Request Perf | Maintain | Migration Cost | Auth Eco | Total |
|---|---|---|---|---|---|---|
| **Hono + Drizzle + PG** | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ (already Hono+Drizzle) | ★★★ | **33** |
| NestJS + Drizzle + PG | ★★★ | ★★★★ | ★★★★★ | ★★ (complete rewrite) | ★★★★★ | 28 |
| Express + Drizzle + PG | ★★★★ | ★★★★ | ★★★ | ★★★★ | ★★★★ | 29 |
| FastAPI + SQLAlchemy | ★★★★ | ★★★★★ | ★★★★ | ★ (language change) | ★★★★ | 25 |
| Go + Fiber + PG | ★★★★★ | ★★★★★ | ★★★ | ★ (language change) | ★★ | 22 |

**Why keep Hono (not NestJS like CoFounderBay):**
- Zero framework migration cost — already working with 6 routes, tsc clean
- Hono benchmarks 2-3x faster than Express, much faster than NestJS
- NestJS's DI/decorator pattern would make projects architecturally identical (violates differentiation goal)
- NestJS adds ~3x boilerplate per feature vs Hono's functional approach
- Hono starts in <100ms vs NestJS's 2-5s module initialization
- cofound-connect-nexus is small-team — NestJS value scales with team size

**Why PostgreSQL (not keep SQLite):**
- Concurrent write support (SQLite locks on writes)
- Full-text search via `tsvector`/`tsquery` (eliminates need for Meilisearch initially)
- JSON operators for complex queries
- Production-grade backup/replication
- Drizzle makes dialect switch straightforward: change `sqlite-core` → `pg-core`

### E.2 Specific Recommendations

| Concern | Tool | Why |
|---|---|---|
| ORM | **Drizzle** (keep) | Working, SQL-like, great TS inference |
| Database | **PostgreSQL** via `postgres` driver | Fastest pure-JS PG driver, no native bindings |
| Migrations | **drizzle-kit** (keep) | Already configured |
| Auth | **better-auth** or **lucia-auth v3** | Built-in OAuth, session management, 2FA, Hono adapter |
| File uploads | **Uploadthing** or direct S3 | Zero-config for Hono |
| Email | **Resend** | Clean API, free tier, TS-native |
| Background jobs | **Inngest** or **pg-boss** | No Redis needed (pg-boss uses PG) |
| Real-time | **Hono WebSocket** + **SSE** | Native adapters, no Socket.io |
| Search | **PG full-text** → **Orama** later | Start simple, scale when needed |
| Validation | **Zod** + **@hono/zod-validator** | Already using Zod |
| Rate limiting | **hono-rate-limiter** | Lightweight |
| Logging | **pino** | Production structured logging |
| Security | CORS + CSRF + security headers middleware | |
| Testing | **vitest** (extend to backend) | Already configured for frontend |

---

## SECTION F — Frontend Technology and Rendering Strategy

### Recommendation: **Keep React + Vite SPA**

| Strategy | Nav Speed | SEO | Complexity | UX Identity Fit | Total |
|---|---|---|---|---|---|
| **React + Vite SPA (keep)** | ★★★★★ | ★★ | ★★★★★ | ★★★★★ | **27** |
| Next.js App Router | ★★★★ | ★★★★★ | ★★★ | ★★ (too similar to CFB) | 22 |
| Remix | ★★★★ | ★★★★ | ★★★ | ★★★ | 22 |

**Why keep SPA (not adopt Next.js like CoFounderBay):**
- SPA with framer-motion transitions IS cofound-connect-nexus's identity — instant, animated, smooth
- SEO irrelevant for authenticated pages; landing page can be static HTML
- Architectural differentiation: CFB=SSR/hybrid, CCN=pure SPA
- Simpler deployment: static files on any CDN, no Node server for frontend
- No RSC complexity, no hydration issues

### Frontend-Specific Recommendations

| Concern | Tool |
|---|---|
| Routing | react-router-dom v6 (keep) |
| State (server) | TanStack Query (keep, add per-domain hooks) |
| State (client) | Zustand (replace singleton useMessaging) |
| Design system | shadcn/ui (keep, extend) |
| Code splitting | Add `React.lazy()` for all 23 page imports |
| Forms | react-hook-form + zod (keep) |
| Charts | recharts (keep) |
| Real-time | EventSource (SSE) for notifications, WebSocket for messaging |
| Animation | framer-motion (keep — core identity) |
| Testing | vitest + @testing-library/react |

---

## SECTION G — UI/UX Identity Preservation

### What Must Stay Unique

| Element | cofound-connect-nexus | Must NOT Copy from CFB |
|---|---|---|
| Page transitions | framer-motion AnimatePresence on every route | CFB has none |
| Card style | `bg-card-gradient`, `rounded-2xl` | CFB uses flat bordered cards |
| Spacing | Generous (p-5, p-6) | CFB is data-dense |
| Chat widget | Floating bottom-right overlay | CFB uses multi-tab popup system |
| Navigation | Single sidebar + mobile bottom nav | CFB has role-based layouts |
| Theme | Simple dark/light toggle | CFB has 5 role-based color schemes |
| Visual hierarchy | Hero-style headers, single-purpose sections | CFB has multi-panel dashboards |
| Motion | Pervasive animation, smooth transitions | CFB is mostly static |

### Intentional Differences

| Dimension | CoFounderBay | cofound-connect-nexus |
|---|---|---|
| Information density | High (power-user tool) | Low-medium (clean, focused) |
| Navigation depth | 4+ levels | 2 levels max |
| Onboarding tone | Professional, comprehensive | Friendly, minimal |
| Discovery feel | Marketplace/directory (filter-heavy) | Social/organic (progressive reveal) |
| Messaging feel | Slack-like (threads, validation) | iMessage-like (simple, markdown) |
| Empty states | Minimal/functional | Illustrated, encouraging |
| Mobile | Responsive adaptation | Mobile-first design |

### Anti-Patterns to Avoid

1. Do NOT add role-based dashboard splitting
2. Do NOT add enterprise navigation (nested sidebars, breadcrumbs)
3. Do NOT add data tables — use card grids
4. Do NOT clone CFB's 19KB globals.css
5. Do NOT add PostHog overlays

---

## SECTION H — Full Migration Roadmap in Phases

### Phase 0 — Discovery & Audit ✅ COMPLETE
**Output**: This document. Full audit of both repos performed.

### Phase 1 — Core Infrastructure Hardening (2-3 weeks)

| # | Task | Details | Risk |
|---|---|---|---|
| 1.1 | **SQLite → PostgreSQL** | Change `sqlite-core` → `pg-core` in `backend/src/db/schema.ts`; replace `better-sqlite3` with `postgres` driver; update column types (text dates → `timestamp`, integer booleans → `boolean`); run `drizzle-kit generate` + migrate | Column type mismatches |
| 1.2 | **Structured logging** | Add `pino` with JSON output to Hono middleware | Low |
| 1.3 | **Rate limiting** | `hono-rate-limiter` on auth + API routes | Low |
| 1.4 | **Security headers** | Helmet-equivalent Hono middleware | Low |
| 1.5 | **CORS config** | Environment-based allowed origins | Low |
| 1.6 | **Health check** | `/health` endpoint with DB connectivity test | Low |
| 1.7 | **Code splitting** | `React.lazy()` + `Suspense` for all 23 page imports in `src/App.tsx` | Low |
| 1.8 | **Error boundaries** | Per-page error boundaries | Low |

**Deps**: None | **DoD**: Backend on PostgreSQL, all existing routes pass, tsc clean

### Phase 2 — Auth Upgrade (1-2 weeks)

| # | Task | Details | Risk |
|---|---|---|---|
| 2.1 | **Auth library** | Integrate `better-auth` or `lucia-auth` — replace manual JWT in `backend/src/middleware/auth.ts` + `backend/src/routes/auth.ts` | Token migration |
| 2.2 | **OAuth providers** | Google + LinkedIn sign-in via auth library | Provider config |
| 2.3 | **Email verification** | Token generation on register, verification endpoint | Low |
| 2.4 | **Password strength** | Zod schema enhancement in `backend/src/routes/auth.ts` | Low |
| 2.5 | **Session management** | Proper token rotation, device tracking | Medium |
| 2.6 | **CSRF protection** | Double-submit cookie pattern | Low |

**Deps**: Phase 1 (PG) | **DoD**: OAuth login works, email verification complete, existing auth unbroken

### Phase 3 — Schema Expansion & Core Features (3-4 weeks)

| # | Task | Schema Tables | Frontend Pages Wired |
|---|---|---|---|
| 3.1 | **Normalized skills** | `skills` + `profile_skills` (from CFB Skill + ProfileSkill) | ProfilePage, OnboardingPage |
| 3.2 | **Events system** | `events` + `event_rsvps` + routes | New EventsPage |
| 3.3 | **Groups backend** | `groups` + `group_members` + `group_posts` + `group_post_comments` + routes | CommunitiesPage, CommunityDetailPage |
| 3.4 | **Milestones backend** | `milestones` + routes | MilestonesPage |
| 3.5 | **Learning backend** | `learning_resources` + routes | LearningPage |
| 3.6 | **Notifications** | `notifications` + routes + frontend bell | New NotificationBell component |
| 3.7 | **Mentor profiles** | `mentor_profiles` + `mentor_availability` + routes | MentorsPage |
| 3.8 | **Profile expansion** | Add `avatarUrl`, `timezone`, `languages`, `rolePayload` to profiles | ProfilePage |
| 3.9 | **Endorsements (lite)** | `endorsements` + routes | ProfilePage section |

**Deps**: Phases 1-2 | **DoD**: All mock-only pages wired to real APIs, ~25 Drizzle tables, tsc clean

### Phase 4 — Discovery & Matching (2-3 weeks)

| # | Task | Details |
|---|---|---|
| 4.1 | **PG full-text search** | `tsvector` columns on profiles, opportunities, groups |
| 4.2 | **Matching algorithm** | Skill overlap + interest similarity + location proximity scoring |
| 4.3 | **Wire DiscoverPage** | Real search API with filter chips |
| 4.4 | **Suggested connections** | Backend algorithm replacing mock `getSuggested()` |
| 4.5 | **Saved searches** | `saved_searches` table + routes |
| 4.6 | **Profile views** | `profile_views` table for analytics |

**Deps**: Phase 3 (enriched profiles) | **DoD**: DiscoverPage returns real results, suggestions algorithm-driven

### Phase 5 — Communication Upgrade (2-3 weeks)

| # | Task | Details |
|---|---|---|
| 5.1 | **Email service** | Resend or Nodemailer for transactional emails |
| 5.2 | **WebSocket messaging** | Hono WS adapter for real-time message delivery |
| 5.3 | **Zustand messaging store** | Replace singleton `useMessaging` with Zustand + WS subscription |
| 5.4 | **Message attachments** | `message_attachments` table + upload integration |
| 5.5 | **Email notifications** | Digest emails for unread messages, connection requests |
| 5.6 | **SSE notifications** | Real-time notification delivery without polling |

**Deps**: Phase 3 (notifications), Phase 1 (PG) | **DoD**: Real-time messages, email notifications working

### Phase 6 — File Uploads & Media (1-2 weeks)

| # | Task | Details |
|---|---|---|
| 6.1 | **Upload service** | Uploadthing or direct S3 with Hono middleware |
| 6.2 | **Avatar upload** | Profile page image upload flow |
| 6.3 | **Message attachments** | Image + file support in messaging |
| 6.4 | **Upload tracking** | `uploads` table |

**Deps**: Phase 5 | **DoD**: Avatars uploadable, files attachable

### Phase 7 — Dashboard & Admin (2-3 weeks)

| # | Task | Details |
|---|---|---|
| 7.1 | **Dashboard wiring** | Real API data: activity stats, recent connections, opportunities |
| 7.2 | **Admin backend** | User management, reports, system stats routes |
| 7.3 | **Wire AdminDashboardPage** | Real data in all admin tabs |
| 7.4 | **Activity tracking** | `user_activities` table |
| 7.5 | **Basic analytics** | Profile views, connection stats, platform metrics |
| 7.6 | **Moderation** | `reports` table + admin review flow |

**Deps**: Phase 3 | **DoD**: Dashboard real data, admin can manage users/reports

### Phase 8 — Advanced Features (3-4 weeks)

| # | Task | Details |
|---|---|---|
| 8.1 | **AI chat backend** | Connect ChatWidget to OpenAI/Anthropic via Hono route |
| 8.2 | **Invitations** | Email invite flow with `invites` table |
| 8.3 | **Activity feed** | Lightweight feed showing connections' actions |
| 8.4 | **Background jobs** | Inngest or pg-boss for email sending, match recalculation |
| 8.5 | **Bookmarks** | `saved_profiles` + `saved_opportunities` tables |

**Deps**: Phases 4-5 | **DoD**: AI chat responds with real AI, invites sendable

### Phase 9 — Performance & Quality (1-2 weeks)

| # | Task |
|---|---|
| 9.1 | API response caching (ETags, Cache-Control) |
| 9.2 | Database query optimization + missing indexes |
| 9.3 | Frontend bundle analysis, image lazy loading, virtual lists |
| 9.4 | Comprehensive error handling normalization |
| 9.5 | Per-page loading skeletons |
| 9.6 | PWA support (service worker, manifest, offline page) |

**DoD**: Lighthouse >90, API p95 <200ms

### Phase 10 — Testing & QA (2 weeks)

| # | Task |
|---|---|
| 10.1 | Backend API integration tests (vitest) for all routes |
| 10.2 | Frontend component tests for critical flows (auth, onboarding, messaging) |
| 10.3 | E2E smoke tests (Playwright) for happy paths |
| 10.4 | Load testing (k6) for API endpoints |
| 10.5 | Security audit (OWASP top 10 checklist) |
| 10.6 | Accessibility audit (axe-core) |

**DoD**: >80% route coverage, E2E passing, no critical security findings

### Timeline Summary

| Phase | Duration | Cumulative |
|---|---|---|
| Phase 1: Infrastructure | 2-3 weeks | 2-3 weeks |
| Phase 2: Auth upgrade | 1-2 weeks | 3-5 weeks |
| Phase 3: Schema + core features | 3-4 weeks | 6-9 weeks |
| Phase 4: Discovery + matching | 2-3 weeks | 8-12 weeks |
| Phase 5: Communication | 2-3 weeks | 10-15 weeks |
| Phase 6: File uploads | 1-2 weeks | 11-17 weeks |
| Phase 7: Dashboard + admin | 2-3 weeks | 13-20 weeks |
| Phase 8: Advanced features | 3-4 weeks | 16-24 weeks |
| Phase 9: Performance | 1-2 weeks | 17-26 weeks |
| Phase 10: Testing | 2 weeks | 19-28 weeks |
| **Total** | **~19-28 weeks** | **~5-7 months** |

---

## SECTION I — Module-by-Module Transfer Matrix

Each CoFounderBay module is mapped with: transfer decision, schema changes needed, backend work, frontend work, and the specific source/target files.

### Tier 1 — Core (Phases 1-3)

| CFB Module | Decision | New Drizzle Tables | New Hono Routes | Frontend Changes | Source Reference (CFB) |
|---|---|---|---|---|---|
| **Auth (OAuth)** | Transfer | Modify `users` (add googleId, linkedinId, emailVerified, twoFactorEnabled) | Extend `routes/auth.ts` (+OAuth callback, +verify email, +2FA setup) | Add OAuth buttons to LoginPage.tsx + SignupPage.tsx | `apps/api/src/auth/` |
| **Skills (normalized)** | Transfer | `skills` + `profile_skills` (join table with level) | New `routes/skills.ts` (CRUD, search, autocomplete) | Refactor ProfilePage.tsx skill section from JSON array to typeahead | `schema.prisma` lines 660-678 |
| **Events** | Transfer | `events` + `event_rsvps` | New `routes/events.ts` (CRUD, RSVP, list by type/date) | New `EventsPage.tsx` + add to App.tsx routes + sidebar nav | `apps/api/src/events/`, schema lines 801-838 |
| **Groups/Communities** | Transfer | `groups` + `group_members` + `group_posts` + `group_post_comments` + `group_post_reactions` | New `routes/groups.ts` (CRUD, join/leave, posts, comments) | Wire CommunitiesPage.tsx + CommunityDetailPage.tsx | `apps/api/src/groups/`, schema lines 990-1098 |
| **Milestones** | Transfer | `milestones` | New `routes/milestones.ts` (CRUD, status update, progress) | Wire MilestonesPage.tsx | `apps/api/src/milestones/`, schema lines 2270-2300 |
| **Learning** | Transfer | `learning_resources` | New `routes/learning.ts` (CRUD, filter by type/category) | Wire LearningPage.tsx | Schema lines 1217-1240 |
| **Notifications** | Transfer | `notifications` | New `routes/notifications.ts` (list, mark read, mark all read) | New NotificationBell component + NotificationsPage | `apps/api/src/notifications/`, schema lines 877-891 |
| **Mentoring** | Transfer | `mentor_profiles` + `mentor_availability` + `mentor_bookings` | New `routes/mentoring.ts` (availability, booking, list mentors) | Wire MentorsPage.tsx | `apps/api/src/mentoring/`, schema lines 840-875 |
| **Profile expansion** | Adapt | Modify `profiles` (add avatarUrl, timezone, languages JSON, rolePayload JSON, visibilityRules JSON) | Modify `routes/profiles.ts` (handle new fields) | Extend ProfilePage.tsx sections | Schema lines 627-658 |

### Tier 2 — Growth (Phases 4-6)

| CFB Module | Decision | New Drizzle Tables | Backend Work | Frontend Work |
|---|---|---|---|---|
| **Discovery/Search** | Redesign | `profile_views` + add tsvector columns | New `routes/search.ts` (PG full-text), modify `routes/profiles.ts` | Wire DiscoverPage.tsx to real search API |
| **Matching** | Redesign (simplify) | `match_scores` (simpler than CFB's 6 models) | New `routes/matching.ts` (cosine similarity on skills+interests) | Suggested connections in NetworkPage.tsx |
| **Saved searches** | Transfer | `saved_searches` | Add to `routes/search.ts` | Add save/load UI to DiscoverPage.tsx |
| **Email service** | Transfer (new) | None (config only) | Resend integration in backend lib | Verification flow in auth pages |
| **WebSocket messaging** | Redesign | `message_attachments` | WS upgrade handler in Hono | Zustand store with WS subscription |
| **File uploads** | Transfer (new) | `uploads` | Uploadthing or S3 middleware | Avatar upload in ProfilePage, attachments in MessagesPage |

### Tier 3 — Enhancement (Phases 7-8)

| CFB Module | Decision | New Tables | Backend | Frontend |
|---|---|---|---|---|
| **Dashboard data** | Redesign | `user_activities` | New `routes/dashboard.ts` (stats aggregation) | Wire DashboardPage.tsx real data |
| **Admin** | Redesign (simplify) | `reports` + `admin_audit_logs` | New `routes/admin.ts` (users, reports, stats) | Wire AdminDashboardPage.tsx |
| **AI chat backend** | Redesign | `ai_conversations` + `ai_messages` | New `routes/ai.ts` (proxy to OpenAI/Anthropic) | Connect ChatWidget to backend |
| **Endorsements** | Partially adapt | `endorsements` | Add to `routes/profiles.ts` | Endorsement section in ProfilePage |
| **Invitations** | Partially adapt | `invites` | New `routes/invites.ts` | Invite button in NetworkPage |
| **Activity feed** | Partially adapt | `feed_items` (materialized from activities) | New `routes/feed.ts` | New FeedPage.tsx or DashboardPage section |
| **Bookmarks** | Partially adapt | `saved_profiles` + `saved_opportunities` | Add bookmark endpoints to existing routes | Bookmark icons on cards |
| **Polls** | Partially adapt | `polls` + `poll_options` + `poll_votes` | Embed in groups routes | Poll component in CommunityDetailPage |

### Tier 4 — Discarded (No Transfer)

| CFB Module | Reason | Identity Conflict? |
|---|---|---|
| Multi-tenant/White-label | B2B enterprise feature, not relevant to CCN's B2C focus | Yes — would create architectural identity convergence |
| SSO (SAML/OIDC) | Enterprise auth, CCN targets individual founders | Yes |
| Tenant branding | White-label infrastructure | Yes |
| Tenant domains | Subdomain/custom domain routing | Yes |
| Automation framework | 20+ trigger types, cron — overkill for CCN stage | No, but premature complexity |
| Canvas versioning (git branches/merges) | Tightly coupled to Research Canvas (unique CFB feature) | Yes — signature CFB feature |
| Billing seat management | Multi-seat enterprise billing | N/A (no billing yet) |
| A/B matching experiments | Premature optimization — needs usage data | No |
| Behavioral AI optimizer | Needs engagement data that doesn't exist | No |

### Tier 5 — Postponed (Phase 3+ of future roadmap)

| CFB Module | When | Prerequisite |
|---|---|---|
| Research Canvas | After Phase 10 (needs @xyflow/react, complex schema) | Stable core platform |
| Startup Builder | After Research Canvas (shares patterns) | Research Canvas patterns |
| Gamification (XP/badges/streaks) | After 1000+ active users | Engagement metrics |
| Stripe billing | When monetization planned | Product-market fit |
| Video calls (Daily.co) | When real-time mentoring needed | Mentoring system mature |
| Fundraising/Data rooms | When investor features requested | Investor role support |
| Service marketplace | When provider features requested | Provider role support |
| Coaching sessions | After mentoring system mature | Mentoring Phase 3 |

---

## SECTION J — Risks, Failure Modes, and Anti-Patterns

### J.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **SQLite → PG migration breaks queries** | Medium | High | Run all existing integration tests after migration; Drizzle's type system catches most issues at compile time |
| **Auth library doesn't integrate cleanly with Hono** | Low | High | `better-auth` has official Hono adapter; fall back to `lucia-auth` or manual OAuth implementation |
| **Schema sprawl** | Medium | Medium | Follow a strict "add table only when frontend page needs it" rule. No speculative schema additions. |
| **WebSocket complexity** | Medium | Medium | Start with SSE for notifications (simpler), only add WS for messaging. Use Hono's built-in WS helper. |
| **PostgreSQL cold-start** | Low | Low | Use connection pooling (`postgres` driver handles this). For serverless: use Neon or Supabase pooler. |
| **Bundle size growth** | Medium | Low | Code splitting (React.lazy) + monitor with `vite-bundle-visualizer` |
| **AI API costs** | Medium | Medium | Add per-user rate limits, default to cheaper models, cache common responses |
| **Mock data removal breaks pages** | Medium | High | Keep mock fallback pattern during all phases. Only remove mocks after real API is verified per-page. |

### J.2 Architectural Anti-Patterns

| Anti-Pattern | How to Avoid |
|---|---|
| **Feature creep** | Strict phase gates. Each phase has DoD. Do not start Phase N+1 before Phase N is signed off. |
| **Schema before product** | Never add a Drizzle table that doesn't have a frontend page consuming it within the same phase. |
| **Premature abstraction** | No service layers, no repositories, no generic CRUD factories. Write specific route handlers. Refactor later. |
| **Over-engineering matching** | Start with simple scoring (skill overlap %). Add ML only after 1000+ users. CoFounderBay's 6-model matching system took years to build. |
| **Copying CoFounderBay's DI patterns** | Hono doesn't need NestJS-style dependency injection. Use simple function imports. Keep it flat. |
| **Adding unused infrastructure** | No Redis until you need real-time at scale. No Meilisearch until PG full-text is insufficient. No BullMQ until pg-boss can't keep up. |
| **Identity convergence** | Before each feature: ask "would a user confuse this with CoFounderBay?" If yes, redesign the UX. |
| **Ignoring mobile** | cofound-connect-nexus's mobile-first identity requires testing every feature on mobile viewport first. |

### J.3 Process Risks

| Risk | Mitigation |
|---|---|
| **Losing CCN's "feel" during migration** | Create a UI/UX checklist per phase: page transitions work? Card gradients intact? Spacing generous? Motion smooth? |
| **Breaking existing wired pages** | Never modify working code without running `tsc --noEmit` on both frontend and backend after changes |
| **Scope creep from "just one more CFB feature"** | Stick to the phase plan. New features go to Phase 8 or later unless critical. |
| **Diverging from plan** | Update this document when decisions change. This is the single source of truth. |

### J.4 Data Migration Risks

| Risk | Impact | Mitigation |
|---|---|---|
| SQLite data loss during PG migration | High | Export SQLite data to JSON before migration, re-import via seed script |
| Schema incompatibility (SQLite text dates → PG timestamps) | Medium | Write a dedicated migration script that transforms data types |
| Foreign key constraint violations during schema expansion | Medium | Add new tables in dependency order; use `drizzle-kit push` in dev, `drizzle-kit generate` + migrate for production |

---

## SECTION K — Recommended Final Architecture for cofound-connect-nexus

### K.1 Target Architecture Diagram (Post-Phase 10)

```
┌─────────────────────────────────────────────────────────┐
│                    CDN (Static Files)                     │
│              Vite build output → S3/Netlify/Vercel       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                 React SPA (Client)                        │
│  React 18 + Vite + React Router v6 + TanStack Query     │
│  shadcn/ui + Tailwind + framer-motion                    │
│  Zustand (client state) + EventSource (SSE)              │
│  WebSocket (messaging only)                               │
└────────────────────────┬────────────────────────────────┘
                         │ REST API + WS + SSE
┌────────────────────────▼────────────────────────────────┐
│              Hono Backend (Node.js)                       │
│  Hono + @hono/node-server + @hono/zod-validator          │
│  better-auth (OAuth, sessions, 2FA)                       │
│  Drizzle ORM + postgres driver                            │
│  Pino logging + rate limiting + security headers          │
│  Resend (email) + Uploadthing (files)                     │
│  pg-boss or Inngest (background jobs)                     │
└────────────────────────┬────────────────────────────────┘
                         │ SQL
┌────────────────────────▼────────────────────────────────┐
│                   PostgreSQL                              │
│  ~40-50 tables (from current 12)                         │
│  Full-text search via tsvector                            │
│  JSON columns for flexible data                           │
│  Connection pooling                                       │
└─────────────────────────────────────────────────────────┘
```

### K.2 File Structure (Post-Migration)

```
cofound-connect-nexus/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts          # ~40-50 Drizzle tables (from 12)
│   │   │   ├── index.ts           # PG connection + Drizzle client
│   │   │   └── migrate.ts         # Migration runner
│   │   ├── middleware/
│   │   │   ├── auth.ts            # better-auth middleware
│   │   │   ├── rateLimit.ts       # Rate limiting
│   │   │   └── security.ts        # Headers, CSRF
│   │   ├── routes/
│   │   │   ├── auth.ts            # Auth + OAuth callbacks
│   │   │   ├── profiles.ts        # Profile CRUD + endorsements
│   │   │   ├── settings.ts        # User settings
│   │   │   ├── connections.ts     # Connection requests + matching
│   │   │   ├── opportunities.ts   # Opportunities + applications
│   │   │   ├── messages.ts        # Conversations + messages + WS
│   │   │   ├── groups.ts          # Groups + posts + comments (NEW)
│   │   │   ├── events.ts          # Events + RSVPs (NEW)
│   │   │   ├── milestones.ts      # Milestones CRUD (NEW)
│   │   │   ├── learning.ts        # Learning resources (NEW)
│   │   │   ├── mentoring.ts       # Mentors + availability (NEW)
│   │   │   ├── notifications.ts   # Notifications (NEW)
│   │   │   ├── search.ts          # Full-text search (NEW)
│   │   │   ├── dashboard.ts       # Dashboard stats (NEW)
│   │   │   ├── admin.ts           # Admin endpoints (NEW)
│   │   │   ├── ai.ts              # AI chat proxy (NEW)
│   │   │   ├── uploads.ts         # File uploads (NEW)
│   │   │   ├── feed.ts            # Activity feed (NEW)
│   │   │   └── invites.ts         # Email invitations (NEW)
│   │   ├── lib/
│   │   │   ├── email.ts           # Resend client
│   │   │   ├── upload.ts          # Uploadthing/S3 client
│   │   │   ├── jobs.ts            # pg-boss/Inngest client
│   │   │   └── ai.ts              # AI provider client
│   │   ├── types.ts               # AppEnv + shared types
│   │   └── index.ts               # Hono app entry
│   ├── drizzle/                   # Generated migrations
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── components/
│   │   ├── ui/                    # 49+ shadcn primitives
│   │   ├── layout/                # AppLayout, MobileNav, NavLink
│   │   ├── common/                # EmptyState, ErrorBoundary, GlobalSearch, SkeletonLoaders
│   │   ├── chat/                  # ChatWidget
│   │   └── domain/                # MatchCard, ConnectionCard, EventCard, etc.
│   ├── contexts/                  # AuthContext
│   ├── hooks/                     # useProfile, useConnections, useNotifications, etc.
│   ├── lib/                       # api.ts, validations.ts, utils.ts
│   ├── pages/                     # ~35 pages (from 23)
│   ├── services/                  # aiService.ts
│   ├── stores/                    # Zustand stores
│   └── types/                     # Shared TypeScript types
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── MASTER_MIGRATION_PLAN.md
```

### K.3 Dependency Budget (Post-Migration)

**Backend** (~15 deps, from current 6):
- `hono`, `@hono/node-server`, `@hono/zod-validator` — Framework
- `drizzle-orm`, `postgres` — Database
- `better-auth` — Authentication
- `zod` — Validation
- `pino` — Logging
- `resend` — Email
- `uploadthing` or `@aws-sdk/client-s3` — Files
- `pg-boss` or `inngest` — Background jobs
- `bcryptjs` — Password hashing (if not handled by better-auth)

**Frontend** (~25 deps, from current 22):
- Current deps kept (React, Vite, shadcn, framer-motion, TanStack Query, etc.)
- Add: `zustand` (client state), `@tanstack/react-query-devtools` (dev)
- Remove: `next-themes` → use custom ThemeProvider (already done)

### K.4 Security Posture (Post-Migration)

| Layer | Current | Target |
|---|---|---|
| Auth | Manual JWT, bcryptjs | better-auth (OAuth, sessions, 2FA, CSRF) |
| Transport | HTTP (dev) | HTTPS enforced, HSTS header |
| Headers | CORS only | Helmet-equivalent (X-Frame-Options, CSP, etc.) |
| Rate limiting | None | Per-IP + per-user rate limits on all endpoints |
| Input validation | Zod on some routes | @hono/zod-validator on ALL routes |
| SQL injection | Drizzle parameterized queries (safe) | Same (Drizzle is safe by default) |
| XSS | React escapes by default | Add CSP header, sanitize markdown rendering |
| CSRF | None | Double-submit cookie via auth library |
| Logging | Basic console | Structured Pino logs with request IDs |
| Secrets | .env file | .env + secret rotation policy |

---

## SECTION L — Exact Deliverables

### Per-Phase Deliverables

| Phase | Code Deliverables | Documentation | Verification |
|---|---|---|---|
| **Phase 1** | Modified `schema.ts` (pg-core), new `postgres` driver setup, Pino logger, rate limiter, security middleware, React.lazy in App.tsx | Updated README with PG setup instructions | `tsc --noEmit` ✅ both, all existing API tests pass, `curl /health` returns 200 |
| **Phase 2** | better-auth integration, OAuth callback routes, email verification endpoints, CSRF middleware | Auth flow documentation | OAuth login E2E test, verification email received |
| **Phase 3** | 9 new Drizzle tables, 7 new route files, 6 pages wired to real API, NotificationBell component | API endpoint documentation per new route | `tsc --noEmit` ✅, each page loads real data, mock fallback works |
| **Phase 4** | tsvector columns, search route, matching algorithm, DiscoverPage wiring | Search API docs, matching algorithm explanation | Search returns relevant results, suggestions change per user |
| **Phase 5** | Resend integration, WS messaging, Zustand store, SSE notifications | Real-time architecture docs | Message appears in <1s, email delivered, notification badge updates |
| **Phase 6** | Upload middleware, avatar upload flow, message attachment support | Upload limits and supported types docs | Avatar changeable, file downloadable from message |
| **Phase 7** | Dashboard stats API, admin routes, activity tracking, reports table | Admin API docs | Dashboard shows real numbers, admin can ban user |
| **Phase 8** | AI proxy route, invite flow, feed route, pg-boss setup, bookmarks | AI rate limits docs, job monitoring | AI responds, invite email sent, feed shows activity |
| **Phase 9** | Cache headers, query optimization, bundle analysis, PWA manifest | Performance benchmark report | Lighthouse >90, p95 <200ms |
| **Phase 10** | vitest suites, Playwright E2E tests, k6 load scripts | Test coverage report, security audit report | >80% coverage, 0 critical findings |

### Cross-Cutting Deliverables

1. **Updated `MASTER_MIGRATION_PLAN.md`** — This document, updated after each phase with actuals vs. estimates
2. **`backend/src/db/schema.ts`** — Evolves from 12 tables to ~40-50 tables across phases
3. **`src/lib/api.ts`** — Evolves from 6 API method groups to ~20 groups
4. **`src/App.tsx`** — Evolves from 23 routes to ~35 routes (all lazy-loaded)
5. **Per-phase git tags** — `v0.1.0-phase1`, `v0.2.0-phase2`, etc.

---

## SECTION M — Windsurf Execution Strategy

### M.1 Session Strategy

Each phase should be executed in **2-4 Windsurf sessions**, following this pattern:

1. **Schema + Backend session**: Create Drizzle tables, generate migrations, write Hono routes, verify with `tsc --noEmit`
2. **Frontend wiring session**: Wire existing or new pages to the new API endpoints, add loading states, verify with `tsc --noEmit`
3. **Integration verification session**: Start both servers, test happy paths manually, fix any issues
4. **Polish session** (if needed): Error handling, edge cases, loading skeletons, mobile responsiveness

### M.2 Per-Session Checklist

Before each session:
- [ ] Review this plan for current phase tasks
- [ ] Check `tsc --noEmit` status on both frontend and backend
- [ ] List the specific files to create/modify

After each session:
- [ ] `tsc --noEmit` exits 0 on both frontend and backend
- [ ] No console errors in browser
- [ ] New features work with real API
- [ ] Mock fallback still works when API is down
- [ ] Existing features not broken (smoke test key pages)

### M.3 Critical File Touchpoints

These files will be modified in almost every phase:

| File | Role | Frequency |
|---|---|---|
| `backend/src/db/schema.ts` | All table definitions | Every backend session |
| `backend/src/index.ts` | Route mounting | Every new route file |
| `src/lib/api.ts` | API client methods + types | Every frontend wiring session |
| `src/App.tsx` | Route registration | Every new page |
| `src/components/AppLayout.tsx` | Navigation links | Every new navigable page |
| `package.json` (both) | New dependencies | Most phases |

### M.4 Verification Commands

```bash
# Backend type check
cd backend && npx tsc --noEmit

# Frontend type check
npx tsc --noEmit

# Backend dev server
cd backend && npm run dev

# Frontend dev server
npm run dev

# Database migration
cd backend && npm run db:push

# Generate migration SQL
cd backend && npm run db:generate
```

### M.5 Prompt Templates for Future Sessions

**Phase 1 start:**
> "Begin Phase 1 of the migration plan. Tasks: migrate SQLite to PostgreSQL in backend/src/db/schema.ts (change sqlite-core to pg-core, swap better-sqlite3 for postgres driver), add Pino logging, add rate limiting, add security headers, add React.lazy code splitting to App.tsx. Verify with tsc --noEmit on both."

**Phase 3 start:**
> "Begin Phase 3 of the migration plan. Tasks: add normalized skills table, events system, groups backend, milestones backend, learning backend, notifications, mentor profiles. Wire CommunitiesPage, MilestonesPage, LearningPage, MentorsPage to real API. Keep mock fallbacks."

**Any phase start:**
> "Continue migration plan Phase [N]. Reference MASTER_MIGRATION_PLAN.md Section H for tasks. Verify tsc --noEmit after each change."

---

## Final Recommendations

### Start With Phase 1 Immediately

The single highest-impact change is **SQLite → PostgreSQL** (Task 1.1). This unblocks:
- Full-text search (Phase 4)
- Concurrent writes (Phase 5 messaging)
- Production deployment
- Background job queues (pg-boss)

### Maintain the Mock Fallback Pattern

The current architecture pattern in cofound-connect-nexus is excellent:
```typescript
try {
  const data = await api.someEndpoint();
  setState(data);
} catch {
  // Keep mock data — page still works
}
```

**Keep this for ALL phases.** It means the frontend is always functional, even during backend development. Only remove mocks when the real API is battle-tested.

### One Table at a Time

Don't create all 40 tables in Phase 3. Create each table when its route is ready and its frontend page needs it. This prevents dead schema and keeps the codebase honest.

### Test at Every Boundary

After every schema change: `drizzle-kit push` + verify
After every route change: `tsc --noEmit` + curl test
After every page change: `tsc --noEmit` + browser test
Never commit code that breaks `tsc --noEmit` on either project.

---

*End of Master Migration Plan v1.0*
