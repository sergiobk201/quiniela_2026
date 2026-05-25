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

## Session Log: 2026-05-25 (Session 1 — Foundations Bootstrap)

### Major Lessons Learned Today

| | Approach |
|---|---|
| **Incorrect** | Running `find`/`ls` directory scans at session start to understand project state |
| **Correct** | Read `plan.md` + `CHANGELOG.md` first — they are the canonical source of truth for what files exist, what's complete, and what's pending |
| **Why** | Directory scans waste tokens and hit usage limits; the plan and changelog already contain the full project inventory and status |

---

## [Day 4] — 2026-05-25 (Phase 5: Deploy + Auth Hardening)

### Deployed
- **Production**: `https://www.quiniela2026.space` — Vercel + Supabase prod connected
- **Custom domain**: `quiniela2026.space` registered on Namecheap; CNAME added to Vercel; DNS verified
- **Resend SMTP**: `smtp.resend.com:465` configured as Supabase custom SMTP; `quiniela2026.space` domain verified in Resend (4 DNS records: SPF, DKIM ×2, DMARC)

### Fixed
- **Admin detection broken in production** — root cause: recursive RLS policy on `profiles` table (`"Admin reads all profiles"` uses `EXISTS (SELECT 1 FROM profiles WHERE is_admin = true)` — self-referential, returns null for all clients except service-role). Fixed by using `createAdminClient()` (service-role key) in both `nav.tsx` and `middleware.ts` for all `is_admin` reads.
- **`emailRedirectTo` www-mismatch** — `window.location.origin` returned `https://www.quiniela2026.space` which did NOT match Supabase's allowlist entry `https://quiniela2026.space`. Fixed: use `NEXT_PUBLIC_SITE_URL` env var (always non-www).
- **Supabase built-in SMTP rate limit** — 3 emails/hour cap, unextendable. Fixed: Resend SMTP via custom SMTP settings in Supabase Auth.
- **Invite-only enforcement** — `shouldCreateUser: false` added to `signInWithOtp` options; unknown emails now get a neutral "check your email / contact admin" message.

### Removed
- `src/app/(auth)/admin-login/page.tsx` — deleted; admins use the same `/login` page
- `src/app/auth/admin-callback/route.ts` — deleted; one callback route handles all users

### Architecture Decisions
- **Single login page for all users** — admin privilege is purely database-driven (`is_admin = true`), not a separate login path
- **Service-role client for `is_admin` checks** — never use anon client for admin detection; RLS policies on `profiles` are recursive and will silently return null
- **Admin nav tab** — `<NavLinks isAdmin={isAdmin} />` receives the flag from the server component; client never re-checks

### Lessons Learned
- **Recursive RLS is a silent failure** — if a policy on table `X` uses a subquery that reads table `X`, it will deadlock itself; only service-role bypasses this
- **`window.location.origin` is unreliable** — in production it returns whatever variant the browser navigated to (www vs non-www); always use an env var for `emailRedirectTo`
- **Email pre-fetching kills magic links** — production email security scanners follow links, consuming the one-time PKCE token before the user clicks; PKCE is resistant but not immune — domain reputation matters
- **Supabase custom SMTP** — built-in SMTP is dev-only (3/hr); Resend is the correct free-tier fix for production
- **Admin bootstrap** — no auto-trigger creates `profiles` rows on `auth.users` insert; admin must manually INSERT the first profile row via SQL Editor
- **OTP (6-digit code) backfired** — Supabase email template overrides require custom SMTP + template edits; simpler to keep magic links and fix the root `emailRedirectTo` issue

## Session Log: 2026-05-25 (Session 2 — Deploy + Admin Auth Hardening)

### Summary
Spent the session fighting a subtle 3-way bug: recursive RLS + www/non-www mismatch + Supabase SMTP rate limit. All three were masking each other and causing admin login to fail in production (not reproducible in dev). Resolved by adopting the service-role pattern consistently and fixing the env var. Custom domain fully wired. App is live and the admin tab works correctly.

