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
  upset: boolean
): number {
  let pts = 0
  if (predicted.home === actual.home && predicted.away === actual.away) {
    pts += 5 * multiplier
  } else if (resultSign(predicted.home, predicted.away) === resultSign(actual.home, actual.away)) {
    pts += 2 * multiplier
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
