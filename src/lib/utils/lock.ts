import type { SupabaseClient } from '@supabase/supabase-js'

const PRE_TOURNAMENT_LOCK = new Date('2026-06-07T00:00:00Z')

export function isPreTournamentLocked(): boolean {
  return new Date() >= PRE_TOURNAMENT_LOCK
}

export function isMatchLocked(lockedAt: string): boolean {
  return new Date() >= new Date(lockedAt)
}

// Returns the locked_at time of the last group-stage match.
// Standings and qualifiers lock at this moment (1hr before last group kickoff).
export async function getGroupStageLockTime(
  supabase: SupabaseClient
): Promise<Date | null> {
  const { data } = await supabase
    .from('matches')
    .select('locked_at')
    .eq('stage', 'group')
    .order('locked_at', { ascending: false })
    .limit(1)
    .single()
  return data?.locked_at ? new Date(data.locked_at) : null
}

export function isGroupStageLocked(lockTime: Date | null): boolean {
  if (!lockTime) return false
  return new Date() >= lockTime
}

// Returns the locked_at time of the FIRST group-stage match (1h before WC kickoff).
// Community bets lock at this moment.
export async function getFirstGroupMatchLockTime(
  supabase: SupabaseClient
): Promise<Date | null> {
  const { data } = await supabase
    .from('matches')
    .select('locked_at')
    .eq('stage', 'group')
    .order('locked_at', { ascending: true })
    .limit(1)
    .single()
  return data?.locked_at ? new Date(data.locked_at) : null
}

export function isCommunityBetsLocked(lockTime: Date | null): boolean {
  if (!lockTime) return false
  return new Date() >= lockTime
}
