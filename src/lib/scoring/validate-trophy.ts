import { getFlag } from '@/lib/teams/meta'

export type TrophyConflictType = 'eliminated_in_group' | 'not_in_qualifiers'

export type TrophyConflict = {
  field: 'champion' | 'runner_up' | 'third_place'
  teamName: string
  teamFlag: string
  type: TrophyConflictType
  message: string
}

export type TrophyValidationResult = {
  valid: boolean
  conflicts: TrophyConflict[]
}

type TeamRow     = { id: number; name: string; code: string; group_id: number | null }
type GroupRow    = { id: number; name: string }
type StandingRow = {
  group_id: number
  predicted_1st: number | null
  predicted_2nd: number | null
  predicted_3rd: number | null
  predicted_4th: number | null
}

const FIELD_LABELS: Record<'champion' | 'runner_up' | 'third_place', string> = {
  champion:    'Champion',
  runner_up:   'Runner-up',
  third_place: '3rd Place',
}

export function validateTrophyPicks(
  picks: {
    champion_team_id:    number | null
    runner_up_team_id:   number | null
    third_place_team_id: number | null
  },
  teams:          TeamRow[],
  groups:         GroupRow[],
  groupStandings: StandingRow[],
  qualifierIds:   number[]
): TrophyValidationResult {
  const conflicts: TrophyConflict[] = []

  const standingMap = new Map(groupStandings.map(s => [s.group_id, s]))
  const groupMap    = new Map(groups.map(g => [g.id, g.name]))

  const checks: { field: 'champion' | 'runner_up' | 'third_place'; teamId: number | null }[] = [
    { field: 'champion',    teamId: picks.champion_team_id },
    { field: 'runner_up',   teamId: picks.runner_up_team_id },
    { field: 'third_place', teamId: picks.third_place_team_id },
  ]

  for (const { field, teamId } of checks) {
    if (!teamId) continue

    const team = teams.find(t => t.id === teamId)
    if (!team || !team.group_id) continue

    const standing = standingMap.get(team.group_id)
    if (!standing) continue // group not yet predicted — skip silently

    const groupLetter = groupMap.get(team.group_id) ?? String(team.group_id)
    const flag = getFlag(team.code)
    const label = FIELD_LABELS[field]

    if (standing.predicted_1st === teamId || standing.predicted_2nd === teamId) {
      continue // advances directly ✓
    }

    if (standing.predicted_3rd === teamId) {
      if (qualifierIds.includes(teamId)) continue // advances as 3rd-place qualifier ✓
      conflicts.push({
        field,
        teamName: team.name,
        teamFlag: flag,
        type: 'not_in_qualifiers',
        message: `${label}: ${flag} ${team.name} is predicted 3rd in Group ${groupLetter} but isn't in your 3rd-place qualifier picks — they may not advance.`,
      })
      continue
    }

    if (standing.predicted_4th === teamId) {
      conflicts.push({
        field,
        teamName: team.name,
        teamFlag: flag,
        type: 'eliminated_in_group',
        message: `${label}: ${flag} ${team.name} is predicted 4th in Group ${groupLetter} — they will be eliminated in the group stage.`,
      })
    }
  }

  return { valid: conflicts.length === 0, conflicts }
}
