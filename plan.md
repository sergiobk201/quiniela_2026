# Quiniela 2026 — Project Plan

## Objective
Ship a full-stack World Cup prediction app for ~25 family/friends by June 7, 2026.
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

### Phase 5 — Hardening + Deploy (Days 16–17) ✅ COMPLETE
> **Day 4 (2026-05-25):** Deployed to Vercel prod. Custom domain `quiniela2026.space` live. Admin auth hardened via service-role pattern. Resend SMTP configured.
> **Day 5 (2026-05-25):** RLS write-lock enforcement via explicit INSERT/UPDATE/DELETE policies. All 13 admin server actions guarded with `assertAdmin()`. HTTP security headers added. Client-trusted `lockedAt` bypass fixed.

- [x] RLS policy audit — `004_rls_write_locks.sql` closes post-lock write bypass via direct PostgREST calls
- [x] Lock time edge case — server action now fetches `locked_at` from DB; not trusted from client
- [x] Mobile responsiveness pass — admin sidebar collapses to scrollable nav on mobile; matches table `overflow-x-auto`
- [x] Error boundaries + loading states — `error.tsx`, 404 page, loading skeletons for all sections
- [x] Deploy to Vercel — connected Supabase prod env vars; live at `https://www.quiniela2026.space`
- [x] Custom domain — `quiniela2026.space` (Namecheap) → Vercel CNAME; Resend SMTP + domain verified
- [x] Smoke test: full user flow end-to-end — magic link → dashboard → predictions → admin tab (admin only)

### Phase 5.5 — E2E Battle Testing (pre-Onboarding gate)
> Must be 100% green before sending invites. Test against prod (`quiniela2026.space`).

#### Login Page & Auth
- [x] Known email → magic link sent, "Check your inbox 📬" confirmation state shown
- [x] Unknown email → invite request email fires to `sergio.barrientos1401@gmail.com`, "Request sent 🙋" state shown with $10 fee explanation card
- [x] Resend email arrives with correct subject `⚽ Invite request — {email}` and link to `/admin/users`
- [x] "Try a different email" link resets form from both confirmation states
- [x] Login page is dark mode only — no theme toggle visible (unauthenticated)
- [x] Stadium hero image loads, dark overlay renders, all text is legible (no image bleed-through)
- [x] Trophy frosted glass card readable against hero image
- [x] Stat pills (`104 matches`, `48 teams`, etc.) visible and not washed out
- [x] Mobile: stadium image stacks above the form, not clipped or distorted
- [x] Unauthenticated access to `/dashboard`, `/predictions/*`, `/leaderboard` → redirected to `/login`
- [x] Unauthenticated access to `/admin/*` → redirected to `/login`
- [x] Non-admin user accessing `/admin/*` → redirected away (not just hidden in nav)
- [x] Sign out → session cleared, redirect to `/login`, back button does not re-enter
- [x] Expired magic link → `/login?error=auth` shows red banner "Magic link expired or already used"

#### Nav & Global UI
- [x] ⚽ `Quiniela` / `2026` logo renders with correct weight split and champion color
- [x] Nav logo color updates when champion changes (no page reload needed)
- [x] Theme toggle visible and functional when authenticated
- [x] Theme toggle NOT visible on login page
- [x] Page background wash updates when champion changes (5% color-mix tint, 0.6s transition)
- [x] Background wash works in both light and dark mode without breaking readability
- [x] Favicon displays correctly in browser tab (football icon)
- [x] Favicon shows on iOS home screen when added as PWA shortcut

#### Pre-Tournament Predictions
- [x] Submit champion, runner-up, 3rd place — verify saved in DB
- [x] Champion color theme updates instantly on dropdown change (before save)
- [x] Page background wash shifts to team color immediately on champion select
- [x] Flag emojis appear in all dropdowns and on save confirmation
- [x] Individual awards (Golden Boot, Glove, Kopa) — text fields save correctly
- [x] Fun Bets (total goals, first eliminated, most yellows) — save and reload correctly
- [x] Group Standings — all 12 groups, each position deduplicated (no same team in 2 slots)
- [x] 3rd-Place Qualifiers — select exactly 8 of 12, save button disabled until 8 selected; one per group enforced; position badges from standings
- [x] Reload page — all saved values persist correctly across all 3 tabs
- [x] After lock: admin lock/unlock via `/admin/locks` works; shows "Pre-tournament predictions are locked" toast

