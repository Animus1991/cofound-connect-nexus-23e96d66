# CoFounderBay Backend

Node.js + Fastify + Prisma + SQLite/PostgreSQL API.

## Setup

1. **Database** — **SQLite by default** (zero config, no setup):
   ```bash
   npm run db:push
   npm run dev
   ```
   Uses `file:./dev.db` from `.env`.

   **For PostgreSQL** (production): Set `DATABASE_URL=postgresql://user:pass@host:5432/db` in `.env`, update `prisma/schema.prisma` provider to `postgresql`, change `skills`/`interests` to `String[]`, run `npm run db:push`.

2. **Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and JWT_SECRET
   ```

3. **Database:**
   ```bash
   npm run db:push    # Create tables (dev)
   # or
   npm run db:migrate # Use migrations (production)
   ```

4. **Run:**
   ```bash
   npm run dev   # Development (tsx watch)
   npm start     # Production (after npm run build)
   ```

## API

- `GET /health` — Health check
- `GET /health/db` — Database connectivity check (503 if DB unavailable)
- `POST /api/auth/register` — Register (name, email, password, roles)
- `POST /api/auth/login` — Login (email, password)
- `GET /api/profiles/me` — Get current user profile (auth required)
- `PUT /api/profiles/me` — Update profile (auth required)

## Frontend

Set `VITE_API_URL=http://localhost:3001` in the frontend `.env` for local development.
