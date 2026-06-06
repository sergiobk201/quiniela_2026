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
- [x] Unknown email → invite request email fires to admin via `ADMIN_NOTIFICATION_EMAIL`, "Request sent 🙋" state shown with $10 fee explanation card
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
- [x] Enter score for a match → saved correctly, audit log entry created
- [x] Status cycle: scheduled → live → finished → scheduled
- [x] Upset toggle: on/off
- [x] Non-admin user cannot call admin server actions (assertAdmin guard) — test via curl or direct POST

#### Admin — Locks
- [x] Lock a stage → `locked_at` set to now, predictions for that stage disabled in UX
- [x] Unlock a stage → `locked_at` reset to original `scheduled_at - 1h`
- [x] Lock pre-tournament → pre-tournament form shows locked state
- [x] Lock confirmation dialog prevents accidental clicks

#### Admin — Users
- [x] Invite new user → magic link email received
- [x] Toggle `entry_paid` — persists on reload
- [x] Toggle `is_admin` — user gains/loses admin tab without re-login (next page load)
- [x] Delete user — removed from list and from Supabase Auth

#### Admin — Scoring
- [x] Recompute scores → leaderboard updates
- [x] Save tournament results (3rd/runner-up/champion/top scorer) → stored correctly
- [x] Rebuy unlock by user → `champion_rebuys` row created for that user

#### Security
- [x] Direct POST to admin server action as non-admin → `Unauthorized` error returned
- [x] Direct POST to `saveMatchPrediction` with a locked `match_id` → blocked by DB RLS
- [x] Direct POST to `saveTrophyAndAwards` after June 4 → blocked by DB RLS
- [x] Cross-user data: logged in as User A, try to read User B's predictions → empty (RLS)
- [x] Unauthenticated access to `/admin/*` → redirect to `/login`
- [x] Non-admin access to `/admin/*` → redirect away
- [x] Unauthenticated access to `/dashboard`, `/predictions/*`, `/leaderboard` → redirect to `/login`
- [x] Cross-user match predictions hidden before lock (post-lock RLS gate confirmed)

### Phase 6 — Onboarding (Day 18)
- [x] Send magic link invites to 25 users via Resend
- [x] `/rules` page: scoring rules, deadlines, FAQ — shipped in Phase 5 hardening pass
- [x] Schedule deadline reminder email (June 6 — 1 day before lock) — pending Resend blast build
- [ ] README

### Phase 7 — Automations & UX Polish (Nice to Haves)
> These require no paid services — all free-tier solutions.

- [x] **Pick comparison viewer** — inline picks grid on `/leaderboard` showing all players' picks across 5 tabs (Trophy & Awards, Group Standings, 3rd-Place Qualifiers, Match Predictions, Rebuys). Search by name. Gated pre-June 7. Match predictions gated per-match (59 min before kickoff). Migration 006 applied for post-lock cross-user SELECT policies. Shipped 2026-05-27.
- [x] **Daily prediction grid** — embedded in `/leaderboard` below standings table. Desktop: sticky player column + compact `MEX–RSA / 15:00` headers, horizontal scroll for 5+ matches. Mobile: one card per match, all players stacked inside. Gate: 59-min pre-kickoff lock + UTC date filter, same as match picks. No extra DB query — reuses `allMatches` + `matchPreds` already fetched by page. Shipped 2026-05-31.
- [x] **Champion-themed UI** — live color update on champion/rebuy select; luminance clamping for dark/light mode; CSS vars on nav, score card, progress bar, leaderboard row
- [x] **Flag emoji on all team mentions** — pre-tournament form, group-stage, knockout, rebuy, receipt, admin match-row, dashboard, leaderboard
- [x] **Leaderboard mini-widget** — floating card on `/dashboard` showing top 3 + user rank without leaving the page *(top-3 podium on `/leaderboard` already done)*
- [x] **Join request payment screen** — two-tab inline screen on `sent_invite_request` state: Bolivian QR (static image) + USDC/ETH (wallet address + one-click copy + ETH-only warning). Shipped 2026-05-27.
- [x] **EN/ES i18n** — cookie-based locale via `next-intl`; 480+ strings; flag emoji toggle on every page including login; no URL restructure. Shipped 2026-05-28.
- [x] **Reminder push** — Resend email blast June 6 to all users who have incomplete predictions (< 104 match predictions submitted)
- [x] **Public read-only leaderboard** — shareable `/leaderboard/public` URL, no auth required, names only (no score breakdown)
- [x] **Audit hardening + transparency** — `logAudit()` helper + all prediction saves + lock-blocked attempts + admin lock events logged to `audit_log`. `audit_log_readable` view for investigations. Migration 010. Shipped 2026-06-05.

