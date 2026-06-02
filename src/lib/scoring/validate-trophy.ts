import { getFlag } from '@/lib/teams/meta'

export type TrophyConflictType = 'eliminated_in_group' | 'not_in_qualifiers' | 'same_bracket_half'

export type TrophyConflict = {
  field: 'champion' | 'runner_up' | 'third_place'
  teamName: string
  teamFlag: string
  type: TrophyConflictType
  message: string // English fallback (used by admin panel)
  messageKey: string // i18n key under preTournament namespace
  messageParams: Record<string, string> // interpolation params (label resolved by component)
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

// Official 2026 FIFA World Cup bracket half assignments.
// Source: Wikipedia – 2026 FIFA World Cup knockout stage (R32 match schedule).
// Half 1 = teams that enter SF1 path (M101); Half 2 = SF2 path (M102).
// 3rd-place qualifiers have variable slots determined by which groups advance — not mapped here.
const BRACKET_HALF: Record<string, 1 | 2> = {
  A1: 1, A2: 1,
  B1: 2, B2: 1, // B is the only group split across halves on this side
  C1: 1, C2: 1,
  D1: 2, D2: 2,
  E1: 1, E2: 1,
  F1: 1, F2: 1,
  G1: 2, G2: 2,
  H1: 2, H2: 2,
  I1: 1, I2: 1,
  J1: 2, J2: 2,
  K1: 2, K2: 2,
  L1: 1, L2: 2, // L is split: 1L in Half 1, 2L in Half 2
}

function getGroupHalf(groupLetter: string, standing: StandingRow, teamId: number): 1 | 2 | null {
  const letter = groupLetter.slice(-1).toUpperCase()
  if (standing.predicted_1st === teamId) return BRACKET_HALF[`${letter}1`] ?? null
  if (standing.predicted_2nd === teamId) return BRACKET_HALF[`${letter}2`] ?? null
  return null // 3rd-place qualifiers → bracket slot is conditional, can't determine statically
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
        messageKey: 'conflictNotInQualifiers',
        messageParams: { flag, name: team.name, group: groupLetter },
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
        messageKey: 'conflictEliminatedInGroup',
        messageParams: { flag, name: team.name, group: groupLetter },
      })
    }
  }

  // Cross-pick check: champion and runner-up in the same bracket half → can't both reach the Final
  const champId    = picks.champion_team_id
  const runnerUpId = picks.runner_up_team_id
  if (champId && runnerUpId) {
    const champTeam = teams.find(t => t.id === champId)
    const ruTeam    = teams.find(t => t.id === runnerUpId)
    if (champTeam?.group_id && ruTeam?.group_id) {
      const champStanding = standingMap.get(champTeam.group_id)
      const ruStanding    = standingMap.get(ruTeam.group_id)
      const champLetter   = groupMap.get(champTeam.group_id) ?? ''
      const ruLetter      = groupMap.get(ruTeam.group_id) ?? ''
      if (champStanding && ruStanding && champLetter && ruLetter) {
        const champHalf = getGroupHalf(champLetter, champStanding, champId)
        const ruHalf    = getGroupHalf(ruLetter, ruStanding, runnerUpId)
        if (champHalf !== null && ruHalf !== null && champHalf === ruHalf) {
          const champFlag = getFlag(champTeam.code)
          const ruFlag    = getFlag(ruTeam.code)
          conflicts.push({
            field:    'runner_up',
            teamName: ruTeam.name,
            teamFlag: ruFlag,
            type:     'same_bracket_half',
            message:  `${champFlag} ${champTeam.name} and ${ruFlag} ${ruTeam.name} are on the same side of the 2026 bracket — they can meet at most in the semi-final, so they can't both be Champion and Runner-up.`,
            messageKey: 'conflictSameBracketHalf',
            messageParams: { champFlag, champName: champTeam.name, ruFlag, ruName: ruTeam.name },
          })
        }
      }
    }
  }

  return { valid: conflicts.length === 0, conflicts }
}
