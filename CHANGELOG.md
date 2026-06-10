# Quiniela 2026 — Changelog

---

## [Day 15] — 2026-06-09 (Community Bets + Security Hardening)

### Shipped

**Feat: Community bet picks — scored prediction inputs**
- New "Your Picks" card at the top of the Pre-Tournament tab on `/community-bets`
- 3 voted bets live: Balón de Oro (5pts · Expert), Selección Revelación (2pts · Medium), Selección Decepción (3pts · Hard)
- Picks stored in `pre_tournament_predictions` (3 new columns via migration 012)
- Lock: 1 hour before the first WC match on June 11 (`MIN(locked_at WHERE stage='group')`)
- Save action uses service-role to bypass June 7 trophy RLS lock; application-layer lock enforces June 11 deadline
- Full EN/ES i18n for picks card
- `src/app/community-bets/page.tsx` — fetches teams, existing picks, lock time
- `src/app/community-bets/community-bets-client.tsx` — picks card rendered above vote list
- `src/app/community-bets/actions.ts` — `saveCommunityBets` with admin client + lock check
- `src/lib/utils/lock.ts` — `getFirstGroupMatchLockTime` + `isCommunityBetsLocked`

**Feat: Community bet scoring**
- Edge function `compute-scores` scores community bets against admin-entered answers
- `PRE_TOURNAMENT_PTS`: `communityBalonDeOro: 5`, `communityRevelacion: 2`, `communityDecepcion: 3`
- Fires only when admin has entered answers in `tournament_results`
- `supabase/functions/compute-scores/index.ts` updated

**Feat: Admin scoring — Community Bet Answers section**
- New "Community Bet Answers" block on `/admin/scoring` Tournament Results form
- 3 inputs: Balón de Oro (text), Selección Revelación (team select), Selección Decepción (team select)
- `saveTournamentResults` action extended with 3 new fields

**Feat: Rules page updated**
- New "Pre-Tournament Phase — Active Bets" sub-table with all 3 bets and green point values
- FAQ #6 corrected — now says community bets DO score automatically after admin recompute
- Both EN and ES updated

**Fix: Supabase security lints — `audit_log_readable`**
- Migration 011: `WITH (security_invoker = true)` + `REVOKE SELECT FROM anon, authenticated`
- Resolves `auth_users_exposed` and `security_definer_view` lints
- Admin audit page unaffected (service-role client bypasses both)

### Commits
- `da1b828` feat(community-bets): add voted picks + scoring
- `3ff0b98` fix(community-bets): bypass RLS for community bet saves

### Lessons Learned
- RLS date-lock policies block ALL writes past the lock date — including new columns added after the lock fired. Use service-role + application-layer lock check for any prediction type with a different deadline than the original table lock.
- PostgREST upsert with `onConflict` only updates the columns in the payload — omitted columns are never nulled out. Safe to partial-upsert new columns without touching existing picks.
- Supabase security linter flags views that join `auth.users` as `security_definer` even without the explicit keyword — the view owner's permissions are used by default. Fix: `WITH (security_invoker = true)` + revoke from anon.

---

## [Day 14] — 2026-06-06 (Go-Live + Mobile Nav + Scope Cleanup)

### 🚀 Project is live — quiniela2026.space

All phases complete. 25 users onboarded. Pre-tournament lock fires June 7. WC kickoff June 11. Entering maintenance mode — fix bugs as they appear, enter scores manually via `/admin/matches` after each match.

### Shipped

**Feat: Mobile bottom tab bar**
- `src/components/bottom-nav.tsx` — new client component, `sm:hidden`, fixed to bottom of viewport
- Icons via lucide-react: Home, ClipboardList, Dices, Trophy, BookOpen, Settings (admin only)
- Active tab highlighted with `var(--champion-primary)` — matches top nav and header border
- `src/components/nav.tsx` — imports and renders `<BottomNav isAdmin={isAdmin} />` below the header, inside a Fragment; only rendered when user is authenticated
- `src/app/layout.tsx` — `pb-16 sm:pb-0` on body prevents content from hiding behind the fixed bar on mobile; desktop unaffected

### Dropped

**Auto-score pull (Football-Data.org)**
- Investigated API — WC 2026 data live, 104 matches, TLA codes match seed, API works
- Decision: manual score entry sufficient for 25 users; automation adds complexity with no UX gain at this scale
- API key kept in `.env.local` + Vercel env vars in case revisited mid-tournament

