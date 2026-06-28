import { getUser } from '@/lib/supabase/server'
import { createAdminClient, fetchAll } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { isPreTournamentLocked, getFirstGroupMatchLockTime, isCommunityBetsLocked } from '@/lib/utils/lock'
import LeaderboardTable from './leaderboard-table'
import PicksGrid, { type PlayerPick, type GroupStandingsRow, type MatchRow } from './picks-grid'
import DailyGrid, { type DailyMatch, type DailyPlayer, type DailyPrediction } from './daily-grid'
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
  // match_predictions is paged separately: it exceeds PostgREST's hard 1000-row cap
  // (~25 users × up to 104 matches), and `.limit()` cannot beat that cap — late
  // predictions (high id) get silently dropped. fetchAll() pages past it. Ordered by
  // id so pagination is deterministic (no overlap/skip between pages).
  const [
    { data: allTeams },
    { data: allGroups },
    { data: allMatches },
    { data: prePreds },
    { data: standingsPreds },
    { data: qualifierPreds },
    matchPreds,
    { data: rebuys },
    { data: allProfiles },
    communityBetsLockTime,
  ] = await Promise.all([
    admin.from('teams').select('id, name, code'),
    admin.from('groups').select('id, name').order('name'),
    admin.from('matches').select('id, stage, scheduled_at, home_team:teams!home_team_id(name, code), away_team:teams!away_team_id(name, code)').order('scheduled_at'),
    admin.from('pre_tournament_predictions').select('*'),
    admin.from('group_standing_predictions').select('*'),
    admin.from('third_place_qualifier_predictions').select('user_id, team_ids'),
    fetchAll<{ user_id: string; match_id: number; predicted_home_score: number; predicted_away_score: number }>(
      (from, to) =>
        admin
          .from('match_predictions')
          .select('user_id, match_id, predicted_home_score, predicted_away_score')
          .order('id', { ascending: true })
          .range(from, to)
    ),
    admin.from('champion_rebuys').select('user_id, team_id'),
    admin.from('profiles').select('id, display_name').order('display_name'),
    getFirstGroupMatchLockTime(admin),
  ])

  // Build lookup maps
  const teamName = new Map((allTeams ?? []).map(t => [t.id, t.name]))
  const teamCode = new Map((allTeams ?? []).map(t => [t.id, t.code]))

  // Fill champion flag for rebuy-only users (no pre-tournament prediction)
  for (const r of rebuys ?? []) {
    if (!champMap.has(r.user_id)) {
      const code = teamCode.get(r.team_id)
      if (code) champMap.set(r.user_id, code)
    }
  }

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
        firstGoalScorer: pre.first_goal_scorer ?? '—',
        firstRedCard: pre.first_red_card_player ?? '—',
        totalRedCards: pre.total_red_cards_prediction?.toString() ?? '—',
        finalToPenalties: pre.final_goes_to_penalties === true ? '✓' : pre.final_goes_to_penalties === false ? '✗' : '—',
        totalOwnGoals: pre.total_own_goals_prediction?.toString() ?? '—',
        mostGoalsTeam: flaggedTeam(pre.most_goals_team_id),
      } : null,
      qualifiers: ((qual?.team_ids ?? []) as number[]).map(id => flaggedTeam(id)),
      rebuy: rebuy ? flaggedTeam(rebuy.team_id) : null,
      communityBets: pre ? {
        balonDeOro: pre.community_balon_de_oro ?? '',
        revelacion: flaggedTeam(pre.community_revelacion_team_id),
        decepcion: flaggedTeam(pre.community_decepcion_team_id),
        r32UsaToR16: pre.r32_usa_to_r16 == null ? '—' : pre.r32_usa_to_r16 ? 'Yes' : 'No',
        r32WorstPredictor: pre.r32_worst_predictor ?? '',
        r32WorstRanked: flaggedTeam(pre.r32_worst_ranked_team_id),
      } : null,
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
    const matchLocked = now >= new Date(m.scheduled_at).getTime() - 14 * 60 * 1000
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

  // Daily prediction grid — today's locked matches only
  const todayUTC = new Date().toISOString().slice(0, 10)
  const todayLockedIds = new Set<number>()
  const dailyMatches: DailyMatch[] = (allMatches ?? [])
    .filter(m => {
      const matchDateUTC = new Date(m.scheduled_at).toISOString().slice(0, 10)
      const lockTime = new Date(m.scheduled_at).getTime() - 14 * 60 * 1000
      return matchDateUTC === todayUTC && now >= lockTime
    })
    .map(m => {
      todayLockedIds.add(m.id)
      const home = m.home_team as unknown as { name: string; code: string } | null
      const away = m.away_team as unknown as { name: string; code: string } | null
      return {
        matchId: m.id,
        homeCode: home?.code ?? null,
        awayCode: away?.code ?? null,
        kickoff: m.scheduled_at,
      }
    })

  const dailyPlayers: DailyPlayer[] = players.map(p => {
    const code = champMap.get(p.userId)
    return { userId: p.userId, displayName: p.displayName, championFlag: code ? getFlag(code) : null }
  })

  const dailyPredictions: DailyPrediction[] = (matchPreds ?? [])
    .filter(mp => todayLockedIds.has(mp.match_id))
    .map(mp => ({ userId: mp.user_id, matchId: mp.match_id, home: mp.predicted_home_score, away: mp.predicted_away_score }))

  const dailyDate = dailyMatches.length > 0
    ? new Date(todayUTC).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
    : ''

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

      {/* Daily prediction grid */}
      {dailyMatches.length > 0 && (
        <div className="border-t border-border pt-6">
          <DailyGrid
            date={dailyDate}
            matches={dailyMatches}
            players={dailyPlayers}
            predictions={dailyPredictions}
          />
        </div>
      )}

      {/* Picks comparison grid */}
      <div className="border-t border-border pt-6">
        <PicksGrid
          players={players}
          playerPicks={playerPicks}
          groupStandings={groupStandings}
          matches={matchRows}
          picksVisible={picksVisible}
          communityBetsLocked={isCommunityBetsLocked(communityBetsLockTime)}
        />
      </div>
    </div>
  )
}
