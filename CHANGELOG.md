# Quiniela 2026 — Changelog

---

## [Day 1] — 2026-05-24 (Phase 1: Foundation)

### Added
- **Next.js 16.2.6 / React 19** app scaffolded via `create-next-app`
- **Tailwind v4** + **shadcn/ui** configured (`components.json`, `postcss.config.mjs`)
- **shadcn/ui components** bootstrapped: `badge`, `button`, `card`, `dialog`, `input`, `select`, `sonner`, `table`
- **Supabase SSR client triple** — `src/lib/supabase/{client,server,middleware}.ts`
- **Invite-only middleware** — `middleware.ts` + session handler routing all non-static paths through Supabase auth
- **Full DB schema** — `supabase/migrations/001_initial_schema.sql`
  - 11 tables: `groups`, `teams`, `profiles`, `matches`, `pre_tournament_predictions`, `group_standing_predictions`, `third_place_qualifier_predictions`, `match_predictions`, `champion_rebuys`, `scores`, `audit_log`
  - Auto `updated_at` triggers on `match_predictions` + `pre_tournament_predictions`
  - Audit trigger on `scores` (insert-only integrity)
- **RLS policies** — `supabase/migrations/002_rls_policies.sql` (RLS enabled on all 11 tables; public read for reference data)
- **Project docs** — `CLAUDE.md`, `plan.md`, `.env.local.example`

### Updated
- `plan.md` — Day 1 checkboxes marked complete; day summary note added

### Pending (Days 2–3)
- [ ] Create Supabase project (prod) + apply migrations remotely
- [ ] Seed 48 teams + 12 groups
- [ ] Seed 104 matches (`scheduled_at`, `locked_at`, `stage_multiplier`)
- [ ] Magic link auth flow (Supabase Auth UI or custom)
- [ ] App layout: nav shell, dark mode toggle, route groups `(auth)` / `(admin)` / `(public)`

### Lessons Learned
- Next 16 ships with React 19 by default — no version conflicts with `@supabase/ssr ^0.10`
- Tailwind v4 uses `@tailwindcss/postcss` plugin, NOT the legacy `tailwind.config.js` setup
- `@supabase/ssr` replaces `@supabase/auth-helpers-nextjs` — use `createBrowserClient` / `createServerClient`

---

## [Day 2] — 2026-05-25 (Phase 1 Complete + Phase 2 Complete)

### Added
- **Supabase project** provisioned (prod) — migrations applied via SQL Editor dashboard
- **Seed data** — `supabase/seed/001_seed_data.sql`: 12 groups, 48 teams, 104 matches (72 group + 32 knockout) with UTC kickoffs and `locked_at = scheduled_at - 1h`
- **Magic link auth** — custom form at `/login` (shadcn Input/Button, client-side `signInWithOtp`)
- **Auth callback** — `/auth/callback/route.ts` exchanges PKCE code for session, redirects to `/dashboard`
- **Root layout** — `ThemeProvider` (next-themes, dark default), global `<Nav />`, metadata updated
- **Nav** — server component with user email, `ThemeToggle`, `SignOutButton` client components
- **Admin client** — `src/lib/supabase/admin.ts` using service-role key for `auth.admin.*` operations
- **Admin layout** — sidebar nav (`AdminNav`) linking to all 4 admin sections
- **`/admin/users`** — list all users, invite by email+name, toggle paid/admin, remove; uses `auth.admin.inviteUserByEmail`
- **`/admin/matches`** — tabbed by stage (Group→Final), inline score inputs, status cycle, upset flag; server actions
- **`/admin/locks`** — per-stage lock/unlock cards with confirmation dialog; resets `locked_at` to `scheduled_at - 1h`
- **`/admin/audit`** — paginated (50/page) insert-only log with collapsible JSON new_value viewer
- **shadcn/ui `tabs`** component added

### Updated
- `middleware.ts` — `/auth/*` added to public paths so callback route is reachable unauthenticated
- `plan.md` — Phase 1 + Phase 2 milestones marked complete

### Lessons Learned
- `createBrowserClient` at component root triggers SSR pre-render failure — always instantiate inside event handlers for client components
- `@base-ui/react` (used by this shadcn install) does NOT support `asChild` or Radix-style `DialogTrigger asChild` — use manual `open` state instead
- Supabase joined relations (`.select('team:teams!fk(...)')`) are inferred as arrays by TS — cast via `as unknown as T` at usage sites
- `NEXT_PUBLIC_SITE_URL` must be set in `.env.local` for magic link `emailRedirectTo` to work in dev

---