**Item 4 Phase 2 — Bracket prediction page**
- Pre-tournament lock (June 7) made timeline infeasible
- Users already filling picks directly; no scoring impact from dropping it

### Remaining
- [ ] README screenshots — portfolio polish only

### Commits
- `aa8e532` feat(nav): add mobile bottom tab bar

---

## [Day 13] — 2026-06-05 (Lock Split + Font Fix + Full Audit Logging)

### Shipped

**Fix: Scored vs Fun Bets clarity**
- Pre-tournament form Tab 1 split into two distinct cards:
  - "Scored Special Picks" — Total Goals, First Eliminated, Most Yellows (green pt badges on labels)
  - "Fun Bets" — 6 honor-only bets with corrected subtitle ("No points — just for fun")
- Rules page was already correct; only the form needed the split
- `messages/en.json` + `es.json` updated: `scoredPicks`, `scoredPicksSub`, corrected `funBetsSub`

**Feat: Split pre-tournament lock (trophy vs group stage)**
- Trophy picks now lock on June 7 (date-based `isPreTournamentLocked()`) — unchanged
- Group standings + 3rd-place qualifiers now lock dynamically after the last group stage match (`MAX(locked_at) WHERE stage = 'group'` ≈ June 28 01:00 UTC)
- `src/lib/utils/lock.ts` — added `getGroupStageLockTime(supabase)` + `isGroupStageLocked(lockTime)`
- `src/app/predictions/pre-tournament/actions.ts` — `saveGroupStandings` + `saveThirdPlaceQualifiers` use `checkGroupStageLocked()`; `saveTrophyAndAwards` unchanged
- `src/app/predictions/pre-tournament/page.tsx` — fetches group stage lock time as 8th parallel query; passes `trophyLocked` + `groupStageLocked` as separate props
- `src/app/predictions/pre-tournament/pre-tournament-form.tsx` — replaced single `locked` prop with `trophyLocked` + `groupStageLocked`; Tab 1 gates on `trophyLocked`, Tabs 2–3 gate on `groupStageLocked`
- `supabase/migrations/009_group_stage_standings_lock.sql` — drops hardcoded June 7 RLS policies on `group_standing_predictions` + `third_place_qualifier_predictions`; replaces with dynamic `NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')`. Applied manually via Supabase SQL Editor (CLI push skipped — migrations 001–008 not tracked by CLI)
- Syncing from match picks continues to work throughout the group stage unaffected

**Fix: Times New Roman font (CSS variable circular reference)**
- `src/app/globals.css` line 10 had `--font-sans: var(--font-sans)` — a self-referencing circular variable causing browser to fall back to system serif (Times New Roman)
- Fixed to `--font-sans: var(--font-geist-sans)` — Geist was already loaded via `next/font/google` in `layout.tsx`, just not wired into the CSS variable

**Feat: Full audit logging for all user actions**
- New helper `src/lib/supabase/audit.ts` — `logAudit()` writes to `audit_log` with `ip_address` + `user_agent` from request headers; fails silently to never block the main save
- Wired into all user-facing server actions:
  - `saveTrophyAndAwards` — logs `trophy_saved` (with before/after) or `trophy_save_blocked_locked`
  - `saveGroupStandings` — logs `group_standings_saved` or `group_standings_save_blocked_locked`
  - `saveThirdPlaceQualifiers` — logs `qualifiers_saved` or `qualifiers_save_blocked_locked`
  - `saveMatchPrediction` (both `[stage]` + `group-stage`) — logs `match_prediction_saved` or `match_prediction_save_blocked_locked`
  - `submitRebuy` — logs `rebuy_submitted`
- Wired into admin lock actions: `stage_locked`, `stage_unlocked`, `pre_tournament_locked`, `pre_tournament_unlocked`
- `supabase/migrations/010_audit_log_view.sql` — `audit_log_readable` view joins `auth.users` (email) + `profiles` (display_name) for human-readable investigations
- Applied migration 010 manually via Supabase SQL Editor

### Commits
- `9235f12` fix(predictions): split scored bets from fun bets
- `8e95b6d` feat(predictions): split trophy and standings locks
- `740d213` fix(ui): wire Geist font CSS variable correctly
- `b5681f0` feat(audit): log all user prediction saves and lock-blocked attempts

### Not Deployed
- All 4 commits are committed locally and ahead of origin. Awaiting `git push` + `vercel --prod`.