#### Group Stage Predictions
- [x] 72 matches across 12 groups — auto-save on blur fires correctly (status dot: yellow → green)
- [x] Invalid input (letters, > 20, leading zeros) rejected without error thrown
- [x] Locked match (`locked_at < now()`) — input disabled, score not editable
- [x] Group tab completion counter updates live as matches are filled (X/6)
- [x] All 12 group tabs visible including K/L — tab height and flex behavior fixed
- [x] Reload — all saved scores persist

#### Knockout Predictions
- [x] All 6 stages (r32/r16/qf/sf/3rd/final) load correctly
- [x] TBD teams shown as `🏳️ TBD` — input still enabled pre-lock
- [x] Flag emojis correct for confirmed teams
- [x] Auto-save on blur, status dot behavior
- [x] Locked match inputs disabled

#### Rebuy
- [x] No rebuy available state renders correctly (original champion name + flag shown)
- [x] Rebuy unlocked: team dropdown shows flags, champion-changed event fires on select
- [x] Submit is permanent — form replaced with "Rebuy Submitted" confirmation card
- [x] Already-submitted state shows correct team + flag

#### Receipt
- [x] All pre-tournament picks shown with flags
- [x] Group standings: all 12 groups, 4 positions each with flags
- [x] 3rd-place qualifiers listed with flags
- [x] Match predictions by stage: flags + scores correct
- [x] Rebuy section appears only when rebuy submitted
- [x] Print/PDF — layout clean, nav and button hidden in print mode

#### Leaderboard
- [x] All users ranked correctly by total points
- [x] Current user row highlighted (champion color tint + left border)
- [x] Champion flags shown before each player name
- [x] Realtime update: trigger score recompute in admin → leaderboard updates without page refresh
- [x] Medal colors: gold #1, silver #2, bronze #3

#### Dashboard
- [x] Score breakdown cards correct (pre-tournament, group, knockout, rebuy)
- [x] Champion pick shows flag + name; missing pick shows "Add your champion pick →" link
- [x] Progress bar fills correctly (match predictions / 104)
- [x] Rebuy card: shows team + flag when submitted, "Rebuy available" link when unlocked, "Not yet unlocked" when inactive
- [x] Entry fee warning shown when `entry_paid = false`

#### Admin — Matches
- [ ] Enter score for a match → saved correctly, audit log entry created
- [ ] Status cycle: scheduled → live → finished → scheduled
- [ ] Upset toggle: on/off
- [ ] Non-admin user cannot call admin server actions (assertAdmin guard) — test via curl or direct POST

#### Admin — Locks
- [ ] Lock a stage → `locked_at` set to now, predictions for that stage disabled in UX
- [ ] Unlock a stage → `locked_at` reset to original `scheduled_at - 1h`
- [ ] Lock pre-tournament → pre-tournament form shows locked state
- [ ] Lock confirmation dialog prevents accidental clicks

#### Admin — Users
- [x] Invite new user → magic link email received
- [x] Toggle `entry_paid` — persists on reload
- [x] Toggle `is_admin` — user gains/loses admin tab without re-login (next page load)
- [x] Delete user — removed from list and from Supabase Auth

#### Admin — Scoring
- [ ] Recompute scores → leaderboard updates
- [ ] Save tournament results (3rd/runner-up/champion/top scorer) → stored correctly
- [ ] Rebuy unlock by user → `champion_rebuys` row created for that user

#### Security
- [ ] Direct POST to admin server action as non-admin → `Unauthorized` error returned
- [ ] Direct POST to `saveMatchPrediction` with a locked `match_id` → blocked by DB RLS
- [ ] Direct POST to `saveTrophyAndAwards` after June 4 → blocked by DB RLS
- [ ] Cross-user data: logged in as User A, try to read User B's predictions → empty (RLS)

### Phase 6 — Onboarding (Day 18)
- [ ] Send magic link invites to 25 users via Resend
- [x] `/rules` page: scoring rules, deadlines, FAQ — shipped in Phase 5 hardening pass
- [ ] Schedule deadline reminder email (June 3 — 1 day before lock)
- [ ] README

### Phase 7 — Automations & UX Polish (Nice to Haves)
> These require no paid services — all free-tier solutions.

