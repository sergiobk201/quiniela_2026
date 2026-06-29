// Pure scoring functions — no Supabase deps.
// Mirrored in src/lib/scoring/engine.ts for reference.

export type MatchResult = { home: number; away: number }

function resultSign(h: number, a: number): number {
  return h > a ? 1 : h < a ? -1 : 0
}

export function scoreMatch(
  predicted: MatchResult,
  actual: MatchResult,
  multiplier: number,
  upset: boolean,
  actualWinnerId?: number | null,
  predictedWinnerId?: number | null,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
): number {
  let pts = 0

  // Knockout draw: actual 90-min ended in a tie → winner by ET/penalties.
  // "Correct result" requires predicting a draw AND the correct advancing team.
  // "Exact score" requires the exact 90-min scoreline AND the correct advancing team.
  if (actual.home === actual.away && actualWinnerId != null) {
    const correctWinner = predictedWinnerId != null && predictedWinnerId === actualWinnerId
    if (predicted.home === actual.home && predicted.away === actual.away && correctWinner) {
      pts += 5 * multiplier
    } else if (predicted.home === predicted.away && correctWinner) {
      pts += 2 * multiplier
    }
  } else {
    if (predicted.home === actual.home && predicted.away === actual.away) {
      pts += 5 * multiplier
    } else if (resultSign(predicted.home, predicted.away) === resultSign(actual.home, actual.away)) {
      pts += 2 * multiplier
    } else if (
      predictedWinnerId != null &&
      predicted.home === predicted.away &&
      actual.home !== actual.away
    ) {
      // User predicted a tie + picked a winner; actual was a regulation win.
      // Award "correct result" if their winner matches the team that actually won.
      const regulationWinner = actual.home > actual.away ? homeTeamId : awayTeamId
      if (regulationWinner != null && predictedWinnerId === regulationWinner) {
        pts += 2 * multiplier
      }
    }
  }

  // Upset bonus: only when user got the result right
  if (upset && pts > 0) pts += 3
  return pts
}

export function scoreGroupStanding(
  predicted: (number | null)[],  // [1st, 2nd, 3rd, 4th] team IDs
  actual: number[]               // [1st, 2nd, 3rd, 4th] team IDs
): number {
  const PTS = [5, 3, 2, 1]
  return predicted.reduce<number>(
    (sum, id, i) => sum + (id !== null && id === actual[i] ? PTS[i] : 0),
    0
  )
}

export function scoreThirdPlaceQualifiers(
  predicted: number[],
  actualSet: Set<number>
): number {
  return predicted.filter((id) => actualSet.has(id)).length * 3
}

export type GroupMatch = {
  group_id: number | null
  home_team_id: number | null
  away_team_id: number | null
  home_score: number
  away_score: number
}

export function computeActualGroupStandings(
  matches: GroupMatch[]
): Map<number, number[]> {
  type Stats = { pts: number; gd: number; gf: number }
  const table = new Map<number, Map<number, Stats>>()

  for (const m of matches) {
    if (!m.group_id || m.home_team_id == null || m.away_team_id == null) continue
    if (!table.has(m.group_id)) table.set(m.group_id, new Map())
    const grp = table.get(m.group_id)!

    if (!grp.has(m.home_team_id)) grp.set(m.home_team_id, { pts: 0, gd: 0, gf: 0 })
    if (!grp.has(m.away_team_id)) grp.set(m.away_team_id, { pts: 0, gd: 0, gf: 0 })

    const h = grp.get(m.home_team_id)!
    const a = grp.get(m.away_team_id)!

    h.gf += m.home_score; h.gd += m.home_score - m.away_score
    a.gf += m.away_score; a.gd += m.away_score - m.home_score

    if (m.home_score > m.away_score) h.pts += 3
    else if (m.home_score === m.away_score) { h.pts += 1; a.pts += 1 }
    else a.pts += 3
  }

  const result = new Map<number, number[]>()
  for (const [groupId, teams] of table) {
    const sorted = [...teams.entries()]
      .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .map(([id]) => id)
    result.set(groupId, sorted)
  }
  return result
}
