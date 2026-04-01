# CoFounder Connect — Implementation Log

## Session: Phase 0 Bug Fixes + Phase 1 Infrastructure Hardening

**Date**: 2026-04-01
**Backend**: `tsc --noEmit` exit 0 ✅
**Frontend**: `tsc --noEmit` exit 0 ✅
**Backend port**: 3002 (avoids conflict with CoFounderBay on 3000/3001)
**Frontend port**: 8080

---

## 1. Dead File Cleanup

### Deleted
- `backend/prisma/` directory (schema.prisma + dev.db) — orphaned Prisma files, replaced by Drizzle
- `backend/docker-compose.yml` — violates no-Docker constraint

### Marked Deprecated
- `backend/src/lib/prisma.ts` — dead re-export stub, kept for backward compat
- `backend/src/lib/auth.ts` — dead re-export stub, kept for backward compat

---

## 2. Backend Bug Fixes

### `.env` corrected
- **Before**: `DATABASE_URL="file:./dev.db"` (Prisma convention, not read by code)
- **After**: `DATABASE_PATH="./data/dev.db"` (matches what `backend/src/db/index.ts` actually reads)
- Added `CORS_ORIGIN="http://localhost:8080"`

### Health check fixed
- `GET /health/db` used `db.run(sql\`SELECT 1\`)` — replaced with `db.get(sql\`SELECT 1\`)` which is the correct Drizzle better-sqlite3 API

### dotenv added
- Installed `dotenv` package
- Added `import "dotenv/config"` at top of `backend/src/index.ts` so `.env` is loaded before any code reads `process.env`

### Port changed to 3002
- `backend/.env`: PORT=3002
- `backend/.env.example`: PORT=3002
- `src/lib/api.ts`: default API_BASE changed to `http://localhost:3002`

---

## 3. Phase 1: Infrastructure Hardening (Backend)

### New files created

#### `backend/src/lib/logger.ts`
- Pino structured logging
- Pretty-print in dev, JSON in production
- Configurable via `LOG_LEVEL` env var

#### `backend/src/middleware/security.ts`
- Security headers middleware (Helmet-equivalent for Hono)
- Sets: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS (production only)

#### `backend/src/middleware/rateLimit.ts`
- In-memory sliding window rate limiter
- Two presets:
  - `authRateLimit`: 20 req/15min per IP (strict, for `/api/auth/*`)
  - `apiRateLimit`: 100 req/min per IP (general, for `/api/*`)
- Sets X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
- Periodic cleanup (60s interval) prevents memory growth

#### `backend/src/middleware/errorHandler.ts`
- Global error handler for Hono (`app.onError`)
- Logs unhandled errors via Pino with method, path, status, stack
- Returns safe JSON error (hides internals in production)

### `backend/src/index.ts` — fully rewired
- Replaced `hono/logger` with Pino-based request logging (method, path, status, ms)
- Added `securityHeaders` middleware on all routes
- Added `authRateLimit` on `/api/auth/*`
- Added `apiRateLimit` on `/api/*`
- Added `app.onError(globalErrorHandler)`
- Added `app.notFound()` — returns proper 404 JSON instead of Hono default
- Startup log now uses Pino instead of `console.log`

### Dependencies added
- `dotenv` — env file loading
- `pino` + `pino-pretty` — structured logging
- `@types/pino` — TypeScript types

---

## 4. Frontend Bug Fixes

### `src/App.tsx` — Code splitting
- All 23 page imports converted from eager `import X from "..."` to `React.lazy(() => import("..."))`
- Added `<Suspense>` wrapper with `<PageLoader>` fallback (centered Loader2 spinner)
- **Impact**: Initial bundle size significantly reduced; pages load on demand

### `src/components/AppLayout.tsx` — Multiple fixes
- **Branding**: "CoFounderBay" → "CoFounder Connect" in sidebar
- **User initials**: Hardcoded "JD" → dynamic `getUserInitials(user.name, user.email)`
- **Logout button**: Was a no-op `<button>` → now calls `logout()` + `navigate("/")`
- **Notification badge**: Removed hardcoded "5" badge (will be replaced with real data later)
- **Message badge**: Removed hardcoded `badge: 3` from nav items
- **Badge rendering**: Removed badge JSX block since no items carry badges anymore

