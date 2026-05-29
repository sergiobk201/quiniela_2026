<h1 align="center">Quiniela 2026</h1>

<p align="center">
  <strong>Invite-only FIFA World Cup 2026 prediction game with automated scoring and a real-time leaderboard.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Vercel-deployed-000000?style=flat-square&logo=vercel" alt="Vercel">
</p>

<p align="center">
  <!-- TODO: add hero screenshot → docs/hero.png (suggested: leaderboard or dashboard view) -->
</p>

---

## ✨ Overview

Quiniela 2026 is a full-stack prediction game built for 25 family and friends competing across the 2026 FIFA World Cup. Players submit pre-tournament trophy picks, group standing predictions, and match-by-match score forecasts across all 104 matches. A scoring engine deployed as a Supabase Edge Function (Deno) automatically awards points after each result is entered, and a Realtime-powered leaderboard updates live across all connected clients.

The system enforces hard prediction deadlines via dual-layer lock enforcement: RLS policies on the database block writes after `locked_at` at the Postgres level, with Next.js Server Actions fetching lock times from the DB server-side as a first gate — eliminating client-controlled bypass vectors. Access is invite-only with no self-registration path.

> 🔗 **Live:** [quiniela2026.space](https://www.quiniela2026.space)

---

## 🚀 Features

- 🔐 **Invite-only magic link auth** — Supabase Auth with `shouldCreateUser: false`; unknown emails get a neutral response to prevent account enumeration.
- 📊 **Multi-stage scoring engine** — Deno Edge Function scores all users in a single invocation across 7 match stages with configurable multipliers, upset bonuses, and pre-tournament trophy/award picks.
- ⏱ **Dual-layer lock enforcement** — RLS `INSERT`/`UPDATE` policies enforce `locked_at > NOW()` at the DB level; Server Actions re-fetch `locked_at` from Postgres to prevent client-supplied lock bypass.
- 📡 **Real-time leaderboard** — Supabase Realtime subscription pushes score updates to all clients without polling.
- 🛡 **Hardened admin panel** — Full CRUD for matches, locks, scores, and users. All 11 admin Server Actions gated by `assertAdmin()` (service-role `is_admin` check) to block action-endpoint abuse.
- 🖨 **Prediction receipt** — Print-to-PDF snapshot of all predictions with dedicated print CSS, shareable before the lock date.
- 🌐 **EN/ES language toggle** — Cookie-based locale switching via `next-intl`; 480+ strings translated across all user-facing pages; toggle present on every route including login — no URL restructure required.
- 📋 **Picks comparison grid** — Leaderboard section showing every user's predictions side-by-side across all 7 match stages with search, stage tabs, and score overlays.
- 🌍 **Public leaderboard** — `/leaderboard/public` serves a live ranked standings page with no authentication required; shareable link for non-participants.
- 🏆 **Live champion theming** — Selected champion pick propagates a trophy glow + gradient across the leaderboard row in real time via a custom DOM event bus.
- 📱 **PWA-ready icons** — Custom favicon and Apple touch icon for iOS home screen installation.

---

## 📸 Screenshots

<!-- TODO: add screenshots to docs/ — suggested captures:
  docs/login.png        → magic link form
  docs/dashboard.png    → score breakdown + champion pick
  docs/leaderboard.png  → podium + ranked table
  docs/predictions.png  → group stage match score inputs
  docs/admin.png        → admin matches panel
-->

---

## 🏗 Architecture

```
Next.js 16 App Router (Vercel — Fluid Compute)
├── (auth)           → /login · /auth/callback (PKCE)
├── (admin)          → /admin/* — middleware + assertAdmin() gated
│   ├── /users       → invite, toggle paid/admin, remove
│   ├── /matches     → score entry, status cycle, upset flag
│   ├── /locks       → per-stage lock/unlock with confirmation
│   ├── /scoring     → manual recompute, tournament results entry
│   └── /audit       → insert-only append log viewer
├── /dashboard       → personal score breakdown + champion pick
├── /leaderboard     → Realtime ranked table + top-3 podium
├── /predictions/*   → pre-tournament · group stage · knockout · rebuy · receipt
└── /rules           → scoring rules + FAQ
         │
         ▼
Supabase (Postgres + RLS + Auth + Realtime + Edge Functions)
├── 11 RLS-protected tables — write-locks enforced per stage
├── compute-scores   → Deno Edge Function, service-role auth
└── Magic link Auth  → PKCE exchange → profile lookup → role-based redirect
```

### Key engineering decisions

| Decision | Rationale |
|---|---|
| Service-role client for `is_admin` reads | Profiles RLS has a self-referential `EXISTS` policy; the anon client deadlocks on it. Only service-role bypasses this. |
| `NEXT_PUBLIC_SITE_URL` for `emailRedirectTo` | `window.location.origin` returns the `www` variant in production, mismatching the non-www Supabase allowlist entry. |
| `FOR ALL` → explicit `INSERT`/`UPDATE` RLS policies | `FOR ALL USING (user_id = auth.uid())` allows post-lock writes via direct PostgREST calls. Split policies add `locked_at > NOW()` enforcement. |
| Server Actions fetch `locked_at` from DB | The previous signature accepted `lockedAt` as a parameter — a client-controlled value trivially bypassed by supplying a future timestamp. |
| Single login route for all users | Admin privilege is DB-driven (`is_admin = true`). No separate login path means no route to enumerate admin endpoints. |

---

## ⚽ Scoring System

Points are computed by `supabase/functions/compute-scores` after each match is marked `finished`.

### Match predictions

| Outcome | Points |
|---|---|
| Exact score | 5 × stage multiplier |
| Correct result (W / D / L) | 2 × stage multiplier |
| Upset bonus (admin-flagged) | +3 flat |

**Stage multipliers:** Group ×1 · R32 ×2 · R16 ×3 · QF ×4 · SF ×5 · Final ×7

### Pre-tournament picks

| Prediction | Points |
|---|---|
| Champion | 15 |
| Runner-up | 10 |
| 3rd place | 7 |
| Golden Boot / Golden Glove / Kopa Trophy | 5 each |
| Total goals — exact / within ±5 | 10 / 5 |
| First eliminated team | 5 |
| Most yellow cards team | 5 |
| Group standings — 1st / 2nd / 3rd / 4th | 5 / 3 / 2 / 1 pts per group |
| 3rd-place qualifiers (pick 8 of 12) | 3 each · 24 pts max |

**Group standings max:** 11 pts/group × 12 groups = **132 pts total**

### Champion rebuy

One rebuy opportunity per user, unlocked by the admin only when their predicted champion is eliminated. Permanent on submission — cannot be changed.

---

## 🏁 Quick Start

```bash
# <!-- TODO: replace with public repo URL when available -->
git clone <repo-url>
cd quiniela-2026
npm install
cp .env.local.example .env.local
# fill in the four required env vars (see Configuration)
npm run dev
```

Apply migrations in order via the Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_tournament_results.sql
supabase/migrations/004_rls_write_locks.sql
```

Seed reference data (48 teams, 12 groups, 104 matches):

```
supabase/seed/001_seed_data.sql
```

The first admin profile must be inserted manually via the SQL Editor after the first magic link sign-in:

```sql
UPDATE profiles SET is_admin = TRUE WHERE id = '<your-auth-user-id>';
```

---

## ⚙️ Configuration

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server-only, never sent to the client |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, no trailing slash, no `www` (e.g. `https://quiniela2026.space`) |
| `RESEND_API_KEY` | Resend API key — configured as Supabase custom SMTP for production email |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. It is imported exclusively in Server Actions, middleware, and the admin client — never in client components.

---

## 🗺 Roadmap

- [x] Schema + RLS migrations — 11 tables, dual-layer write-lock enforcement
- [x] Supabase Auth — invite-only magic link, PKCE callback, role-based redirect
- [x] Admin panel — users, matches, locks, audit log, scoring, tournament results
- [x] Full prediction suite — pre-tournament, group stage, knockout (×4 stages), rebuy, PDF receipt
- [x] Scoring engine — Supabase Edge Function (Deno), all scoring types in one invocation
- [x] Real-time leaderboard — Supabase Realtime, top-3 podium, per-user rank card
- [x] Security hardening — RLS write locks, admin action guards, HTTP security headers
- [x] Production deploy — Vercel · `quiniela2026.space` · Resend SMTP · custom domain DNS
- [x] Public leaderboard — `/leaderboard/public`, no auth required, live ranked standings
- [x] Picks comparison grid — side-by-side view of all users' predictions across all stages
- [x] EN/ES i18n — `next-intl` cookie-based locale, 480+ strings, full site coverage
- [x] PWA icons — custom favicon + Apple touch icon for iOS home screen
- [ ] Auto-pull match scores — scheduled Edge Function polling Football-Data.org free tier
- [ ] Onboard 25 users — magic link invites via admin panel (deadline: June 7, 2026)

See [plan.md](plan.md) for the full session-by-session breakdown.

---

## 📝 Changelog

- **Day 8** — Full EN/ES i18n via `next-intl` (cookie-based, 480+ strings, all user pages). Group-stage input hardening: leading-zero guard, live x/72 counter. Production deploy.
- **Day 7** — Picks comparison grid (5 stage tabs, search, score overlays). Leaderboard hardening: decoupled grid from scores table, admin client for score queries, edge-case guards.
- **Day 6** — Smarter 3rd-place qualifier UX (position-based eligibility). Toast/Toaster mount fix. Join request payment screen for waitlisted users. Admin lock fix.
- **Day 5** — Login redesign (animated stat pills, champion glow). Flag emojis everywhere. Live champion theming. Public leaderboard + mini-widget. PKCE auth restore, expired-link handling, React `cache()` dedup. PWA icons.
- **Day 4** — Production deploy, custom domain (`quiniela2026.space`), Resend SMTP, admin auth hardening via service-role pattern
- **Day 3** — Full prediction suite, Deno scoring engine, real-time leaderboard, dashboard, `/rules` page, loading skeletons, error boundaries
- **Day 2** — DB seeded (48 teams, 104 matches), magic link auth, layout shell, all 4 admin sections

See [CHANGELOG.md](CHANGELOG.md) for the full history.

---

## 📄 License

[MIT](LICENSE) © 2026 Sergio Barrientos

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) — App Router, Server Actions, and Middleware
- [Supabase](https://supabase.com) — Postgres, RLS, Auth, Realtime, and Edge Functions
- [shadcn/ui](https://ui.shadcn.com) — accessible component primitives
- [Vercel](https://vercel.com) — Fluid Compute hosting
- [Resend](https://resend.com) — transactional email and SMTP relay
