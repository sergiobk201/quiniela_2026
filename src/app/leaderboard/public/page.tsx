import { createAdminClient } from '@/lib/supabase/admin'
import { getFlag } from '@/lib/teams/meta'
import { CopyUrlButton } from './copy-url-button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quiniela2026.space'
const PUBLIC_URL = `${SITE_URL}/leaderboard/public`

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default async function PublicLeaderboardPage() {
  const admin = createAdminClient()

  const [{ data: scores }, { data: champPreds }] = await Promise.all([
    admin
      .from('scores')
      .select('user_id, total_points, profile:profiles(display_name)')
      .order('total_points', { ascending: false }),
    admin
      .from('pre_tournament_predictions')
      .select('user_id, team:teams!champion_team_id(code)'),
  ])

  const champMap = new Map<string, string>()
  for (const c of champPreds ?? []) {
    const code = (c.team as unknown as { code: string } | null)?.code
    if (code) champMap.set(c.user_id, code)
  }

  const rows = (scores ?? []).map((s, i) => ({
    rank: i + 1,
    userId: s.user_id,
    displayName: (s.profile as unknown as { display_name: string } | null)?.display_name ?? 'Unknown',
    championFlag: champMap.has(s.user_id) ? getFlag(champMap.get(s.user_id)!) : null,
    total: s.total_points ?? 0,
  }))

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">⚽ Quiniela 2026</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live standings · {rows.length} participants
        </p>
      </div>

      {/* Share bar */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <p className="text-xs text-muted-foreground truncate">{PUBLIC_URL}</p>
        <CopyUrlButton url={PUBLIC_URL} />
      </div>

      {/* Ranked table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_5rem] text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border bg-muted/30">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Points</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.userId}
            className="grid grid-cols-[3rem_1fr_5rem] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
          >
            <span className="text-sm font-bold text-muted-foreground">
              {MEDALS[row.rank] ?? `#${row.rank}`}
            </span>
            <span className="text-sm font-medium flex items-center gap-1.5">
              {row.championFlag && <span>{row.championFlag}</span>}
              {row.displayName}
            </span>
            <span className="text-sm font-bold tabular-nums text-right">{row.total}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">Want to see the full breakdown?</p>
        <Link
          href="/login"
          className="text-sm text-primary hover:underline font-medium"
        >
          Sign in to Quiniela 2026 →
        </Link>
      </div>
    </div>
  )
}