### `src/components/MobileNav.tsx` — Multiple fixes
- **Branding**: "CoFounderBay" → "CoFounder Connect" (header + sheet)
- **Badges**: Removed hardcoded `badge: 3` from navItems and bottomTabs
- **Logout button**: Was a no-op → now calls `logout()` + `navigate("/")` + `setOpen(false)`
- Added `useNavigate` and `useAuth` imports

### `src/stores/useMessaging.ts` — Memory leak fix
- **Bug**: `useState(() => { const unsub = subscribe(); return unsub; })` — React does NOT call the return value of useState initializer as cleanup
- **Fix**: Replaced with proper `useEffect` that returns cleanup function on unmount

### `index.html` — Meta tags
- Title: "Lovable App" → "CoFounder Connect"
- Description: Updated to meaningful product description
- Removed Lovable-specific OG images and Twitter handles

---

## 5. Branding Rename: "CoFounderBay" → "CoFounder Connect"

All user-facing references renamed across **14 frontend files**:
- `LandingPage.tsx` (6 occurrences)
- `LoginPage.tsx`
- `SignupPage.tsx`
- `ForgotPasswordPage.tsx`
- `ResetPasswordPage.tsx`
- `TermsPage.tsx` (4 occurrences)
- `PrivacyPage.tsx` (2 occurrences)
- `SettingsPage.tsx`
- `LearningPage.tsx` (2 occurrences)
- `DemoPage.tsx`
- `CommunityDetailPage.tsx`
- `services/aiService.ts` (4 occurrences)
- `stores/useMessaging.ts`
- `components/AppLayout.tsx`
- `components/MobileNav.tsx`

### Intentionally NOT renamed
- `contexts/AuthContext.tsx` localStorage key `cofounderbay_user` — internal, not user-facing; changing would log out existing users
- Email placeholders (`legal@cofounderbay.com`, `privacy@cofounderbay.com`) in Terms/Privacy pages — placeholder contact info

---

## 6. Verification

| Check | Result |
|-------|--------|
| Backend `tsc --noEmit` | exit 0 ✅ |
| Frontend `tsc --noEmit` | exit 0 ✅ |
| Backend starts on port 3002 | ✅ |
| `GET /health` returns 200 | ✅ |
| `GET /health/db` returns 200 | ✅ |
| Security headers present | ✅ |
| Frontend starts on port 8080 | ✅ |
| No "CoFounderBay" in UI | ✅ (except internal keys) |

---

## What's Next (Phase 1 continued → Phase 2)

### Remaining Phase 1 tasks
- [x] Fix N+1 query patterns in connections.ts, messages.ts, opportunities.ts — batch loads
- [x] Add request ID middleware for tracing
- [x] Add Vite proxy config to forward `/api` to backend (avoids CORS in dev)

### Phase 2: Auth upgrade
- [x] Refresh token rotation (single-use, replay-attack protection)
- [ ] Add OAuth (Google, GitHub) support — Phase 3
- [ ] Email verification flow — Phase 3
- [ ] CSRF protection — Phase 3

### Phase 3: Schema expansion
- [ ] Expand from 12 to ~25-30 tables
- [ ] Add startup/team entities
- [ ] Add notification system tables
- [ ] Add activity history

---

## Session: Phase 2 — Frontend Wiring + Auth Hardening

**Date**: 2026-04-01 (continued)
**Backend**: `tsc --noEmit` exit 0 ✅
**Frontend**: `tsc --noEmit` exit 0 ✅

---

### Phase 2a — DiscoverPage wired to real backend

**File**: `src/pages/DiscoverPage.tsx`

- Added auth guard (`useEffect` redirect to `/login` if not authenticated)
- `fetchSuggested()` calls `api.connections.getSuggested()` on mount
- Backend users merged with mock compatibility/skill data by index
- `sendIntro(profile)` calls `api.connections.requestConnection(userId)` and tracks sent state via `Set<string>`
- Connect button disabled while in-flight or after success

---

### Phase 2b — DashboardPage wired to real backend

**File**: `src/pages/DashboardPage.tsx`

- `fetchStats()` calls `api.connections.list()` and `api.connections.getRequests()` in parallel
- Real connection count replaces mock "Connections" stat
- Real pending request count replaces mock "Intro Requests" stat
- `fetchSuggested()` calls `api.connections.getSuggested()` for "Suggested Matches" count
- All three stats fall back to mock values on API error

