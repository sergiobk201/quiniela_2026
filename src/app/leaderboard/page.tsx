import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaderboardTable from './leaderboard-table'
import { getFlag } from '@/lib/teams/meta'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: scores }, { data: champPreds }] = await Promise.all([
    supabase
      .from('scores')
      .select(`
        user_id, pre_tournament_points, group_stage_points,
        knockout_points, rebuy_points, total_points, last_computed_at,
        profile:profiles(display_name)
      `)
      .order('total_points', { ascending: false }),
    // RLS: returns own row pre-lock, all rows after lock (locked = TRUE)
    supabase
      .from('pre_tournament_predictions')
      .select('user_id, team:teams!champion_team_id(code)'),
  ])

  const champMap = new Map<string, string>()
  for (const c of champPreds ?? []) {
    const code = (c.team as unknown as { code: string } | null)?.code
    if (code) champMap.set(c.user_id, code)
  }

  const rows = (scores ?? []).map((s, i) => {
    const championCode = champMap.get(s.user_id) ?? null
    return {
      rank: i + 1,
      userId: s.user_id,
      displayName: (s.profile as unknown as { display_name: string } | null)?.display_name ?? 'Unknown',
      championFlag: championCode ? getFlag(championCode) : null,
      preTournament: s.pre_tournament_points ?? 0,
      groupStage: s.group_stage_points ?? 0,
      knockout: s.knockout_points ?? 0,
      rebuy: s.rebuy_points ?? 0,
      total: s.total_points ?? 0,
      isCurrentUser: s.user_id === user.id,
    }
  })

  const top3 = rows.slice(0, 3)
  const userRow = rows.find((r) => r.isCurrentUser)
  const userNotInTop3 = userRow && userRow.rank > 3

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Updates live · {rows.length} participants
        </p>
      </div>

      {/* Podium — top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[top3[1], top3[0], top3[2]].map((row, podiumPos) =>
            row ? (
              <div
                key={row.userId}
                className={`rounded-lg border p-4 text-center space-y-1 ${
                  podiumPos === 1 ? 'border-yellow-500/50 bg-yellow-500/5' :
                  podiumPos === 0 ? 'border-slate-400/50 bg-slate-400/5' :
                                   'border-amber-700/50 bg-amber-700/5'
                } ${row.isCurrentUser ? 'ring-2 ring-[var(--champion-primary,hsl(var(--primary)))]' : ''}`}
              >
                <p className="text-2xl">{podiumPos === 1 ? '🥇' : podiumPos === 0 ? '🥈' : '🥉'}</p>
                <p className="text-sm font-semibold truncate">
                  {row.championFlag && <span className="mr-1">{row.championFlag}</span>}
                  {row.displayName}
                </p>
                <p className="text-xl font-bold">{row.total} pts</p>
              </div>
            ) : <div key={podiumPos} />
          )}
        </div>
      )}

      {/* User's own rank if outside top 3 */}
      {userNotInTop3 && userRow && (
        <div
          className="rounded-lg border p-3 flex items-center justify-between"
          style={{ borderColor: 'var(--champion-primary, hsl(var(--border)))' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground">#{userRow.rank}</span>
            <span className="font-medium">
              {userRow.championFlag && <span className="mr-1">{userRow.championFlag}</span>}
              {userRow.displayName} <span className="text-xs text-muted-foreground">(you)</span>
            </span>
          </div>
          <span className="font-bold">{userRow.total} pts</span>
        </div>
      )}

      <LeaderboardTable initialRows={rows} currentUserId={user.id} />
    </div>
  )
}
