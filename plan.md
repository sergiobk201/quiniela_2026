# Quiniela 2026 — Project Plan

## Objective
Ship a full-stack World Cup prediction app for ~25 family/friends by June 4, 2026.
Users submit pre-tournament + match predictions. Scoring is automated. Leaderboard is live.

## Timeline
| Phase | Days     | Focus                        |
|-------|----------|------------------------------|
| 1     | Days 1–3 | Foundation (infra + auth)    |
| 2     | Days 4–7 | Admin panel                  |
| 3     | Days 8–12| Prediction UX                |
| 4     | Days 13–15| Scoring engine + leaderboard|
| 5     | Days 16–17| Hardening + deploy          |
| 6     | Day 18   | Onboarding 25 users          |

---

## Roadmap

### Phase 1 — Foundation (Days 1–3) ✅ COMPLETE
> **Day 1 (2026-05-24):** Project scaffolded. Next.js + Supabase + Tailwind + shadcn wired up. Schema + RLS migrations written. Middleware skeleton in place.
> **Day 2 (2026-05-25):** Supabase prod project created. DB seeded (48 teams, 104 matches). Auth flow + layout shell complete.

- [x] Create Supabase project (prod) — provisioned via dashboard, migrations applied via SQL Editor
- [x] Run schema migrations (all tables from blueprint) — `supabase/migrations/001_initial_schema.sql`
- [x] Enable RLS + add all policies — `supabase/migrations/002_rls_policies.sql`
- [x] Seed 48 teams + 12 groups — `supabase/seed/001_seed_data.sql`
- [x] Seed 104 matches with scheduled_at + locked_at + stage_multiplier — same seed file
- [x] Init Next.js 14 app (`npx create-next-app@latest`) — Next 16.2.6 / React 19
- [x] Install + configure Tailwind, shadcn/ui — Tailwind v4 + shadcn components bootstrapped
- [x] Install Supabase JS client, generate types — `@supabase/ssr` + `@supabase/supabase-js`
- [x] Supabase Auth: magic link flow — custom form at `/login`, callback at `/auth/callback`
- [x] Invite-only middleware — `/auth/*` public, all other paths gated
- [x] Basic layout: nav, shell, dark mode toggle — `ThemeProvider` + `Nav` in root layout

### Phase 2 — Admin Panel (Days 4–7) ✅ COMPLETE
> **Day 2 (2026-05-25):** All 4 admin sections built and passing build.

- [x] `/admin` — protected route (is_admin check in middleware) → redirects to `/admin/users`
- [x] `/admin/matches` — tabbed by stage, inline score entry, status cycle, upset flag
- [x] `/admin/locks` — per-stage lock/unlock with confirmation dialog, reset to original times
- [x] `/admin/users` — invite users, toggle paid/admin, remove; flexible user count
- [x] `/admin/audit` — paginated (50/page) insert-only log viewer

### Phase 3 — Prediction UX (Days 8–12) ✅ COMPLETE
> **Day 3 (2026-05-25):** Full prediction suite shipped — pre-tournament, group stage, knockout, rebuy, and receipt pages.

- [x] `/predictions/pre-tournament` — champion, runner-up, 3rd, awards, group standings (A–L), 3rd-place qualifiers
- [x] `/predictions/group-stage` — 72 match score inputs, paginated by group, auto-save on blur
- [x] `/predictions/rebuy` — champion rebuy form (locked until scoring engine unlocks; submit is permanent)
- [x] `/predictions/[stage]` — reusable knockout round prediction page (r32/r16/qf/sf/3rd/final; TBD-team safe)
- [x] Form locking: disable inputs when `locked_at < now()` — `lib/utils/lock.ts`
- [x] Optimistic UI updates + save indicators — per-row status dots, auto-save on blur
- [x] **PDF prediction receipt** — `/predictions/receipt` print-to-PDF snapshot with print CSS (`@react-pdf/renderer`)

### Phase 4 — Scoring Engine + Leaderboard (Days 13–15) ✅ COMPLETE
> **Day 3 (2026-05-25):** All scoring infrastructure built, Edge Function deployed.

- [x] Supabase Edge Function: `compute-scores` (match points) — `supabase/functions/compute-scores/`
- [x] Edge Function: group standings scoring — same function, `type: 'standings'`
- [x] Edge Function: pre-tournament scoring — same function, `type: 'pre-tournament'`
- [x] Edge Function: rebuy scoring — same function, `type: 'rebuy'`
- [x] Admin trigger: "recompute scores" button — `/admin/scoring`
- [x] `/leaderboard` — ranked table, top-3 podium, Realtime subscription
- [x] `/dashboard` — user score breakdown, champion pick, prediction fill progress

### Phase 5 — Hardening + Deploy (Days 16–17)
- [ ] RLS policy audit: attempt cross-user data access in test env
- [ ] Lock time edge case tests (UTC, timezone-naive clients)
- [x] Mobile responsiveness pass — admin sidebar collapses to scrollable nav on mobile; matches table `overflow-x-auto`
- [x] Error boundaries + loading states — `error.tsx`, 404 page, loading skeletons for all sections
- [ ] Deploy to Vercel (connect Supabase prod env vars)
- [ ] Smoke test: full user flow end-to-end

### Phase 6 — Onboarding (Day 18)
- [ ] Send magic link invites to 25 users via Resend
- [x] `/rules` page: scoring rules, deadlines, FAQ — shipped in Phase 5 hardening pass
- [ ] Schedule deadline reminder email (June 3 — 1 day before lock)
- [ ] README

### Phase 7 — Automations & UX Polish (Nice to Haves)
> These require no paid services — all free-tier solutions.

- [ ] **Auto-pull match scores** — scheduled Edge Function polls Football-Data.org (free tier: 10 req/min) every 5 min during match windows; auto-marks matches `finished` and triggers recompute
- [ ] **Champion-themed UI** — color accent variables from champion flag hex already wired; extend to buttons, nav active states, and score highlights *(infrastructure done — needs CSS wiring)*
- [ ] **Flag emoji on all team mentions** — add to team selects in pre-tournament form, group-stage rows, knockout rows, receipt *(mapping built — needs component-level integration)*
- [ ] **Leaderboard mini-widget** — floating card on `/dashboard` showing top 3 + user rank without leaving the page *(top-3 podium on `/leaderboard` already done)*
- [ ] **Reminder push** — Resend email blast June 3 to all users who have incomplete predictions (< 104 match predictions submitted)
- [ ] **Public read-only leaderboard** — shareable `/leaderboard/public` URL, no auth required, names only (no score breakdown)

---

## Key Dates
| Date       | Event                                     |
|------------|-------------------------------------------|
| 2026-05-24 | Project start                             |
| 2026-06-04 | **PRE-TOURNAMENT SHEET LOCK (HARD)**      |
| 2026-06-11 | FIFA World Cup 2026 kickoff               |
| 2026-07-19 | World Cup Final                           |