- [ ] **Auto-pull match scores** — full plan below; zero admin input needed during the tournament
- [x] **Pick comparison viewer** — inline picks grid on `/leaderboard` showing all players' picks across 5 tabs (Trophy & Awards, Group Standings, 3rd-Place Qualifiers, Match Predictions, Rebuys). Search by name. Gated pre-June 7. Match predictions gated per-match (59 min before kickoff). Migration 006 applied for post-lock cross-user SELECT policies. Shipped 2026-05-27.
- [ ] **Daily prediction grid** — panel below the leaderboard table showing every player's picks for today's matches at a glance. Layout: rows = players (champion flag + name), columns = today's locked matches (team vs team). Each cell shows the player's predicted score (e.g. `2–1`). Only renders post-lock (same RLS gate). No separate page — embedded in `/leaderboard` below the standings table. Requires: post-lock SELECT policy on `match_predictions` (covered by migration 006), server query filtered by `DATE(scheduled_at) = today`, group by `user_id` + `match_id`.
- [x] **Champion-themed UI** — live color update on champion/rebuy select; luminance clamping for dark/light mode; CSS vars on nav, score card, progress bar, leaderboard row
- [x] **Flag emoji on all team mentions** — pre-tournament form, group-stage, knockout, rebuy, receipt, admin match-row, dashboard, leaderboard
- [x] **Leaderboard mini-widget** — floating card on `/dashboard` showing top 3 + user rank without leaving the page *(top-3 podium on `/leaderboard` already done)*
- [x] **Join request payment screen** — two-tab inline screen on `sent_invite_request` state: Bolivian QR (static image) + USDC/ETH (wallet address + one-click copy + ETH-only warning). Shipped 2026-05-27.
- [x] **EN/ES i18n** — cookie-based locale via `next-intl`; 480+ strings; flag emoji toggle on every page including login; no URL restructure. Shipped 2026-05-28.
- [ ] **Reminder push** — Resend email blast June 6 to all users who have incomplete predictions (< 104 match predictions submitted)
- [x] **Public read-only leaderboard** — shareable `/leaderboard/public` URL, no auth required, names only (no score breakdown)
- [ ] **Audit hardening + transparency** — full plan below; admin honesty guarantee for all players

---

## Auto-Score Pull — Implementation Plan

### Provider: Football-Data.org (free tier)
- Free forever for FIFA World Cup; 10 req/min limit
- API key via `X-Auth-Token` header; endpoint: `GET /v4/competitions/WC/matches`
- Match statuses: `SCHEDULED` → `IN_PLAY` → `PAUSED` → `FINISHED`
- Final scores available on `score.fullTime.home` / `score.fullTime.away` when `FINISHED`
- Filter by `dateFrom` + `dateTo` to fetch only today's matches
- Team name mapping required: their English names must be verified against our seed data

### Architecture: two-part system

**Poller** — runs on a schedule (Vercel Cron every 5 min):
1. Query our `matches` table first: any rows with `locked_at < now()` and `status != 'finished'`?
2. If none → skip API call entirely (zero cost during off-hours)
3. If yes → call Football-Data.org for today's matches
4. For each `FINISHED` result, check if our DB row still needs updating
5. Fire the processor for any delta

**Processor** — Supabase Edge Function (extends or calls alongside `compute-scores`):
1. Write `home_score` / `away_score` to `matches` row
2. Set `status = 'finished'`
3. Invoke `compute-scores` recompute (existing function, type: `'all'`)
4. Insert to `audit_log` for traceability

### Polling math
- Poll every 5 min = 12 calls/hour max
- Football-Data.org allows 600/hour → we use ~2% of the free limit
- Worst case (3 simultaneous group-stage matches): still well within limit

### Failure handling
- API down → log failure, skip, retry in 5 min — no data loss
- Team mapping miss → log to `audit_log`, notify admin, don't crash the recompute
- Idempotent writes → `compute-scores` upserts scores; running twice never doubles points
- Admin manual override always available via `/admin/matches` as fallback

### What needs to be built
1. Register Football-Data.org API key → add `FOOTBALL_DATA_API_KEY` to Vercel + Supabase env vars
2. Verify team name mapping: their names vs our 48 seed team names (one-time check)
3. New Edge Function `poll-scores` — smart poller with active-match guard
4. Vercel Cron route `GET /api/cron/poll-scores` → invokes the Edge Function every 5 min
5. Extend `audit_log` inserts to capture auto-score events for admin visibility