---

## [Day 5] — 2026-05-25 (Phase 5 Complete + Phase 7 UI Polish)

### Completed

**Phase 5 — Security Hardening (previously partial)**
- **RLS write-lock enforcement** (`supabase/migrations/004_rls_write_locks.sql`): replaced `FOR ALL` policies with explicit INSERT/UPDATE/DELETE on `match_predictions`, `pre_tournament_predictions`, `group_standing_predictions`, `third_place_qualifier_predictions`. Post-lock writes now blocked at DB level — 3-layer defense: UI → server action → RLS.
- **Server action auth guards** (`src/lib/supabase/assert-admin.ts`): `assertAdmin()` helper added to all 13 admin server actions across users, matches, locks, and scoring. Pattern: session client for getUser → service-role client for is_admin check.
- **HTTP security headers** (`next.config.ts`): X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy.
- **Client-trusted lockedAt bypass fixed**: `saveMatchPrediction` previously accepted `lockedAt` as a client param. Now fetches `locked_at` server-side from DB.
- **Portfolio README** (`README.md`): architecture section, scoring table, quick start, env vars table, roadmap pulled from `plan.md`.

**Phase 7 — UI Polish (Nice-to-Haves, shipped)**
- **Football-themed color palette** (`src/app/globals.css`): emerald primary + amber accent in both light and dark modes (oklch). CSS vars `--champion-primary` / `--champion-secondary` added with WC green/gold fallbacks.
- **Champion-themed dynamic UI**: `ChampionTheme` component applies team hex colors as CSS vars server-side on load (no flash). Luminance clamping (`clamp()`) for dark/light mode adaptation — too-dark colors lifted +160 RGB in dark mode; too-light darkened to 40% in light mode.
- **Live champion color update**: pre-tournament form and rebuy form dispatch `champion-changed` CustomEvent on team select — CSS vars update instantly without waiting for save.
- **Flag emojis everywhere**: `getFlag()` wired into pre-tournament form (trophy fields + TeamSelect options), group-stage form, knockout form, rebuy form/page (with `originalChampionCode`), receipt page (all team references, group standings, 3rd-place qualifiers), admin match-row, dashboard rebuy card, leaderboard table.
- **Nav**: sticky + backdrop blur + champion-gradient logo text.
- **Leaderboard**: current user row uses `color-mix(oklch, --champion-primary 10%)` background + left border accent; champion flag emoji shown before each player's display name.
- **Dashboard**: champion-colored score card top border + progress bar; champion flag next to pick; rebuy team flag on submitted rebuy card.

### Plan Updates
- Phase 5 ✅ fully complete (RLS write-locks + action guards close the remaining open items)
- Phase 7 items marked shipped:
  - Champion-themed UI ✅
  - Flag emoji on all team mentions ✅

### Deployed
- `vercel --prod` → live at `https://www.quiniela2026.space`
- Build: 17 routes, TypeScript clean, 0 errors

### Lessons Learned
- `clamp()` for luminance-adaptive hex: compute relative luminance (0.2126R + 0.7152G + 0.0722B) / 255 — lift dark colors by +160 RGB in dark mode, darken light by ×0.4 in light mode
- `CustomEvent` on `window` is the clean pattern for cross-component theme updates in Next.js App Router without lifting state to a context provider
- PostgREST joined relation queries must include `code` explicitly — `select('name')` silently drops other columns

### Remaining — Phase 6 (Onboarding)
- [ ] Send magic link invites to 25 users via Resend
- [ ] Schedule deadline reminder email (June 3)
- [ ] README TODO slots — add screenshots

## Session Log: 2026-05-25 (Session 3 — Security Hardening + UI Polish)

### Summary
Full Phase 5 security hardening (RLS write-locks, server action guards, HTTP headers, server-side lock validation). Portfolio README written. Full UI overhaul: football color palette, live champion theming with luminance clamping, flag emojis on every team reference across all pages. Deployed to production. App is visually complete and production-hardened.
