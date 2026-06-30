// Mirror of supabase/functions/compute-scores/scoring.ts
// Authoritative computation lives in the Edge Function.
// Use this file for display, testing, and client-side previews only.

export type MatchResult = { home: number; away: number }

export const PRE_TOURNAMENT_PTS = {
  champion: 15,
  runnerUp: 10,
  thirdPlace: 7,
  goldenBoot: 5,
  goldenGlove: 5,
  kopa: 5,
  totalGoalsExact: 10,
  totalGoalsClose: 5,
  firstEliminated: 5,
  mostYellows: 5,
  r32UsaToR16: 2,
  r32WorstPredictor: 2,
  r32WorstRanked: 3,
} as const

// Max possible points per category (for progress bars / display)
export const MAX_POINTS = {
  preTournamentTrophy: 15 + 10 + 7 + 5 + 5 + 5 + 10 + 5 + 5, // 67
  groupStandings: 11 * 12,  // 132  (max 11pts/group × 12 groups)
  thirdQualifiers: 3 * 8,   // 24
  groupMatches: 5 * 1 * 72, // 360 (exact score × multiplier 1 × 72 matches, ignores upset bonus)
  knockoutMatches: 5 * 7,   // 35  (final alone, just for reference)
} as const

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

  if (upset && pts > 0) pts += 3
  return pts
}

export function scoreGroupStanding(
  predicted: (number | null)[],
  actual: number[]
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
