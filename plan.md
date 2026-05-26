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
- [ ] Known email → magic link sent, "Check your inbox 📬" confirmation state shown
- [ ] Unknown email → invite request email fires to `sergio.barrientos1401@gmail.com`, "Request sent 🙋" state shown with $10 fee explanation card
- [ ] Resend email arrives with correct subject `⚽ Invite request — {email}` and link to `/admin/users`
- [ ] "Try a different email" link resets form from both confirmation states
- [ ] Login page is dark mode only — no theme toggle visible (unauthenticated)
- [ ] Stadium hero image loads, dark overlay renders, all text is legible (no image bleed-through)
- [ ] Trophy frosted glass card readable against hero image
- [ ] Stat pills (`104 matches`, `48 teams`, etc.) visible and not washed out
- [ ] Mobile: stadium image stacks above the form, not clipped or distorted
- [ ] Unauthenticated access to `/dashboard`, `/predictions/*`, `/leaderboard` → redirected to `/login`
- [ ] Unauthenticated access to `/admin/*` → redirected to `/login`
- [ ] Non-admin user accessing `/admin/*` → redirected away (not just hidden in nav)
- [ ] Sign out → session cleared, redirect to `/login`, back button does not re-enter

#### Nav & Global UI
- [ ] ⚽ `Quiniela` / `2026` logo renders with correct weight split and champion color
- [ ] Nav logo color updates when champion changes (no page reload needed)
- [ ] Theme toggle visible and functional when authenticated
- [ ] Theme toggle NOT visible on login page
- [ ] Page background wash updates when champion changes (5% color-mix tint, 0.6s transition)
- [ ] Background wash works in both light and dark mode without breaking readability
- [ ] Favicon displays correctly in browser tab (football icon)
- [ ] Favicon shows on iOS home screen when added as PWA shortcut

#### Pre-Tournament Predictions
- [ ] Submit champion, runner-up, 3rd place — verify saved in DB
- [ ] Champion color theme updates instantly on dropdown change (before save)
- [ ] Page background wash shifts to team color immediately on champion select
- [ ] Flag emojis appear in all dropdowns and on save confirmation
- [ ] Individual awards (Golden Boot, Glove, Kopa) — text fields save correctly
- [ ] Fun Bets (total goals, first eliminated, most yellows) — save and reload correctly
- [ ] Group Standings — all 12 groups, each position deduplicated (no same team in 2 slots)
- [ ] 3rd-Place Qualifiers — select exactly 8 of 12, save button disabled until 8 selected
- [ ] Reload page — all saved values persist correctly across all 3 tabs
- [ ] After June 4 lock: all inputs disabled, "Predictions are locked" shown

#### Group Stage Predictions
- [ ] 72 matches across 12 groups — auto-save on blur fires correctly (status dot: yellow → green)
- [ ] Invalid input (letters, > 20) rejected without error thrown
- [ ] Locked match (`locked_at < now()`) — input disabled, score not editable
- [ ] Group tab completion counter updates as matches are filled (X/6)
- [ ] Reload — all saved scores persist

#### Knockout Predictions
- [ ] All 6 stages (r32/r16/qf/sf/3rd/final) load correctly
- [ ] TBD teams shown as `🏳️ TBD` — input still enabled pre-lock
- [ ] Flag emojis correct for confirmed teams
- [ ] Auto-save on blur, status dot behavior
- [ ] Locked match inputs disabled

#### Rebuy
- [ ] No rebuy available state renders correctly (original champion name + flag shown)
- [ ] Rebuy unlocked: team dropdown shows flags, champion-changed event fires on select
- [ ] Submit is permanent — form replaced with "Rebuy Submitted" confirmation card
- [ ] Already-submitted state shows correct team + flag

#### Receipt
- [ ] All pre-tournament picks shown with flags
- [ ] Group standings: all 12 groups, 4 positions each with flags
- [ ] 3rd-place qualifiers listed with flags
- [ ] Match predictions by stage: flags + scores correct
- [ ] Rebuy section appears only when rebuy submitted
- [ ] Print/PDF — layout clean, nav and button hidden in print mode

#### Leaderboard
- [ ] All users ranked correctly by total points
- [ ] Current user row highlighted (champion color tint + left border)
- [ ] Champion flags shown before each player name
- [ ] Realtime update: trigger score recompute in admin → leaderboard updates without page refresh
- [ ] Medal colors: gold #1, silver #2, bronze #3

#### Dashboard
- [ ] Score breakdown cards correct (pre-tournament, group, knockout, rebuy)
- [ ] Champion pick shows flag + name; missing pick shows "Add your champion pick →" link
- [ ] Progress bar fills correctly (match predictions / 104)
- [ ] Rebuy card: shows team + flag when submitted, "Rebuy available" link when unlocked, "Not yet unlocked" when inactive
- [ ] Entry fee warning shown when `entry_paid = false`

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
- [ ] Invite new user → magic link email received
- [ ] Toggle `entry_paid` — persists on reload
- [ ] Toggle `is_admin` — user gains/loses admin tab without re-login (next page load)
- [ ] Delete user — removed from list and from Supabase Auth

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

- [ ] **Auto-pull match scores** — scheduled Edge Function polls Football-Data.org (free tier: 10 req/min) every 5 min during match windows; auto-marks matches `finished` and triggers recompute
- [x] **Champion-themed UI** — live color update on champion/rebuy select; luminance clamping for dark/light mode; CSS vars on nav, score card, progress bar, leaderboard row
- [x] **Flag emoji on all team mentions** — pre-tournament form, group-stage, knockout, rebuy, receipt, admin match-row, dashboard, leaderboard
- [ ] **Leaderboard mini-widget** — floating card on `/dashboard` showing top 3 + user rank without leaving the page *(top-3 podium on `/leaderboard` already done)*
- [ ] **Reminder push** — Resend email blast June 3 to all users who have incomplete predictions (< 104 match predictions submitted)
- [ ] **Public read-only leaderboard** — shareable `/leaderboard/public` URL, no auth required, names only (no score breakdown)

---

## Key Dates
| Date       | Event                                     |
|------------|-------------------------------------------|
| 2026-05-24 | Project start                             |
| 2026-06-07 | **PRE-TOURNAMENT SHEET LOCK (HARD)**      |
| 2026-06-11 | FIFA World Cup 2026 kickoff               |
| 2026-07-19 | World Cup Final                           |