---

### Phase 8 — User Feedback: Predictions Intelligence
> Driven by user feedback collected after onboarding. All items must be live before June 11 (WC kickoff). Items 1A and 4-Phase-1 must be live before June 7 (pre-tournament lock).

**Implementation order (strict — dependencies flow downward):**
1. Item 1A → 2. Item 4 Phase 1 → 3. Item 1B → 4. Item 2A → 5. Item 2B → 6. Item 3 → 7. Item 4 Phase 2

- [x] **Item 1A — 6 more fun bets** — migration 007; 6 new columns on `pre_tournament_predictions`; extend `saveTrophyAndAwards`; add inputs to pre-tournament form; update rules page + README. No scoring changes.
- [x] **Item 1B — Community bet suggestions** — migration 008 (`bet_suggestions` + `bet_suggestion_votes`); new page `/community-bets`; admin page `/admin/suggestions`; daily cron `GET /api/cron/bet-suggestions` emails top-3 voted bets 2 days before each phase starts. Full plan below.
- [x] **Item 2A — Live standings table in group stage** — new utility `src/lib/scoring/group-standings.ts` (`computeGroupStandings()`); new component `GroupStandingsTable`; rendered below each group's 6 match rows in `/predictions/group-stage`. No DB change. Full plan below.
- [x] **Item 2B — Pre-tournament group standings sync** — pre-tournament page fetches stored match predictions (10th parallel query); "Sync from match picks" button per group + "Sync all 12" global button; warning badge when manual picks diverge from computed standings. Full plan below.
- [x] **Item 3 — 3rd-place qualifier FIFA ranking** — extends `group-standings.ts` with `rankThirdPlaceTeams()`; adds pts/GD/GF badges + qualifier status chip (✓ / — / ⚠ Borderline) to qualifier picker; "Auto-select top 8" button. No DB change. Full plan below.
- [x] **Item 4 Phase 1 — Trophy pick contradiction alarm** — new utility `src/lib/scoring/validate-trophy.ts`; `saveTrophyAndAwards` returns `warnings[]` on conflict; yellow warning card in form; bracket-half impossibility check added (2026-06-01). Full plan below.
- [x] **Item 4 Phase 2 — Bracket prediction page** — dropped; pre-tournament lock (June 7) made timeline infeasible; users already filling picks directly; no scoring impact.

---

## Item 1A — 6 More Fun Bets

### 6 New Columns (additive, existing 3 untouched)
| Column | Type | Input |
|---|---|---|
| `first_goal_scorer` | `TEXT` | text field — first goal scorer of tournament |
| `first_red_card_player` | `TEXT` | text field — first player shown a red card |
| `total_red_cards_prediction` | `INT` | number — total red cards in tournament |
| `final_goes_to_penalties` | `BOOLEAN` | yes/no toggle — will the Final go to extra time + penalties? |
| `total_own_goals_prediction` | `INT` | number — total own goals scored |
| `most_goals_team_id` | `INT FK → teams(id)` | team dropdown — team that scores the most goals overall |

### Migration `007_fun_bets_extended.sql`
```sql
ALTER TABLE pre_tournament_predictions
  ADD COLUMN IF NOT EXISTS first_goal_scorer             TEXT,
  ADD COLUMN IF NOT EXISTS first_red_card_player         TEXT,
  ADD COLUMN IF NOT EXISTS total_red_cards_prediction    INT,
  ADD COLUMN IF NOT EXISTS final_goes_to_penalties       BOOLEAN,
  ADD COLUMN IF NOT EXISTS total_own_goals_prediction    INT,
  ADD COLUMN IF NOT EXISTS most_goals_team_id            INT REFERENCES teams(id);
```

### Files to change
1. `supabase/migrations/007_fun_bets_extended.sql` — migration
2. `src/app/predictions/pre-tournament/actions.ts` — extend `saveTrophyAndAwards` input type + upsert payload (6 new optional fields)
3. `src/app/predictions/pre-tournament/pre-tournament-form.tsx` — extend `TrophyState` type; add 6 inputs in Fun Bets card (`final_goes_to_penalties` as Yes/No button toggle; `most_goals_team_id` reuses existing `TeamSelect`)
4. `src/i18n/messages/en.json` + `es.json` — 6 new label + placeholder keys under `predictions.funBets`
5. `src/app/(public)/rules/page.tsx` — extend fun bets section with 6 new rows
6. `README.md` — update feature bullet

