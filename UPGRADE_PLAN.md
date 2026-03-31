# CoFound Connect Nexus — Πλάνο Αναβάθμισης & Εξέλιξης

> Εξονυχιστικός έλεγχος κώδικα και λεπτομερές πλάνο βελτίωσης σελίδα-σελίδα, component-component.

---

## 📋 Executive Summary

Το project είναι ένα **co-founder matching platform** (CoFounderBay) με Vite + React + TypeScript + shadcn-ui + Tailwind. Η δομή είναι καλή αλλά λείπουν κρίσιμα στοιχεία: **auth**, **backend**, **validation**, **error handling**, **loading states**. Όλα τα δεδομένα είναι mock arrays.

---

## 🔴 Phase 0: Κρίσιμες Διορθώσεις (Άμεσα)

### 0.1 Λείπουσα εικόνα hero-bg.jpg
- **Πρόβλημα:** `LandingPage`, `LoginPage`, `SignupPage` κάνουν `import heroBg from "@/assets/hero-bg.jpg"` αλλά το αρχείο δεν υπάρχει.
- **Λύση:** Δημιουργία placeholder ή χρήση gradient-only background.
- **Αρχεία:** `src/assets/`, `LandingPage.tsx`, `LoginPage.tsx`, `SignupPage.tsx`

### 0.2 SkeletonLoaders — Λάθος Tailwind classes
- **Πρόβλημα:** `w-1/3`, `w-4/5`, `w-2/3`, `w-1/2`, `w-1/4` δεν είναι έγκυρα Tailwind classes (χρειάζονται `w-[33%]`, `w-4/5` είναι έγκυρο αλλά `w-1/3` όχι).
- **Λύση:** Αντικατάσταση με `w-1/3` → `w-[33%]`, `w-4/5` → `w-4/5` (έγκυρο), `w-2/3` → `w-2/3` (έγκυρο).
- **Αρχείο:** `src/components/SkeletonLoaders.tsx`

### 0.3 ProfilePage — `(draft as any)` type safety
- **Πρόβλημα:** Στο Contact & Links section: `(draft as any)[link.key]` — απώλεια type safety.
- **Λύση:** Χρήση `keyof ProfileData` και σωστό typing.
- **Αρχείο:** `src/pages/ProfilePage.tsx`

---

## 🟠 Phase 1: Branding & Συνοχή

### 1.1 Ομοιόμορφο όνομα εφαρμογής
- **Πρόβλημα:** `CoFounderBay` (Landing, Login, Signup, AppLayout) vs `CoFound` (Onboarding header).
- **Λύση:** Ενοποίηση σε **CoFounderBay** παντού.

### 1.2 index.html — Metadata
- **Πρόβλημα:** Title "Lovable App", description "Lovable Generated Project".
- **Λύση:** `CoFounderBay — Find Your Co-founder`, κατάλληλη description, og:image.

### 1.3 Mobile Nav — Ορολογία
- **Πρόβλημα:** Στο MobileBottomNav το "Jobs" vs "Opportunities" στο sidebar.
- **Λύση:** Ενοποίηση σε "Opportunities" παντού.

---

## 🟡 Phase 2: Forms & Validation

### 2.1 LoginPage
- **Τρέχον:** Controlled inputs χωρίς validation, form submit `e.preventDefault()` χωρίς λογική.
- **Βελτίωση:**
  - Zod schema: `{ email: z.string().email(), password: z.string().min(8) }`
  - react-hook-form + @hookform/resolvers
  - Error messages κάτω από κάθε πεδίο
  - Loading state στο submit button
  - "Forgot password" → link σε `/forgot-password` (placeholder route)

### 2.2 SignupPage
- **Τρέχον:** Ίδιο πρόβλημα, επιπλέον `selectedRoles` χωρίς validation (τουλάχιστον 1 role).
- **Βελτίωση:**
  - Zod: `name`, `email`, `password` (min 8, 1 uppercase, 1 number), `roles: z.array(z.string()).min(1)`
  - Password strength indicator
  - Terms of service checkbox

### 2.3 OnboardingPage
- **Τρέχον:** Πολλά πεδία χωρίς validation.
- **Βελτίωση:**
  - Step 1: `name` required, `bio` max 500 chars
  - Step 2: `selectedInterests` min 1
  - Zod per step

---

## 🟢 Phase 3: Auth & Protected Routes

### 3.1 Auth Context
- **Δημιουργία:** `AuthContext` με `user`, `isAuthenticated`, `login`, `logout`, `loading`.
- **Προσωρινά:** Mock auth (localStorage ή in-memory) μέχρι backend.

### 3.2 Protected Routes
- **Δημιουργία:** `ProtectedRoute` component που ελέγχει `isAuthenticated`.
- **Routes προστασίας:** `/dashboard`, `/discover`, `/messages`, `/opportunities`, `/network`, `/profile`, `/learning`, `/settings`, `/onboarding`.
- **Redirect:** Μη auth → `/login` με `?redirect=/dashboard`.

### 3.3 Post-login redirect
- **Τρέχον:** Login/Signup δεν κάνουν redirect.
- **Βελτίωση:** Μετά επιτυχημένο login → `/dashboard` ή `redirect` param.

---

## 🔵 Phase 4: API Layer & Data

### 4.1 HTTP Client
- **Δημιουργία:** `src/lib/api.ts` με `fetch` wrapper ή `axios`.
- **Base URL:** `import.meta.env.VITE_API_URL`
- **Interceptors:** Auth token στο header, 401 → logout + redirect.