---

### Phase 2c — Notifications backend route

**File**: `backend/src/routes/notifications.ts` (new)

- Dynamically computes notifications from existing tables (no new schema required):
  - **connection_request**: pending `connectionRequests` where `toUserId = me`
  - **connection_accepted**: accepted `connectionRequests` where `fromUserId = me`, within 30 days
  - **new_message**: conversations where last message is from someone else and unread
- Returns `{ notifications[], unreadCount }` — sorted by `createdAt` desc
- Mounted at `GET /api/notifications` with JWT auth
- Added to `backend/src/index.ts` route registry

---

### Phase 2d — AppLayout bell icon wired

**File**: `src/components/AppLayout.tsx`

- Imports `api.notifications.list()` and `useAuth`
- Fetches notifications on mount + polls every 60s
- Badge shows real `unreadCount` (hidden when 0)
- Bell click opens notification dropdown panel with list of notifications
- Each notification has icon by type + relative time
- "Mark all read" resets local unread count to 0

---

### Phase 2e — Auth hardening

**File**: `backend/src/routes/auth.ts`

Four security improvements:

1. **Refresh token rotation** — `/refresh` now deletes the consumed token and issues a brand-new one. Every refresh token is single-use; replaying an old one returns 401. Stale expired tokens are also cleaned up.

2. **Timing-safe login** — when email is not found, bcrypt.compare still runs against `DUMMY_HASH`. This equalises response time regardless of whether the email exists, preventing email enumeration via timing side-channel.

3. **Email normalization** — all email addresses are lowercased before storage or lookup in register, login, and forgot-password handlers.

4. **Expired token cleanup** — on login, all expired refresh tokens for the user are deleted (via transaction) before inserting the new one. Prevents table bloat.

5. **Configurable bcrypt rounds** — `BCRYPT_ROUNDS` env var (default 12) controls cost factor. Password reset also uses the same constant.

6. **Pino logger** — all `console.error`/`console.log` calls replaced with structured `logger.error`/`logger.info`.

**File**: `src/lib/api.ts`

- `onTokenRefreshed` callback signature extended to `(token: string, refreshToken?: string) => void`
- Rotated refresh token from `/auth/refresh` response is now passed to the callback

**File**: `src/contexts/AuthContext.tsx`

- `onTokenRefreshed` handler now persists the new refresh token to localStorage alongside the new access token

---

### Phase 2f — ChatWidget wired to real messages API

**File**: `src/stores/useMessaging.ts`

- `isRealConvo(id)` helper distinguishes UUID/nanoid backend IDs from mock `c1`, `c2`, `agent-*` IDs
- `loadMessages(convoId)` — async; skips mock convos, skips if already loaded, calls `api.messages.getConversation()`, maps to `UnifiedMessage[]`, notifies listeners
- `sendMessage` is now async with optimistic update:
  1. Message appended to local state immediately (status: "sent")
  2. For real convos: `api.messages.sendMessage()` called; on success, optimistic msg replaced by server-confirmed msg (status: "delivered")
  3. On API error: optimistic message stays (graceful degradation, no crash)
- `loadMessages` and `sendMessage` exported from hook return value

**File**: `src/components/ChatWidget.tsx`

- Destructures `loadMessages` from `useMessaging`
- `openUserChat(convoId)` now calls `loadMessages(convoId)` — triggers real API fetch for backend conversations when thread is opened for the first time

---

### Verification

| Check | Result |
|-------|--------|
| Backend `tsc --noEmit` | exit 0 ✅ |
| Frontend `tsc --noEmit` | exit 0 ✅ |
| Backend starts on port 3002 | ✅ |
| Refresh token rotation | ✅ |
| Timing-safe login | ✅ |
| Email normalization | ✅ |
| ChatWidget loads real messages | ✅ |
| ChatWidget sends to real API | ✅ |

---

## What's Next (Phase 3)

- [ ] Schema expansion: notifications table, startup entities, activity log
- [ ] Orama full-text search for user/opportunity discovery
- [ ] OAuth (Google/GitHub) via better-auth
- [ ] Email verification flow (Resend)