### Lessons Learned
- CSS custom properties are NOT recursive-safe — `--font-sans: var(--font-sans)` silently resolves to `initial` (empty), causing the browser to fall back to the system serif stack. Always reference a different variable or a literal value.
- Vercel free tier retains logs for only 1 hour — useless for mid-tournament disputes. Supabase `audit_log` (persistent Postgres) is the correct audit layer.
- `auth.users` holds the email; `profiles` holds `display_name` — both needed for readable audit investigations. The `audit_log_readable` view joins both so investigation queries stay simple.
- Supabase CLI `db push --linked` fails when prior migrations were applied via dashboard (not tracked in `supabase/migrations` history). For this project: always apply new migrations manually via SQL Editor.

---

## [Day 12] — 2026-06-01 (Phase 8: Bracket-Half Validation)

### Shipped

**Item 4 Phase 1 — Bracket-half trophy pick validation**
- `src/lib/scoring/validate-trophy.ts` — added `same_bracket_half` conflict type
- Added `BRACKET_HALF` map hardcoded from official 2026 FIFA World Cup knockout bracket (source: Wikipedia — 2026 FIFA World Cup knockout stage, R32 match schedule M73–M88)
- Key finding: 10 of 12 groups have both 1st and 2nd place in the **same** bracket half; only Groups B and L are split across halves
- Alert fires when champion + runner-up are both predicted 1st/2nd in groups that land on the same SF path → they can meet at most in the semi-final, not the Final
- 3rd-place qualifiers intentionally excluded from bracket-half check — their slots are conditional on which 8 groups advance, cannot be mapped statically
- `getGroupHalf()` uses `.slice(-1).toUpperCase()` to safely handle both "A" and "Group A" name formats
- No UI changes needed — existing amber warning card renders `w.message` generically

### Lessons Learned
- **FIFA 2026 bracket is NOT symmetrical by group**: unlike prior 32-team World Cups where group rivals were always split to opposite halves, the new 48-team / 12-group format puts 10 of 12 groups' 1st + 2nd on the same bracket side. Only Groups B (1B Half 2, 2B Half 1) and L (1L Half 1, 2L Half 2) are split.
- **Same-group champion + runner-up is bracket-impossible for 10 groups** — this is a strong validation constraint that users would not intuitively know.
- **3rd place does NOT create bracket impossibility** — the 3rd place finisher just needs to lose their SF (which can happen to any team), so no cross-check needed between 3rd and champion/runner-up.
- **Bracket half check fires during pre-tournament phase** — the validator runs against the user's group standing predictions (not actual results), so the warning is live today, before the June 7 lock.

### Commits
- `973fa79` feat(validation): add bracket-half conflict check for trophy picks

### Deployed
- `vercel --prod` → `https://www.quiniela2026.space`
- Build: 23 routes, TypeScript clean, 0 errors

### Plan.md Sync
- Checked off Items 1A, 1B, 2A, 2B, 3, 4P1 in Phase 8 roadmap (all were done in prior sessions, plan not updated)

### Remaining Before June 7 Lock
- [ ] Reminder email blast — Resend query for users with < 104 match predictions, send June 6
- [ ] Item 4 Phase 2 — Full bracket prediction page (post-lock, nice to have)

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

---

## [Day 6] — 2026-05-26 (Phase 5.5 E2E Testing + Phase 7 Quick Wins)

### Completed

**Phase 5.5 — E2E Battle Testing (partial)**
- **Login & Auth** — 14/14 ✅ all checks passed on prod
- **Nav & Global UI** — 8/8 ✅ all checks passed on prod
- Remaining sections (Pre-Tournament, Group Stage, Knockout, Rebuy, Receipt, Leaderboard, Dashboard, Admin, Security) deferred to next session

**Phase 7 — Quick Wins (both shipped)**
- **Leaderboard mini-widget** (`src/components/leaderboard/mini-widget.tsx`) — embedded card on `/dashboard` below Predictions; shows top 3 with medals + champion flags; dashed divider + "your rank" row when user is outside top 3; champion-color highlight on current user row
- **Public leaderboard** (`/leaderboard/public`) — shareable, no auth required; service-role client bypasses RLS; ranked table with champion flags; copy-link button; sign-in CTA

