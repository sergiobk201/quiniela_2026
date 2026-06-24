import { getUser, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isPreTournamentLocked, isGroupStageLocked } from '@/lib/utils/lock'
import { validateTrophyPicks, type TrophyConflict } from '@/lib/scoring/validate-trophy'
import { computeGroupStandings, type StandingsRow } from '@/lib/scoring/group-standings'
import { LocalDateTime } from '@/components/ui/local-time'
import PreTournamentForm from './pre-tournament-form'

export const dynamic = 'force-dynamic'

export default async function PreTournamentPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: teams },
    { data: groups },
    { data: prediction },
    { data: standings },
    { data: qualifiers },
    { data: matchPredictions },
    { data: groupMatches },
  ] = await Promise.all([
    supabase.from('teams').select('id, name, code, group_id').order('name'),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('pre_tournament_predictions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('group_standing_predictions').select('*').eq('user_id', user.id),
    supabase
      .from('third_place_qualifier_predictions')
      .select('team_ids')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('match_predictions')
      .select('match_id, predicted_home_score, predicted_away_score')
      .eq('user_id', user.id),
    supabase
      .from('matches')
      .select('id, group_id, scheduled_at, locked_at, home_team:teams!home_team_id(id, name, code), away_team:teams!away_team_id(id, name, code)')
      .eq('stage', 'group'),
  ])

  // Derive lock times from already-fetched groupMatches (no extra DB round-trip).
  // groupStageLockTime = MAX locked_at across all group matches (qualifiers gate).
  // lockedGroupIds     = groups whose final-round match locked_at has already passed.
  const maxScheduledPerGroup = new Map<number, string>()
  for (const m of groupMatches ?? []) {
    const gid = (m as any).group_id as number | null
    const sa = (m as any).scheduled_at as string | undefined
    if (!gid || !sa) continue
    const cur = maxScheduledPerGroup.get(gid)
    if (!cur || sa > cur) maxScheduledPerGroup.set(gid, sa)
  }
  let groupStageLockTime: Date | null = null
  const lockedGroupIds = new Set<number>()
  const now = new Date()
  for (const m of groupMatches ?? []) {
    const gid = (m as any).group_id as number | null
    const sa = (m as any).scheduled_at as string | undefined
    const la = (m as any).locked_at as string | undefined
    if (!gid || !la) continue
    const lockDate = new Date(la)
    if (!groupStageLockTime || lockDate > groupStageLockTime) groupStageLockTime = lockDate
    if (sa && sa === maxScheduledPerGroup.get(gid) && now >= lockDate) {
      lockedGroupIds.add(gid)
    }
  }

  // Build computed standings from match predictions
  const scoresMap: Record<number, { home: string; away: string }> = {}
  for (const mp of matchPredictions ?? []) {
    if (mp.predicted_home_score != null && mp.predicted_away_score != null) {
      scoresMap[mp.match_id] = {
        home: mp.predicted_home_score.toString(),
        away: mp.predicted_away_score.toString(),
      }
    }
  }
  const computedByGroup: Record<number, StandingsRow[]> = {}
  for (const g of groups ?? []) {
    const gm = (groupMatches ?? []).filter((m: any) => m.group_id === g.id)
    computedByGroup[g.id] = computeGroupStandings(gm as any, scoresMap)
  }

  let initialWarnings: TrophyConflict[] = []
  if (prediction?.champion_team_id || prediction?.runner_up_team_id || prediction?.third_place_team_id) {
    const { conflicts } = validateTrophyPicks(
      {
        champion_team_id:    prediction.champion_team_id ?? null,
        runner_up_team_id:   prediction.runner_up_team_id ?? null,
        third_place_team_id: prediction.third_place_team_id ?? null,
      },
      (teams ?? []) as { id: number; name: string; code: string; group_id: number | null }[],
      (groups ?? []) as { id: number; name: string }[],
      (standings ?? []) as any[],
      ((qualifiers as any)?.team_ids ?? []) as number[]
    )
    initialWarnings = conflicts
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pre-Tournament Predictions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Trophy picks lock <LocalDateTime iso="2026-06-07T00:00:00Z" /> ·{' '}
          Standings &amp; qualifiers lock after the last group stage match
        </p>
      </div>
      <PreTournamentForm
        teams={(teams ?? []) as { id: number; name: string; code: string; group_id: number | null }[]}
        groups={(groups ?? []) as { id: number; name: string }[]}
        prediction={prediction as any}
        standings={(standings ?? []) as any[]}
        qualifierTeamIds={(qualifiers as any)?.team_ids ?? []}
        trophyLocked={isPreTournamentLocked()}
        groupStageLocked={isGroupStageLocked(groupStageLockTime)}
        lockedGroupIds={Array.from(lockedGroupIds)}
        initialWarnings={initialWarnings}
        computedByGroup={computedByGroup}
      />
    </div>
  )
}
