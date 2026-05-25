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

### Phase 1 — Foundation (Days 1–3)
> **Day 1 (2026-05-24):** Project scaffolded. Next.js + Supabase + Tailwind + shadcn wired up. Schema + RLS migrations written. Middleware skeleton in place.

- [ ] Create Supabase project (prod)
- [x] Run schema migrations (all tables from blueprint) — `supabase/migrations/001_initial_schema.sql`
- [x] Enable RLS + add all policies — `supabase/migrations/002_rls_policies.sql`
- [ ] Seed 48 teams + 12 groups
- [ ] Seed 104 matches with scheduled_at + locked_at + stage_multiplier
- [x] Init Next.js 14 app (`npx create-next-app@latest`) — Next 16.2.6 / React 19
- [x] Install + configure Tailwind, shadcn/ui — Tailwind v4 + shadcn components bootstrapped
- [x] Install Supabase JS client, generate types — `@supabase/ssr` + `@supabase/supabase-js` installed; `src/lib/supabase/{client,server,middleware}.ts` scaffolded
- [ ] Supabase Auth: magic link flow
- [x] Invite-only middleware (block unauthenticated + non-invited) — `middleware.ts` + `src/lib/supabase/middleware.ts` session handler
- [ ] Basic layout: nav, shell, dark mode toggle

### Phase 2 — Admin Panel (Days 4–7)
- [ ] `/admin` — protected route (is_admin check)
- [ ] `/admin/matches` — enter home/away scores, mark finished, flag upsets
- [ ] `/admin/locks` — toggle round lock state with confirmation dialog
- [ ] `/admin/users` — create accounts, send Resend invite email, mark entry_paid
- [ ] `/admin/audit` — paginated audit log viewer

### Phase 3 — Prediction UX (Days 8–12)
- [ ] `/predictions/pre-tournament` — champion, runner-up, 3rd, awards, group standings (A–L), 3rd-place qualifiers
- [ ] `/predictions/group-stage` — 72 match score inputs, paginated by group
- [ ] `/predictions/rebuy` — champion rebuy form (only visible when eligible)
- [ ] `/predictions/[stage]` — reusable knockout round prediction page
- [ ] Form locking: disable inputs when `locked_at < now()`
- [ ] Optimistic UI updates + save indicators

### Phase 4 — Scoring Engine + Leaderboard (Days 13–15)
- [ ] Supabase Edge Function: `compute-scores` (match points)
- [ ] Edge Function: group standings scoring
- [ ] Edge Function: pre-tournament scoring (runs at tournament end)
- [ ] Edge Function: rebuy scoring
- [ ] Admin trigger: "recompute scores" button
- [ ] `/leaderboard` — ranked table, Supabase Realtime subscription
- [ ] `/dashboard` — user's own points breakdown by category

### Phase 5 — Hardening + Deploy (Days 16–17)
- [ ] RLS policy audit: attempt cross-user data access in test env
- [ ] Lock time edge case tests (UTC, timezone-naive clients)
- [ ] Mobile responsiveness pass (all pages)
- [ ] Error boundaries + loading states
- [ ] Deploy to Vercel (connect Supabase prod env vars)
- [ ] Smoke test: full user flow end-to-end

### Phase 6 — Onboarding (Day 18)
- [ ] Send magic link invites to 25 users via Resend
- [ ] `/rules` page: scoring rules, deadlines, FAQ
- [ ] Schedule deadline reminder email (June 3 — 1 day before lock)
- [ ] README

---

## Key Dates
| Date       | Event                                     |
|------------|-------------------------------------------|
| 2026-05-24 | Project start                             |
| 2026-06-04 | **PRE-TOURNAMENT SHEET LOCK (HARD)**      |
| 2026-06-11 | FIFA World Cup 2026 kickoff               |
| 2026-07-19 | World Cup Final                           |
