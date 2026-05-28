import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { isPreTournamentLocked } from '@/lib/utils/lock'
import LeaderboardTable from './leaderboard-table'
import PicksGrid, { type PlayerPick, type GroupStandingsRow, type MatchRow } from './picks-grid'
import { getFlag } from '@/lib/teams/meta'

export const dynamic = 'force-dynamic'

const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage', r32: 'R32', r16: 'R16',
  qf: 'QF', sf: 'SF', '3rd': '3rd', final: 'Final',
}

export default async function LeaderboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const picksVisible = isPreTournamentLocked()

  // Core leaderboard data — always fetched
  const [{ data: scores }, { data: champPreds }] = await Promise.all([
    admin
      .from('scores')
      .select(`
        user_id, pre_tournament_points, group_stage_points,
        knockout_points, rebuy_points, total_points, last_computed_at,
        profile:profiles(display_name)
      `)
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

  // Picks grid data — always fetched (gate is UI-only)
  const [
    { data: allTeams },
    { data: allGroups },
    { data: allMatches },
    { data: prePreds },
    { data: standingsPreds },
    { data: qualifierPreds },
    { data: matchPreds },
    { data: rebuys },
    { data: allProfiles },
  ] = await Promise.all([
    admin.from('teams').select('id, name, code'),
    admin.from('groups').select('id, name').order('name'),
    admin.from('matches').select('id, stage, scheduled_at, home_team:teams!home_team_id(name, code), away_team:teams!away_team_id(name, code)').order('scheduled_at'),
    admin.from('pre_tournament_predictions').select('*'),
    admin.from('group_standing_predictions').select('*'),
    admin.from('third_place_qualifier_predictions').select('user_id, team_ids'),
    admin.from('match_predictions').select('user_id, match_id, predicted_home_score, predicted_away_score'),
    admin.from('champion_rebuys').select('user_id, team_id'),
    admin.from('profiles').select('id, display_name').order('display_name'),
  ])

  // Build lookup maps
  const teamName = new Map((allTeams ?? []).map(t => [t.id, t.name]))
  const teamCode = new Map((allTeams ?? []).map(t => [t.id, t.code]))

  function flaggedTeam(id: number | null | undefined): string {
    if (!id) return '—'
    const name = teamName.get(id)
    const code = teamCode.get(id)
    return name ? (code ? `${getFlag(code)} ${name}` : name) : '—'
  }

  // players list: ranked users first, then everyone else from profiles alphabetically
  // decoupled from scores so the grid works even before scoring runs
  const scoredUserIds = new Set((scores ?? []).map(s => s.user_id))
  const rankedPlayers = rows.map(r => ({ userId: r.userId, displayName: r.displayName }))
  const unrankedPlayers = (allProfiles ?? [])
    .filter(p => !scoredUserIds.has(p.id))
    .map(p => ({ userId: p.id, displayName: p.display_name ?? 'Unknown' }))
  const players = [...rankedPlayers, ...unrankedPlayers]

  // Pre-tournament picks per user
  const playerPicks: PlayerPick[] = players.map(p => {
    const pre = (prePreds ?? []).find(r => r.user_id === p.userId)
    const qual = (qualifierPreds ?? []).find(r => r.user_id === p.userId)
    const rebuy = (rebuys ?? []).find(r => r.user_id === p.userId)
    return {
      userId: p.userId,
      displayName: p.displayName,
      preTournament: pre ? {
        champion: flaggedTeam(pre.champion_team_id),
        runnerUp: flaggedTeam(pre.runner_up_team_id),
        thirdPlace: flaggedTeam(pre.third_place_team_id),
        goldenBoot: pre.golden_boot_player ?? '',
        goldenGlove: pre.golden_glove_player ?? '',
        kopa: pre.kopa_player ?? '',
        totalGoals: pre.total_goals_prediction?.toString() ?? '—',
        firstEliminated: flaggedTeam(pre.first_eliminated_team_id),
        mostYellows: flaggedTeam(pre.most_yellows_team_id),
      } : null,
      qualifiers: ((qual?.team_ids ?? []) as number[]).map(id => flaggedTeam(id)),
      rebuy: rebuy ? flaggedTeam(rebuy.team_id) : null,
    }
  })

  // Group standings — one row per group, picks for each player
  const groupStandings: GroupStandingsRow[] = (allGroups ?? []).map(g => ({
    groupId: g.id,
    groupName: g.name,
    picks: players.map(p => {
      const s = (standingsPreds ?? []).find(r => r.user_id === p.userId && r.group_id === g.id)
      return {
        userId: p.userId,
        pos1: s ? flaggedTeam(s.predicted_1st) : '—',
        pos2: s ? flaggedTeam(s.predicted_2nd) : '—',
        pos3: s ? flaggedTeam(s.predicted_3rd) : '—',
        pos4: s ? flaggedTeam(s.predicted_4th) : '—',
      }
    }),
  }))

  // Match predictions — one row per match, predictions per player
  // Only expose predictions for locked matches (59 min before kickoff) to prevent copying
  const now = Date.now()
  const matchRows: MatchRow[] = (allMatches ?? []).map(m => {
    const home = m.home_team as unknown as { name: string; code: string } | null
    const away = m.away_team as unknown as { name: string; code: string } | null
    const date = new Date(m.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    const matchLocked = now >= new Date(m.scheduled_at).getTime() - 59 * 60 * 1000
    return {
      matchId: m.id,
      stage: m.stage as string,
      homeTeam: home ? `${getFlag(home.code)} ${home.code}` : 'TBD',
      awayTeam: away ? `${getFlag(away.code)} ${away.code}` : 'TBD',
      label: `${STAGE_LABELS[m.stage as string] ?? m.stage} · ${date}`,
      predictions: matchLocked
        ? (matchPreds ?? [])
            .filter(mp => mp.match_id === m.id)
            .map(mp => ({ userId: mp.user_id, home: mp.predicted_home_score, away: mp.predicted_away_score }))
        : [],
    }
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Updates live · {players.length} participants
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

      {/* Picks comparison grid */}
      <div className="border-t border-border pt-6">
        <PicksGrid
          players={players}
          playerPicks={playerPicks}
          groupStandings={groupStandings}
          matches={matchRows}
          picksVisible={picksVisible}
        />
      </div>
    </div>
  )
}
