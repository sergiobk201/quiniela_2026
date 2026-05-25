// Scoring defaults applied by the Edge Function when no prediction exists.
// Single source of truth for both server-side scoring and client-side display hints.

export const SCORING_DEFAULTS = {
  // No match prediction submitted → count as 0-0 (earns 0 pts, not penalized)
  missingMatchScore: { home: 0, away: 0 },

  // Knockout match where predicted score is a tie (no winner) →
  // home team advances by minimum difference (1-0 applied at scoring time)
  knockoutTiebreakerTeam: 'home' as const,
  knockoutTiebreakerScore: { home: 1, away: 0 },

  // Pre-tournament picks not submitted → 0 pts for that category.
  // Exception: champion is recoverable via the rebuy mechanic.
  missingPreTournamentPoints: 0,
} as const

export const STAGE_MULTIPLIERS: Record<string, number> = {
  group: 1,
  r32: 2,
  r16: 3,
  qf: 4,
  sf: 5,
  '3rd': 5,
  final: 7,
}

export const POINTS = {
  exactScore: 5,       // × stage_multiplier
  correctResult: 2,    // × stage_multiplier
  upsetBonus: 3,       // flat, no multiplier
  groupStanding: { first: 5, second: 3, third: 2, fourth: 1 },
  thirdPlaceQualifier: 3, // per correct pick, 8 picks max = 24 pts total
} as const
