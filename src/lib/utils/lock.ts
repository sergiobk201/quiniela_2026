const PRE_TOURNAMENT_LOCK = new Date('2026-05-26T00:00:00Z')

export function isPreTournamentLocked(): boolean {
  return new Date() >= PRE_TOURNAMENT_LOCK
}

export function isMatchLocked(lockedAt: string): boolean {
  return new Date() >= new Date(lockedAt)
}
