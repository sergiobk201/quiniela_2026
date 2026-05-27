import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFlag } from '@/lib/teams/meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const MEDALS = ['🥇', '🥈', '🥉']

export async function LeaderboardMiniWidget() {
  const user = await getUser()
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
    isCurrentUser: s.user_id === user?.id,
  }))

  const top3 = rows.slice(0, 3)
  const userRow = rows.find((r) => r.isCurrentUser)
  const userOutsideTop3 = userRow && userRow.rank > 3

  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Leaderboard</CardTitle>
        <Link href="/leaderboard" className="text-xs text-primary hover:underline">
          Full standings →
        </Link>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {top3.map((row) => (
          <div
            key={row.userId}
            className="flex items-center justify-between rounded-md px-3 py-2"
            style={{
              background: row.isCurrentUser
                ? 'color-mix(in oklch, var(--champion-primary) 10%, transparent)'
                : 'hsl(var(--muted) / 0.4)',
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span>{MEDALS[row.rank - 1]}</span>
              {row.championFlag && <span>{row.championFlag}</span>}
              <span className={row.isCurrentUser ? 'font-semibold' : ''}>
                {row.displayName}
                {row.isCurrentUser && (
                  <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                )}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums">{row.total} pts</span>
          </div>
        ))}

        {userOutsideTop3 && userRow && (
          <>
            <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground px-1">
              <div className="flex-1 border-t border-dashed border-border" />
              <span>your rank</span>
              <div className="flex-1 border-t border-dashed border-border" />
            </div>
            <div
              className="flex items-center justify-between rounded-md px-3 py-2"
              style={{ background: 'color-mix(in oklch, var(--champion-primary) 10%, transparent)' }}
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-muted-foreground w-7">#{userRow.rank}</span>
                {userRow.championFlag && <span>{userRow.championFlag}</span>}
                <span className="font-semibold">
                  {userRow.displayName}
                  <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                </span>
              </div>
              <span className="text-sm font-bold tabular-nums">{userRow.total} pts</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