## [Day 3] — 2026-05-25 (Phase 3 Complete + Phase 4 Complete + Phase 5 Partial)

### Added
- **Phase 3: Prediction UX** — full prediction suite shipped
  - `/predictions/pre-tournament`: trophy picks, awards, group standings A–L, 3rd-place qualifiers (3 tabs, per-section save)
  - `/predictions/group-stage`: 72 match inputs paginated by group, auto-save on blur, per-row status dots
  - `/predictions/[stage]`: reusable knockout page for r32/r16/qf/sf/3rd/final; TBD-team safe
  - `/predictions/rebuy`: locked until scoring engine unlocks; submit is permanent
  - `/predictions/receipt`: full print-to-PDF snapshot with print CSS hiding nav/button
  - Predictions sub-nav (10 links, active state)
  - `lib/utils/lock.ts`: `isMatchLocked` + `isPreTournamentLocked`
  - `lib/scoring/defaults.ts`: 0-0 missing prediction default, home-wins tiebreaker, points constants
- **Phase 4: Scoring Engine + Leaderboard**
  - `compute-scores` Supabase Edge Function (Deno): match/group/pre-tournament/rebuy scoring in single invocation
  - `/leaderboard`: top-3 podium, per-user rank card, Realtime subscription for live updates
  - `/dashboard`: total pts breakdown, champion pick, rebuy status, prediction fill progress (X/104)
  - `/admin/scoring`: manual recompute trigger, tournament results form, rebuy unlock by user
  - Team meta: flag emojis + hex colors for all 48 teams
  - Champion-themed UI: CSS vars set server-side from user champion pick (no flash on load)
  - Auto-recompute scores (non-blocking) on match save
  - Migration 003: `tournament_results` table + `winner_team_id` column
- **Phase 5 (Partial): Hardening + UX Polish**
  - Global error boundary (`error.tsx`) with retry button
  - 404 not-found page
  - Loading skeletons for dashboard, leaderboard, predictions, and all admin sections
  - Admin sidebar responsive: collapses to horizontal scrollable nav on mobile (< lg)
  - Admin matches table: `overflow-x-auto` wrapper for 7-column mobile scroll
  - `/rules` page: match scoring, stage multipliers, pre-tournament picks, group standings, FAQ
  - Rules link added to main nav
- **Auth/Nav Improvements**
  - Dedicated `/admin-login` page (iterated: OTP → reverted to magic link)
  - Smart callback redirect based on `profile.is_admin` — admins → `/admin`, users → `/dashboard`
  - Admin tab in `<Nav />` — visible only when `is_admin = true`
  - Root `page.tsx` replaced with `redirect('/dashboard')` — middleware handles unauthenticated cases
  - Sign-out via server action (eliminates race condition with SSR cookies)

### Fixed
- Admin route guard hardened in middleware (`is_admin` check before allowing `/admin/*`)
- `emailRedirectTo` now uses `NEXT_PUBLIC_SITE_URL` instead of `window.location.origin` (avoids `www` variant mismatch)
- Nav uses shared `createClient` for consistent session reads across components
- Auto-recompute on match save: `type:'matches'` → `type:'all'` (was zeroing pre-tournament points)
- `togglePaid`/`toggleAdmin`: `UPDATE` → `upsert` (profiles only exist after first login; admin may toggle before user has ever signed in)
- Leaderboard champion flags: replaced broken PostgREST join with separate query (RLS-safe, handles pre-lock)
- Dashboard `entry_paid` warning: guarded with `profile !== null` check
- Dashboard profiles query: `.single()` → `.maybeSingle()` (avoids logged errors when row is absent)
- Edge Function: early return when no profiles exist (avoids empty upsert error)

### Lessons Learned
- PostgREST joined relations on pre-lock data fail RLS silently — query champion picks separately and merge in JS
- Server action sign-out eliminates cookie/SSR race; `router.push` after `signOut()` can race with middleware reads
- `window.location.origin` returns the `www` variant — always use `NEXT_PUBLIC_SITE_URL` for `emailRedirectTo`
- OTP adds friction for a family/friends audience; magic links were the right default
- Use `upsert` over `update` for profile row toggles — profiles are only created on first login

---

## Session Log: 2026-05-25

### Major Lessons Learned Today

| | Approach |
|---|---|
| **Incorrect** | Running `find`/`ls` directory scans at session start to understand project state |
| **Correct** | Read `plan.md` + `CHANGELOG.md` first — they are the canonical source of truth for what files exist, what's complete, and what's pending |
| **Why** | Directory scans waste tokens and hit usage limits; the plan and changelog already contain the full project inventory and status |