### Fixed
- **`?error=auth` on login page** — expired/consumed magic links now show a red banner instead of a blank form (`useSearchParams` + Suspense wrapper)
- **iOS home screen icon** — added `src/app/apple-icon.png` (Next.js App Router `apple-touch-icon` convention)
- **Leaderboard & mini-widget RLS bug** — `profiles` FK join via anon client silently returned null due to RLS; switched both to `createAdminClient()` (server-side only, safe)
- **Vercel build failure** — `useSearchParams()` without Suspense boundary caused static prerender to crash; fixed by wrapping `LoginContent` in `<Suspense>`

### Lessons Learned
- PostgREST FK embeds (`profile:profiles(...)`) are subject to RLS on the child table — if RLS blocks the join, the parent query silently returns null data. Use `createAdminClient()` in server components for intentionally public data like leaderboard scores
- `useSearchParams()` in a client page component requires a `<Suspense>` boundary in Next.js 16 for static prerender to succeed — wrap the content component, not the page export
- Always wait for `git push` before running `vercel --prod` — Vercel CLI deploys from local files directly; git and Vercel state can diverge

## Session Log: 2026-05-26 (Session 4 — E2E Testing + Phase 7 Quick Wins)

### Summary
Completed E2E testing for Login & Auth (14/14) and Nav & Global UI (8/8). Shipped both Phase 7 quick wins: leaderboard mini-widget on dashboard and public shareable leaderboard. Fixed 3 bugs found during testing: expired magic link UX, iOS home screen icon, and a silent RLS join failure on the leaderboard. 6 commits, all deployed to production.

---

## [Day 7] — 2026-05-27 (Phase 5.5 E2E continued + Phase 7 Quick Win)

### Shipped

**Phase 7 — Join Request Payment Screen**
- `/login` `sent_invite_request` state replaced with interactive two-tab payment screen
- **Bolivian QR tab**: `qr_bob.jpeg` rendered via `next/image` on white card with banking app hint
- **USDC/ETH tab**: wallet address in monospace, one-click clipboard copy with 3s green check, prominent ETH-network-only red warning
- Tab toggle + copy state reset on "Try a different email"

### Fixed (bugs found during E2E)

- **Sonner `<Toaster>` never mounted** — imported in 6 components but missing from root layout; no toasts fired anywhere in the app except login. Fixed: added `<Toaster richColors position="bottom-right" />` to root layout.
- **Trophy dropdowns allowed duplicate picks** — Champion/Runner-up/3rd Place all showed all 48 teams; same team selectable in all three slots. Fixed: derive `available` teams per slot by excluding the other two selected IDs (same pattern as group standings deduplication).
- **3rd-Place Qualifiers UX** — no group constraint; any 4 teams from one group could be selected. Fixed:
  - One selection per group enforced: selecting a new team auto-deselects the previous pick from the same group
  - Position-aware styling from group standings state: 1st/2nd/4th → `opacity-30` + disabled; predicted 3rd → amber `3rd ✓` badge
  - Flag emojis added to all qualifier rows
- **Server action errors showed generic Next.js digest in production** — all prediction actions used `throw new Error(...)` which Next.js sanitizes to `"An error occurred in the Server Components render..."`. Fixed: all actions now return `{ error: string | null }` for expected errors; form handlers use `result.error` directly.
- **Admin pre-tournament lock/unlock broken** — unlock did nothing visible; user remained locked. Root causes: (1) save actions only checked date-based `isPreTournamentLocked()`, not the DB `locked` column the admin sets; (2) `unlockPreTournament` used `.neq('locked', false)` and only revalidated `/admin/locks`, not `/predictions/pre-tournament`. Fixed: save actions now check DB `locked` column via `checkLocked()` helper; both lock/unlock actions use explicit `.eq()` filters and revalidate both paths.

### Phase 5.5 E2E Progress

| Section | Status |
|---|---|
| Login & Auth | ✅ 14/14 |
| Nav & Global UI | ✅ 8/8 |
| Pre-Tournament Predictions | ✅ 10/10 (incl. admin lock/unlock) |
| Group Stage Predictions | 🔲 Next |
| Knockout Predictions | 🔲 Pending |
| Rebuy | 🔲 Pending |
| Receipt | 🔲 Pending |
| Leaderboard | 🔲 Pending |
| Dashboard | 🔲 Pending |
| Admin | 🔲 Pending |
| Security | 🔲 Pending |

### Lessons Learned
- `throw` in Next.js server actions → production digest error (message sanitized). Always `return { error }` for user-facing validation failures; reserve `throw` for truly unexpected errors.
- Admin DB-level lock (`locked = true` column) and app-level date lock (`isPreTournamentLocked()`) must both be checked in save actions — they are independent mechanisms.
- `revalidatePath` in a lock/unlock action must revalidate BOTH the admin page and the affected user-facing page, or the user won't see the state change without a manual reload.

