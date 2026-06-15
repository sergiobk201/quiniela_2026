# Quiniela 2026 — Claude Context

## Project
Family/friends World Cup prediction app for 2026 FIFA World Cup (25 users).
**Hard deadline: June 4, 2026** (pre-tournament sheet lock). WC starts June 11.

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes (Edge Runtime)
- **DB/Auth:** Supabase (Postgres + RLS + Auth + Realtime)
- **Email:** Resend (invite/reminder emails)
- **Hosting:** Vercel + Supabase (both free tier)

## Architecture Decisions
- Route groups: `(auth)`, `(admin)`, `(public)` for layout separation
- Auth: Supabase magic link, invite-only (no self-registration)
- Predictions hidden via RLS until `locked_at < now()` (anti-copy)
- Scores computed server-side by Supabase Edge Function (never client)
- All timestamps UTC; lock times server-enforced
- Audit log is insert-only (append-only integrity)

## Key Domain Rules
- Pre-tournament deadline: June 4, 2026 (1 week before WC)
- 104 total matches: 72 group + 16 R32 + 8 R16 + 4 QF + 2 SF + 2 (3rd+Final)
- Stage multipliers: group×1, R32×2, R16×3, QF×4, SF×5, Final×7
- Exact score = 5pts × multiplier; correct result = 2pts × multiplier
- Upset bonus = +3pts (flat, no multiplier)
- Champion rebuy: 1 per user, only when predicted champion eliminated
- Group standings: 5/3/2/1 per position, max 11pts/group = 132pts total
- 3rd-place qualifiers: pick 8 of 12, 3pts each = 24pts max

## Directory Layout
```
src/
  app/           # Next.js App Router pages
  components/
    ui/          # shadcn/ui primitives
    admin/       # Admin-only components
    predictions/ # Prediction forms
    leaderboard/ # Leaderboard/scoring UI
  lib/
    supabase/    # Supabase client + generated types
    scoring/     # Scoring logic (mirrored from edge function)
    utils/       # Date helpers, lock checkers, etc.
  types/         # Shared TypeScript interfaces
  hooks/         # Custom React hooks (realtime, auth)
supabase/
  functions/     # Edge Functions (compute-scores)
  migrations/    # SQL schema migrations
  seed/          # Seed data (48 teams, 104 matches)
docs/            # Architecture notes, scoring rules ref
```

## Env Vars Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

## Session Standards

### Constraint: Session Bootstrap
**ALWAYS** start a session by reading `plan.md` and `CHANGELOG.md` first.
Do NOT run `find`, `ls`, or directory scans to understand project state — those files already contain the full inventory of what exists, what's done, and what's pending.
Scanning the file tree wastes tokens and hits usage limits; the two docs are the canonical source of truth for session context.

### Constraint: PostgREST 1000-row cap (data integrity)
Supabase enforces a hard server-side row cap (`db-max-rows`, default 1000) that `.limit(n)` CANNOT exceed — the server silently truncates and the JS client gives no error. A bare `.select()` on a table that can exceed 1000 rows drops the newest rows (highest id), corrupting leaderboards, grids, and score tallies.

**Rule:** any *multi-row* read (NOT scoped by `.eq('user_id', …)`, `.maybeSingle()`, or `head:true` count) on a table that scales with users×matches or is insert-only MUST page via `fetchAll()` in `src/lib/supabase/admin.ts` (or the inline pager in the edge function), ordered by `id` for deterministic paging. Never trust a bare `.select()` or `.limit()` for these.

At-risk tables: `match_predictions` (≈25×104), `bet_suggestion_votes` (25×suggestions), `audit_log` (insert-only). Bounded/safe: `teams`, `groups`, `matches`, `scores`, `profiles`, and all `*_predictions` keyed one-per-user. If user count ever exceeds ~1000, re-audit every unbounded `profiles` read.