### Scoring
None — fun bets are informational only.

---

## Item 1B — Community Bet Suggestions

### How it works
1. During each tournament phase, users submit bet suggestions + a difficulty rating
2. Other users upvote favorites (1 vote per user per suggestion)
3. Deadline = `MIN(scheduled_at for next stage) - 2 days`, computed at runtime from `matches` table
4. At deadline: daily cron fetches top 3 by votes → Resend email to admin
5. Admin manually implements the approved bets in code

### Phase deadlines (computed at runtime)
| Phase | Suggestion window closes |
|---|---|
| `pre_tournament` | `MIN(group scheduled_at) − 2 days` ≈ June 9 |
| `group` | `MIN(r32 scheduled_at) − 2 days` |
| `r32` | `MIN(r16 scheduled_at) − 2 days` |
| `r16` | `MIN(qf scheduled_at) − 2 days` |
| `qf` | `MIN(sf scheduled_at) − 2 days` |
| `sf` | `MIN(final scheduled_at) − 2 days` |

### Difficulty → suggested points
| Level | Pts |
|---|---|
| Easy | 1 |
| Medium | 2 |
| Hard | 3 |
| Expert | 5 |

### Migration `008_bet_suggestions.sql`
```sql
CREATE TABLE bet_suggestions (
  id         SERIAL PRIMARY KEY,
  phase      TEXT NOT NULL CHECK (phase IN ('pre_tournament','group','r32','r16','qf','sf','final')),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','expert')),
  status     TEXT DEFAULT 'open' CHECK (status IN ('open','selected','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bet_suggestion_votes (
  id            SERIAL PRIMARY KEY,
  suggestion_id INT REFERENCES bet_suggestions(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (suggestion_id, user_id)
);
```

### Files to change
1. `supabase/migrations/008_bet_suggestions.sql`
2. `src/app/community-bets/actions.ts` — `submitSuggestion(phase, suggestion, difficulty)` + `toggleVote(suggestionId)`; deadline guard on submit (reject if past deadline)
3. `src/app/community-bets/page.tsx` — phase tabs; suggestion list with vote counts + upvote button; submit form (disabled post-deadline); current phase auto-detected from `matches` table
4. `src/app/(admin)/admin/suggestions/page.tsx` — grouped by phase, sorted by votes DESC; mark Selected/Rejected buttons; "Send email now" override button
5. `src/app/api/cron/bet-suggestions/route.ts` — daily `0 0 * * *`; checks deadline per phase; if crossed and no `audit_log` row for `action='bet_suggestions_email_sent'` + `table_name=phase` → fetch top 3 → send Resend email → insert audit_log
6. `vercel.json` — add cron entry `{ "path": "/api/cron/bet-suggestions", "schedule": "0 0 * * *" }`
7. Nav — add "Community Bets" link
8. `src/i18n/messages/en.json` + `es.json` — `communityBets` namespace

### Email payload to admin
- Phase name, top 3 suggestions, vote counts per suggestion, difficulty, submitter display name
- Subject: `⚽ Bet suggestions due — {phase} phase`

---

## Item 2A — Live Standings Table in Group Stage

### New utility `src/lib/scoring/group-standings.ts`
```typescript
// Pure function — no DB calls, no side effects
computeGroupStandings(
  groupMatches: GroupMatch[],   // { id, home_team: {id,code,name}, away_team: {id,code,name} }
  scores: Record<number, { home: string; away: string }>
): StandingsRow[]
// Returns: [{ teamId, teamCode, teamName, rank, pts, w, d, l, gf, ga, gd }]
// Sort: pts DESC → gd DESC → gf DESC → teamName ASC
// Missing score = treated as 0-0 (consistent with lib/scoring/defaults.ts)
```

Also exports `rankThirdPlaceTeams()` used by Item 3 (see below).

### New component `src/components/predictions/GroupStandingsTable.tsx`
- Props: `groupMatches`, `scores` state
- Renders compact table: `Pos | 🏳️ Code | P W D L | GF GA GD | Pts`
- Row colors: 1st/2nd = green tint (advance), 3rd = amber (potential qualifier), 4th = dimmed
- `useMemo` — recomputes only when `scores` changes

### Changes to `src/app/predictions/group-stage/group-stage-form.tsx`
- Import `computeGroupStandings` + `GroupStandingsTable`
- After each group's match rows → `<hr className="my-3 opacity-20" />` + `<GroupStandingsTable />`
- Zero new DB queries — all data already in props + state