## Session Log: 2026-05-27 (Session 7 — Picks Grid Polish + Code Audit + Testing)

### Summary
Completed the picks comparison grid feature end-to-end: built, audited, hardened, and tested on production. Decoupled the picks grid from the `scores` table so it works before scoring runs. Established match prediction visibility gating server-side (59 min before kickoff). Discovered and fixed 6 code quality issues found during audit. Ran manual E2E tests on production with `picksVisible = true` temporarily deployed.

### Shipped

**Picks Grid — Code Hardening (`src/app/leaderboard/picks-grid.tsx`)**
- `stagesWithPicks` moved before state declarations; `matchStage` now initializes to `stagesWithPicks[0]` via lazy initializer instead of hardcoded `'group'`
- `isSearchActive` flag derived from `search.trim().length > 0` — single source of truth for all empty-state messages
- Empty states added to all 5 tabs when search yields no results:
  - Trophy & Awards: `colSpan={10}` row in tbody
  - Group Standings: message replaces entire grid
  - 3rd-Place Qualifiers: message replaces table
  - Match Predictions: message replaces table (stage pills still visible)
  - Rebuys: context-aware message — "No rebuys for this player." vs "No rebuys submitted yet."

**Picks Grid — Data Layer Fix (`src/app/leaderboard/page.tsx`)**
- Added `profiles` query to picks grid `Promise.all` (9th parallel fetch)
- `players` list now built from `profiles` directly: ranked users (from `scores`) appear first, unranked profiles append alphabetically — grid works even when `scores` table is empty
- Match predictions now gated server-side: predictions only sent to client for matches where `now >= scheduled_at - 59 min`; unlocked matches send empty `predictions: []` so no picks are exposed pre-lock
- Participant count updated to reflect `players.length` (all profiles) instead of `rows.length` (only scored users)

### Fixed
- **Picks grid empty when `scores` table has no data** — `players` list was built from `scores`; if no scores computed, no players shown. Fixed by sourcing `players` from `profiles` with scores-based ordering as a fallback.
- **Match predictions leaked pre-kickoff** — all predictions were always sent to client regardless of match lock time. Fixed with server-side 59-min gate.

### Testing
- Deployed `picksVisible = true` to production for manual E2E grid testing
- Confirmed picks grid shows all participants from `profiles` (8 with pre-tournament picks, 2 with group standings, 1 with match predictions, 8 with qualifiers, 0 rebuys)
- Confirmed match prediction gating: all `—` before June 11 (no matches locked yet)
- Confirmed gate message restores correctly after reverting to `isPreTournamentLocked()`

### Phase 5.5 E2E Progress

| Section | Status |
|---|---|
| Login & Auth | ✅ 14/14 |
| Nav & Global UI | ✅ 8/8 |
| Pre-Tournament Predictions | ✅ 10/10 |
| Group Stage Predictions | 🔲 Next |
| Knockout Predictions | 🔲 Pending |
| Rebuy | 🔲 Pending |
| Receipt | 🔲 Pending |
| Leaderboard | 🔲 Pending |
| Dashboard | 🔲 Pending |
| Admin | 🔲 Pending |
| Security | 🔲 Pending |

### Lessons Learned
- `scores` table is admin-triggered (via `/admin/scoring`), not auto-populated — never source participant lists from it; always use `profiles` as the source of truth for who exists in the system.
- PostgREST + admin client bypasses RLS; match prediction visibility must be enforced in server component logic, not RLS alone, when using service-role key.
- Empty states must be context-aware: "No players match your search" vs "No X submitted yet" — `isSearchActive` flag makes this clean without prop drilling.

---

## [Day 8] — 2026-05-28 (i18n + Bug Fixes + UX Polish)

### Shipped