### 4.2 React Query Integration
- **Τρέχον:** QueryClientProvider υπάρχει αλλά δεν χρησιμοποιείται.
- **Βελτίωση:** `useQuery` για profiles, matches, messages, opportunities κ.λπ.
- **SkeletonLoaders:** Χρήση κατά loading state.

### 4.3 Error Boundary
- **Δημιουργία:** `ErrorBoundary` component για uncaught errors.
- **Τοποθέτηση:** Γύρω από `AnimatedRoutes` στο `App.tsx`.

---

## 🟣 Phase 5: UX & Polish

### 5.1 Loading States
- **Dashboard:** SkeletonLoaders κατά φόρτωση stats, matches.
- **Discover:** SkeletonLoaders για profile cards.
- **Messages:** MessageSkeleton κατά φόρτωση conversation.

### 5.2 Toast/Sonner
- **Τρέχον:** Και Toaster (Radix) και Sonner — διπλότυπο.
- **Λύση:** Επιλογή ενός (προτείνω Sonner για consistency με next-themes).

### 5.3 Profile initials
- **Τρέχον:** Hardcoded "JD" στο AppLayout και ProfilePage.
- **Βελτίωση:** Dynamic από `user.name` ή `profile.name`.

### 5.4 Empty States
- **Βελτίωση:** Ομοιόμορφα empty states με CTA (π.χ. "No messages yet — Start a conversation").

---

## 🔷 Phase 6: TypeScript & Code Quality

### 6.1 Strict Mode
- **Τρέχον:** `strict: false`, `noImplicitAny: false`.
- **Βελτίωση:** Ενεργοποίηση σταδιακά, διόρθωση errors.

### 6.2 Unused Code
- **App.css:** Δεν importάρεται — αφαίρεση ή χρήση.
- **NavLink:** Ορίζεται αλλά δεν χρησιμοποιείται — χρήση ή αφαίρεση.
- **SkeletonLoaders:** Υπάρχουν αλλά δεν χρησιμοποιούνται — ενσωμάτωση.

---

## 🔶 Phase 7: Backend (Υλοποιήθηκε)

### Τεχνολογία: **Node.js + Fastify + Prisma + PostgreSQL**

| Κριτήριο | Αξιολόγηση |
|----------|------------|
| **Συμβατότητα** | Ιδανικό για React SPA — REST ή tRPC, ίδιο ecosystem (TypeScript). |
| **Ταχύτητα** | Fastify γρηγορότερο από Express. |
| **ORM** | Prisma — type-safe, migrations, schema. |
| **Auth** | JWT + refresh tokens, ή Passport.js. |
| **Realtime** | WebSockets (Socket.io ή ws) για messages. |
| **Hosting** | Vercel (frontend) + Railway/Render/Fly.io (backend). |

### Εναλλακτικές
- **Supabase:** Firebase-alternative με PostgreSQL, auth, realtime — γρήγορο prototyping.
- **Next.js API Routes:** Αν μετακινηθεί το frontend σε Next.js.
- **tRPC:** End-to-end types ανάμεσα σε frontend και backend.

### Δομή Backend (υλοποιήθηκε)
```
backend/
├── src/
│   ├── index.ts          # Fastify entry
│   ├── routes/auth.ts    # POST /api/auth/register, /api/auth/login
│   ├── middleware/auth.ts
│   └── lib/prisma.ts, jwt.ts
├── prisma/schema.prisma  # User, Profile
├── .env.example
└── package.json
```

### Scale-up & Επεκτασιμότητα
- **Horizontal scaling:** Stateless API, Prisma connection pooling
- **Microservices:** Routes modular, εύκολη διάσπαση σε services
- **Realtime:** Προετοιμασία για WebSockets (messages)
- **Database:** PostgreSQL migrations, indexes για queries

---

## 📊 Σύνοψη Σελίδων & Components

| Σελίδα | Προτεραιότητα | Κύρια Βελτιώσεις |
|--------|--------------|------------------|
| **LandingPage** | P1 | hero-bg fix, SEO meta |
| **LoginPage** | P0 | Validation, auth flow, redirect |
| **SignupPage** | P0 | Validation, auth flow |
| **OnboardingPage** | P1 | Validation, branding |
| **DashboardPage** | P2 | SkeletonLoaders, API data |
| **DiscoverPage** | P2 | API, pagination, SkeletonLoaders |
| **MessagesPage** | P2 | API, realtime, SkeletonLoaders |
| **OpportunitiesPage** | P2 | API, filters logic |
| **NetworkPage** | P2 | API |
| **ProfilePage** | P1 | Type fix, API, avatar upload |
| **LearningPage** | P2 | API |
| **SettingsPage** | P2 | API, password change, delete account |
| **NotFound** | P1 | Καλύτερο 404 UI |

---

## 🚀 Σειρά Υλοποίησης (Σταδιακά)

1. **Phase 0** — Κρίσιμες διορθώσεις (αμέσως)
2. **Phase 1** — Branding
3. **Phase 2** — Form validation (Login, Signup, Onboarding)
4. **Phase 3** — Auth context + protected routes (mock)
5. **Phase 4** — API layer skeleton + React Query
6. **Phase 5** — Loading states, UX polish
7. **Phase 6** — TypeScript strict, cleanup
8. **Phase 7** — Backend (ξεχωριστό project)

---

*Τελευταία ενημέρωση: Μάρτιος 2026*