---

## Item 2B — Pre-Tournament Group Standings Sync

### Changes to `src/app/predictions/pre-tournament/page.tsx`
- 10th parallel fetch: user's stored `match_predictions` for `stage = 'group'` (service-role client)
- Pass as `matchPredictions` prop to `PreTournamentForm`

### Changes to `src/app/predictions/pre-tournament/pre-tournament-form.tsx`
- Accept `matchPredictions` prop
- Per group: "Sync from match picks" button → runs `computeGroupStandings` client-side → pre-fills `predicted_1st/2nd/3rd/4th` dropdowns; button disabled if fewer than 3 of 6 group matches are filled
- Global "Sync all 12 groups" button at the top of the Group Standings tab
- Warning `⚠` badge on each group tab label when stored manual picks diverge from the computed result
- Existing manual picks preserved until user explicitly clicks Sync

### Trophy picks soft warning (non-bracket)
- If champion and runner-up picks are the same team as each other or as 3rd → already prevented by dedup; no change needed
- Informational note: "Both picks are from Group X — they can still both reach the Final via opposite bracket halves."

---

## Item 3 — 3rd-Place Qualifier FIFA Ranking

### Extension to `src/lib/scoring/group-standings.ts`
```typescript
rankThirdPlaceTeams(
  allGroupResults: StandingsRow[][]  // array of 12 groups' computed standings
): RankedThirdPlace[]
// Returns 12 entries sorted: pts DESC → gd DESC → gf DESC → teamName ASC
// Each: { teamId, teamCode, rank, pts, gd, gf, qualifies: boolean, borderline: boolean }
// qualifies = rank <= 8; borderline = tie at the 8/9 boundary
```

### Changes to `src/app/predictions/pre-tournament/pre-tournament-form.tsx`
- Compute `rankedQualifiers` from all 12 groups' standings (using stored `matchPredictions` prop from Item 2B)
- In the qualifier picker, each team row gains a stat chip `3pts / +2 GD` and a qualifier status badge:
  - ✓ Top 8 (green)
  - — Out (gray)
  - ⚠ Borderline (amber, shown when tied at rank 8/9 boundary)
- "Auto-select top 8" button → sets `selectedTeams` state to the top 8 ranked team IDs
- Tie warning: "Teams ranked 7th and 8th are tied — either could qualify"

### No migration needed
`third_place_qualifier_predictions.team_ids INT[]` already handles any 8 team IDs. Existing saves are untouched until user clicks Auto-select.

---

## Item 4 Phase 1 — Trophy Pick Contradiction Alarm

### What is checked (Phase 1 — no bracket template needed)
1. **Group advancement**: Is each trophy pick team predicted to advance? (predicted_1st or predicted_2nd in group standings, OR present in the user's saved `third_place_qualifier_predictions.team_ids`)
2. **Distinct values**: All three picks are different teams (server-side double-check of existing UI dedup)

### New utility `src/lib/scoring/validate-trophy.ts`
```typescript
validateTrophyPicks(
  picks: { champion_team_id, runner_up_team_id, third_place_team_id },
  groupStandings: GroupStandingPrediction[],
  thirdPlaceQualifiers: number[]
): { valid: boolean; conflicts: TrophyConflict[] }

type TrophyConflict = {
  team_id: number
  team_name: string
  type: 'not_advancing' | 'duplicate' | 'same_bracket_half'  // last type added in Phase 2
  message: string
}
```

### Changes to `src/app/predictions/pre-tournament/actions.ts`
- `saveTrophyAndAwards` runs the validator after saving
- Returns `{ error: null, warnings: TrophyConflict[] }` — saves regardless

### Changes to `src/app/predictions/pre-tournament/pre-tournament-form.tsx`
- If `response.warnings.length > 0` → render yellow `⚠ Heads up` card below trophy picks
- Per-conflict message: "France is predicted to finish 3rd in Group E — they may not advance."
- Card is dismissible; save is never blocked

### Admin panel `/admin/scoring` — new "Prediction Integrity" section
- "Scan all users" button → runs validator for every user, renders table: `User | Conflict type | Details`
- "Send alert email" button → Resend email to `ADMIN_NOTIFICATION_EMAIL` with full conflict list
- Also triggered automatically once daily via the bet-suggestions cron route

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
- On click: fires a server action that sends an email to admin via `ADMIN_NOTIFICATION_EMAIL` via Resend
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