**Phase 7 — Full EN/ES Internationalization**
- `next-intl` v4 installed and wired via `getRequestConfig` → reads `NEXT_LOCALE` cookie; no URL restructure (routes stay `/dashboard`, `/leaderboard`, etc.)
- `NextIntlClientProvider` wraps root layout; `getLocale()` / `getMessages()` server helpers used throughout
- `LocaleToggle` client component — `useTransition` + `router.refresh()` on cookie set; renders 🇺🇸/🇪🇸 flag emoji; present on every page including login
- `setLocale` server action writes `NEXT_LOCALE` cookie (1-year expiry, `sameSite: lax`)
- **480+ strings** across namespaces: `common`, `nav`, `login`, `authLayout`, `dashboard`, `leaderboard`, `rules`, `predictions`, `admin`, `error`, `notFound`
- All user-facing pages translated: nav, login, auth layout, dashboard, rules, group-stage form + page, pre-tournament form, knockout form + page, rebuy form + page, receipt, leaderboard table + mini-widget + public page, picks grid (all 5 tabs), error/not-found
- Admin pages intentionally kept in English (user decision)
- `STAGE_LABELS`, `TROPHY_FIELDS`, `AWARD_FIELDS`, `STANDING_POSITION_KEYS` arrays moved inside components to use `t()` calls

**Phase 5.5 — Group Stage Input Hardening**
- Leading-zero guard: `value.length > 1 && value.startsWith('0')` rejects `"00"`, `"007"`, etc.
- Live x/72 counter: moved from server-rendered subtitle to `GroupStageForm` client state; derived from `scores` state — updates on every keystroke

### Fixed

- **Group K/L hidden/stretched** — `TabsList` base class bakes `group-data-horizontal/tabs:h-8` (a CSS variant selector that beats plain `h-auto`); wrapped row was clipped to 32px. Fix: `!h-auto` (Tailwind important modifier) forces override; `w-full` gives flex container a proper wrap boundary; `flex-none` on each `TabsTrigger` prevents K/L from ballooning to 50% width when alone on last row.
- **Login "Continue" button showing raw key** — `continue` and `checking` keys absent from both `en.json` and `es.json`; added to both files.
- **Rules dates not translating** — dates were hardcoded English strings (`'June 7, 2026'`). Moved to `t('date1/2/3')` with Spanish equivalents (`7 de junio de 2026`).
- **Mobile login hero clipping** — hero panel `h-56` (224px) + `overflow-hidden` + `justify-end`; full content stack (logo + tagline + description + stats + trophy) was ~360px; ~200px overflowed upward and got clipped. Fix: hide description (`hidden md:block`), stat pills (`hidden md:flex`), and trophy card (`hidden md:flex`) on mobile; reduce spacing to `space-y-3` and tagline to `text-3xl`. Visible content (logo + tagline) now fits within 224px.
- **Mobile form panel positioning** — right panel `items-center` vertically centered the form; on small viewports the form was taller than remaining height and top was clipped. Fix: `items-start md:items-center` + `overflow-y-auto`.
- **`dangerouslySetInnerHTML` in rules page** — was used to render `<strong>{max}</strong>` inside translation strings. XSS risk removed; numbers embedded directly in translation strings.
- **TypeScript: `matchesByStage[stage]?.length` type error in receipt page** — `number | undefined` not assignable to next-intl param type. Fixed: `?? 0` fallback.

### Phase 5.5 E2E Progress

| Section | Status |
|---|---|
| Login & Auth | ✅ 14/14 |
| Nav & Global UI | ✅ 8/8 |
| Pre-Tournament Predictions | ✅ 10/10 |
| Group Stage Predictions | ✅ Bugs found and fixed (zero guard, live counter, K/L tabs) |
| Knockout Predictions | 🔲 Pending |
| Rebuy | 🔲 Pending |
| Receipt | 🔲 Pending |
| Leaderboard | 🔲 Pending |
| Dashboard | 🔲 Pending |
| Admin | 🔲 Pending |
| Security | 🔲 Pending |

### Deployed
- `vercel --prod` → `https://www.quiniela2026.space`
- Build: 21 routes, TypeScript clean, 0 errors, Turbopack

### Lessons Learned
- `next-intl` v4 cookie-based locale avoids URL restructuring entirely — `getRequestConfig` reads `NEXT_LOCALE` cookie; all existing routes stay unchanged; no `[locale]` segment required.
- Tailwind CSS variant selectors (e.g. `group-data-horizontal/tabs:h-8`) beat unconditional utilities (`h-auto`) on specificity — use Tailwind's `!` important modifier to force the override when you can't edit the component source.
- `flex-1` on wrapping flex items causes last-row items to stretch across the full row width — `flex-none` is required on each item when the container uses `flex-wrap`.
- On mobile Safari, a hero panel with `overflow-hidden` + `justify-end` and content taller than the container clips the TOP (overflow goes upward) — content below the viewport bottom is not the issue; content above the panel top is.
- Always keep `dangerouslySetInnerHTML` out of translation strings — embed dynamic values as interpolation params (`{count}`) instead.