---

## Audit Hardening + Transparency — Implementation Plan

### Goal
Give every player proof that the admin (Sergio) played fair — predictions submitted on time, scores entered honestly, no backdating. The audit log becomes a public trust layer, not just an internal debug tool.

### What gets logged (additions to current single trigger)

**1. Match score entries** — server action level, fires when admin saves a result via `/admin/matches`
- Fields: `action = 'match_score_entered'`, `table_name = 'matches'`, `record_id = match_id`
- `new_value`: `{ match: "Mexico vs South Africa", home_score: 2, away_score: 1, entered_by: "Sergio", entered_at: <timestamp> }`
- Proves: score was entered after the match, not before predictions were locked

**2. Lock / unlock actions** — server action level, fires from `/admin/locks`
- Fields: `action = 'stage_locked'` or `'stage_unlocked'`, `table_name = 'matches'`
- `new_value`: `{ stage: "group", locked_at: <timestamp>, acted_by: "Sergio" }`
- Proves: lock timestamps match scheduled kick-off windows, not manipulated post-submission

**3. User management actions** — server action level, fires from `/admin/users`
- Actions: `'user_invited'`, `'user_removed'`, `'paid_toggled'`, `'admin_toggled'`
- `new_value`: `{ email, display_name, change, acted_by: "Sergio" }`
- Proves: who was added/removed and when; no silent manipulation of the user list

**4. Admin's own predictions** — same DB trigger already captures score recomputes; add explicit log on admin's prediction saves (same server actions regular users use)
- `action = 'prediction_saved'`, `user_id = admin's UUID`
- `new_value`: `{ type: "pre_tournament" | "match", submitted_at: <timestamp> }`
- Proves: admin submitted picks before the June 7 lock, same as everyone else
- Note: `submitted_at` timestamp is server-side, not client-trusted

**5. Score recomputes** — already partially logged via DB trigger; add explicit log on manual recompute button press
- `action = 'scores_recomputed'`, `user_id = null` (system) or admin UUID
- Proves: recomputes happened after match results were entered, not before

---

### Audit report — user-facing request flow (semi-automated)

**User side — "Request Audit Report" button**
- Lives on `/dashboard` or `/leaderboard`, visible to all authenticated users
- On click: fires a server action that sends an email to `sergio.barrientos1401@gmail.com` via Resend
- Email subject: `⚽ Audit report requested — {display_name}`
- Email body: who requested it, their user ID, and a direct link to `/admin/audit`
- User sees a confirmation: "Your request has been sent. Sergio will send you the report shortly."
- No throttle bypass — one request per user per day (store last request timestamp in `profiles`)

**Admin side — generate + send the report**
- `/admin/audit` gets a "Generate Report" button (or per-user filter)
- Admin filters audit log by user (or exports all), clicks "Send Report"
- Server action compiles the relevant audit entries into a clean HTML email (Resend)
- Email goes directly to the requesting user's address with:
  - Admin's prediction timestamps (proof of on-time submission)
  - All score entry events (proof scores entered post-match)
  - All lock/unlock events (proof locks fired correctly)
  - Recompute history (proof of fair scoring)
- Admin can also print the filtered audit view to PDF from the browser (`@media print` already in the app)

---

### What needs to be built

1. Add `audit_log` inserts to 5 server actions: `saveMatchScore`, `lockStage`, `unlockStage`, `inviteUser`, `removeUser`, `togglePaid`, `toggleAdmin`
2. Add `prediction_saved` log entry to admin's own pre-tournament and match prediction saves (same actions regular users call — just log `user_id` + timestamp)
3. Add `last_audit_request_at` column to `profiles` table (migration 006 or 007) for rate-limiting
4. "Request Audit Report" button on `/dashboard` — server action sends Resend email to admin
5. `/admin/audit` — add per-user filter dropdown + "Send Report" button that emails the requesting user
6. Resend email template for the audit report — clean, printable HTML with all relevant log entries

---

## Key Dates
| Date       | Event                                     |
|------------|-------------------------------------------|
| 2026-05-24 | Project start                             |
| 2026-06-07 | **PRE-TOURNAMENT SHEET LOCK (HARD)**      |
| 2026-06-11 | FIFA World Cup 2026 kickoff               |
| 2026-07-19 | World Cup Final                           |
