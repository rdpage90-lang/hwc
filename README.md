# HWC — HEAT World Championship

A companion championship-management app for physical games of **HEAT: Pedal to the Metal**. HWC doesn't simulate the race — it creates championships, manages your driver roster, records results, calculates official points, and keeps a permanent historical record. Built to spec as V1: no editing, no deleting, no undo, sequential races only.

Stack: **Next.js 14 (App Router) · TypeScript · PostgreSQL · Prisma · NextAuth v5 · Tailwind CSS**

---

## 1. Local setup

### Requirements
- Node.js 18.18+
- A PostgreSQL database (local install, or a free hosted one — Neon, Supabase, Railway, and Vercel Postgres all work)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill it in
cp .env.example .env
# - DATABASE_URL: your Postgres connection string
# - AUTH_SECRET: generate one with `openssl rand -base64 32`
# - SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD: your first login

# 3. Create the database schema
npx prisma migrate dev --name init

# 4. Apply the immutability triggers (see section 3 below — important!)
npm run db:triggers

# 5. Create your first admin account
npm run db:seed

# 6. Start the app
npm run dev
```

Visit `http://localhost:3000`, sign in with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set, and go to **Admin → Manage users** to create real accounts for your group (change or replace the seed admin's password there — the seed script is a bootstrap step, not meant for ongoing use).

---

## 2. Deploying

Any Node.js host works. The easiest path is **Vercel + Neon/Supabase/Vercel Postgres**:

1. Push this repo to GitHub.
2. Create a Postgres database with your provider of choice and copy its connection string.
3. Import the repo into Vercel. Set the environment variables from `.env.example` in the Vercel project settings (`NEXTAUTH_URL` should be your production URL, e.g. `https://hwc.yourdomain.com`).
4. Deploy.
5. From your local machine (pointed at the *production* `DATABASE_URL`), run:
   ```bash
   npx prisma migrate deploy
   npm run db:triggers
   npm run db:seed
   ```
   You only need to do this once, against production, to stand up the schema and your first admin.

Railway, Render, Fly.io, or a plain VPS work the same way — `npm run build && npm start`, with the same three one-time database commands run against whatever `DATABASE_URL` you point at.

---

## 3. Why there's a `db:triggers` step

The spec is explicit that submitted race results — and completed races/championships — must be **permanently immutable**, enforced by the database rather than the UI alone. Prisma's migration files describe table *shape*, not triggers, so the immutability rules live in a separate raw SQL file: `prisma/triggers.sql`.

Run `npm run db:triggers` once after your first migration (and again after any `prisma migrate reset`, since that drops and recreates the schema). It adds Postgres triggers that outright reject any `UPDATE`/`DELETE` on `race_results`, and any further mutation of a `races` or `championships` row once its `status` is `COMPLETED`. In normal use you'll never see these fire — the application code never attempts these writes — they're a backstop against bugs or a stray manual query.

---

## 4. Decisions I made that you should sanity-check

Your spec calls for "the official HEAT championship scoring system" and "official tie-break criteria," but HEAT's physical Championship System booklet doesn't publish a single canonical digital points table or a written tie-break procedure I could find. Rather than guess or fabricate numbers and present them as official, I made two explicit, clearly-flagged assumptions — both easy to change in one place:

- **Points table** (`lib/scoring.ts` → `defaultPointsSystem()`): taken directly from the worked example in your own spec — 1st = 10, 2nd = 8, 3rd = 6, 4th = 5, 5th = 4 — extended down to 8th and with DNF = 0. This is stored per-championship as editable JSON (`championship.pointsSystem`), so you can override it at creation time if your group's actual scoresheet differs, without touching code.
- **Tie-break rule** (`lib/scoring.ts` → `compareStandingRows()`): standard motorsport countback — most points, then most wins, then most 2nd places, then most 3rd places, and so on. If your rulebook specifies something else (e.g. head-to-head, or countback from most-recent-race), this one function is where to change it.

Everything else in the data model and validation logic (sequential races, DNS = 0 points always, DNF as a distinct state from DNS, late-joiner rules, roster immutability once raced) is implemented exactly as specified.

---

## 5. Project structure

```
app/
  login/                        Login page
  dashboard/                    Main landing page after login
  championships/
    page.tsx                    List of live championships
    new/                        Championship creation flow
    [id]/
      layout.tsx                Header + tab nav shared by all sub-pages
      page.tsx                  Overview tab
      standings/                Full standings grid
      races/                    Race list + individual race pages
      drivers/                  Roster tab + per-championship driver profile
      champion/                 Championship-complete celebration screen
  drivers/                      Global driver roster (career view)
  archive/                      Completed championships
  admin/users/                  User management (admin only)
  api/                          All mutating/reading endpoints

lib/
  scoring.ts                    Points calculation, standings, tie-break — the one
                                 place that ever computes a driver's points
  championship.ts                Shared "fetch full championship" query
  validations.ts                 Zod schemas for every API input
  session.ts                     requireUser() / requireAdmin() guards
  db.ts                          Prisma client singleton

prisma/
  schema.prisma                  Data model
  triggers.sql                   DB-level immutability (see section 3)
  seed.ts                        Creates the first admin account

components/                      UI — the HUD-styled design system lives in ui.tsx
```

## 6. What's deliberately out of scope for V1

Matching the spec: no editing/undoing results, no career-wide cross-championship stats (the data model supports adding them later without a schema change), no digital simulation of the actual race, single "car colour" field rather than a livery builder. All fair game for a V2 pass once this is bedded in.