## Session Log: 2026-05-28 (Session 8 — i18n + E2E Bug Fixes)

### Summary
Shipped full EN/ES internationalization across the entire user-facing app (480+ strings, 21 routes) using `next-intl` v4 with cookie-based locale — no URL restructure. Group stage hardened: leading-zero input guard and live x/72 counter. Fixed 5 bugs found during live mobile testing: login button key missing, rules dates hardcoded in English, mobile hero overflow clipping all content above the tagline, groups K/L clipped by shadcn's fixed tab height, and locale toggle showing text labels instead of flags. All fixes deployed to production. 8 commits total.

---

## [Day 9] — 2026-05-29 (Phase 5.5 E2E Complete + Dashboard Fix)

### E2E Testing Completed
- **Knockout Predictions** ✅ — all 6 stages (r32/r16/qf/sf/3rd/final), TBD teams, flags, auto-save, lock behavior
- **Rebuy** ✅ — locked state, unlock flow, permanent submit, already-submitted state; test data reset via SQL after
- **Receipt** ✅ — pre-tournament picks, group standings, 3rd-place qualifiers, match predictions by stage, rebuy section gating, print/PDF
- **Leaderboard** ✅ — podium, rank table, champion flags, realtime update, picks grid gate, public leaderboard, i18n
- **Dashboard** ✅ — score card, champion pick, rebuy card, progress bar, quick links, mini-widget, i18n

### Fixed

- **Dashboard welcome greeting showed raw email** — `profile?.display_name` was null for manually bootstrapped admin account; fallback `?? user.email` exposed full email address. Fixed: better fallback (`user.email?.split('@')[0] ?? 'Player'`).
- **Dashboard profile query returning null** — anon client + recursive RLS on `profiles` silently blocked the SELECT even with "Read own profile" policy present. Root cause: same recursive policy issue as `nav.tsx` and leaderboard. Fixed: switched `profiles` fetch to `createAdminClient()` (service-role bypasses RLS). Pattern now consistent across all profile reads in the app.

### Phase 5.5 E2E Final Status

| Section | Status |
|---|---|
| Login & Auth | ✅ 14/14 |
| Nav & Global UI | ✅ 8/8 |
| Pre-Tournament Predictions | ✅ 10/10 |
| Group Stage Predictions | ✅ |
| Knockout Predictions | ✅ |
| Rebuy | ✅ |
| Receipt | ✅ |
| Leaderboard | ✅ |
| Dashboard | ✅ |
| Admin | 🔲 Pending |
| Security | 🔲 Pending |

### Onboarding
- Magic link invites sent to family & friends. Users onboarding now, waiting on payments.

### Commits
- `a3fae33` fix(dashboard): hide raw email in welcome greeting
- `6f0dda7` fix(dashboard): use service-role for profile query

### Lessons Learned
- Recursive RLS on `profiles` affects ALL anon client reads, not just admin detection — any server component reading a user's own profile via session client will silently return null. Rule: always use `createAdminClient()` for `profiles` queries in server components.

## Session Log: 2026-05-29 (Session 9 — E2E Battle Testing + Dashboard Fixes)

---

## [Day 10] — 2026-05-30 (Admin E2E + Seed Fix)

### Fixed

- **Group I seed: Iraq/Norway team IDs swapped** — `supabase/seed/001_seed_data.sql` had Iraq (35) and Norway (36) inverted across 5 of 6 Group I matches. Patched via SQL UPDATE in prod DB; seed file corrected to match.
  - Walter Jesus's 5 affected match predictions deleted (clean slate for re-submission).

- **`togglePaid` broken** — `upsert({ id, entry_paid })` silently failed `display_name TEXT NOT NULL` constraint for any user without a profile row. Changed to `.update().eq('id', userId)` with error check.

- **`deleteUser` broken** — `audit_log.user_id` references `profiles(id)` with no `ON DELETE CASCADE`; profile cascade delete from `auth.users` was blocked by the FK. Fix: null out `audit_log.user_id` for the target user before calling `deleteUser`, with checked error.

- **`deleteUser` self-deletion** — no guard prevented an admin from deleting their own account. Added `user.id === userId` check that throws before any DB operation.

- **`toggleAdmin` error swallowed** — same `upsert` pattern as `togglePaid`; switched to `update()` with error check for consistency.

