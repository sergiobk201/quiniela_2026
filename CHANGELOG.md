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

## Session Log: 2026-05-25

### Major Lessons Learned Today

| | Approach |
|---|---|
| **Incorrect** | Running `find`/`ls` directory scans at session start to understand project state |
| **Correct** | Read `plan.md` + `CHANGELOG.md` first — they are the canonical source of truth for what files exist, what's complete, and what's pending |
| **Why** | Directory scans waste tokens and hit usage limits; the plan and changelog already contain the full project inventory and status |
