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

  // Knockout match decided in ET/penalties: actual 90-min ended in a tie and an
  // advancing team (actualWinnerId) is set. A user earns points by naming the team
  // that advanced — REGARDLESS of how they expressed it:
  //   • predicted a tie  → advancing team = their explicit tiebreaker pick.
  //   • predicted a win  → advancing team = whoever they scored higher (implied).
  if (actual.home === actual.away && actualWinnerId != null) {
    if (predicted.home === predicted.away) {
      // Predicted a tie. Winner pick: correct → full points; wrong → 0 (wrong team
      // advances); absent → graceful (teams may have been TBD at prediction time).
      const wrongWinner = predictedWinnerId != null && predictedWinnerId !== actualWinnerId
      if (!wrongWinner) {
        if (predicted.home === actual.home) {
          pts += 5 * multiplier  // exact tie scoreline + correct advancing team
        } else {
          pts += 2 * multiplier  // correct advancing team, wrong scoreline
        }
      }
    } else {
      // Predicted a regulation win → implied advancing team is whoever they scored
      // higher. Award correct-result if that team is the one that actually advanced.
      const predictedAdvancer = predicted.home > predicted.away ? homeTeamId : awayTeamId
      if (predictedAdvancer != null && predictedAdvancer === actualWinnerId) {
        pts += 2 * multiplier
      }
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