### Admin E2E Status

| Section | Status |
|---|---|
| Users — invite | ✅ |
| Users — toggle paid | ✅ (fixed this session) |
| Users — toggle admin | ✅ |
| Users — delete | ✅ (fixed this session) |
| Matches — score entry, status, upset | ✅ |
| Locks — lock/unlock per stage | ✅ |
| Audit — log viewer, pagination | ✅ |
| Scoring — recompute, tournament results, rebuy unlock | ✅ |

### Commits
- `172eee5` fix(seed): correct Iraq/Norway swap in Group I matches
- `bd2633b` fix(admin): harden user management actions

### Lessons Learned
- `upsert` with partial columns fails silently on INSERT when required columns (NOT NULL) are absent — always use `update()` when the row is guaranteed to exist; reserve `upsert` for true insert-or-update flows where all NOT NULL columns are provided.
- FK constraints without `ON DELETE CASCADE` are silent delete-blockers — always check every FK referencing a table before writing a delete path.
- Audit log `user_id` FK must be nulled before deleting a user; audit history is preserved (rows remain), only the attribution is lost.
- Never swallow errors from prerequisite steps (audit nulling) before a destructive operation (user delete) — check each error in sequence.

## Session Log: 2026-05-30 (Session 10 — Group I Seed Fix + Admin E2E)

---

## [Day 10 continued] — 2026-05-30 (Security E2E + Full Admin E2E)

### E2E Complete ✅

All Phase 5.5 E2E sections now green:

| Section | Status |
|---|---|
| Login & Auth | ✅ 14/14 |
| Nav & Global UI | ✅ 8/8 |
| Pre-Tournament Predictions | ✅ 10/10 |
| Group Stage Predictions | ✅ |
| Knockout Predictions | ✅ |
| Rebuy | ✅ |
| Receipt | ✅ |
| Leaderboard | ✅ |
| Dashboard | ✅ |
| Admin (Matches, Locks, Users, Scoring) | ✅ |
| Security | ✅ 8/8 |

### Security Tests Passed (8/8)
1. Non-admin navigating to `/admin/*` → redirected
2. Unauthenticated navigating to `/admin/*` → redirected to `/login`
3. Force-write match prediction after lock (disabled input via DevTools) → server action blocks, value does not persist
4. Force-write pre-tournament prediction after admin lock → server action blocks, value does not persist
5. Read another user's pre-tournament picks via direct API call → RLS returns `[]`
6. Read another user's match predictions via direct API call before lock → RLS returns `[]`
7. Non-admin accessing all 6 `/admin/*` routes directly → all redirect
8. Unauthenticated accessing `/dashboard`, `/predictions/*`, `/leaderboard` → all redirect to `/login`

---

## [Day 11] — 2026-05-31 (Phase 7: Daily Prediction Grid)

### Shipped

**Phase 7 — Daily Prediction Grid**
- `src/app/leaderboard/daily-grid.tsx` — async server component embedded in `/leaderboard` below the standings table
- **Desktop (md+):** player × match table; sticky player column with `group-hover` highlight sync; compact mono column headers (`MEX–RSA / 15:00`); horizontal scroll for 5+ matches
- **Mobile (<md):** one card per match, all players stacked inside with flagged team header (`🇲🇽 MEX vs 🇿🇦 RSA · 15:00`) and per-player score row
- **Gate:** UTC date filter + 59-min pre-kickoff lock — same gate as `matchRows`; no extra DB query (reuses `allMatches` + `matchPreds` already fetched by the page)
- `DailyMatch` type uses `homeCode`/`awayCode` (raw 3-letter codes); `matchLabel()` derives flagged display in component
- Renders nothing pre-tournament — will auto-appear on June 11 at first kickoff minus 59 min
- EN/ES i18n: `dailyTitle` + `dailySubtitle` keys added to both locale files

### Commits
- `962c8ba` feat(leaderboard): add daily prediction grid
- `423e786` refactor(leaderboard): responsive daily grid layout

### Deployed
- `vercel --prod` → `https://www.quiniela2026.space`
- Build: 21 routes, TypeScript clean, 0 errors

### Remaining — Phase 7
- [ ] Reminder push — Resend email blast June 6 to users with incomplete predictions
- [ ] Audit hardening + transparency

### Remaining — Phase 6
- [ ] Schedule deadline reminder email (June 3 send)
- [ ] README screenshots
