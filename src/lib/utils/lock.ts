import type { SupabaseClient } from '@supabase/supabase-js'

const PRE_TOURNAMENT_LOCK = new Date('2026-06-07T00:00:00Z')

export function isPreTournamentLocked(): boolean {
  return new Date() >= PRE_TOURNAMENT_LOCK
}

export function isMatchLocked(lockedAt: string): boolean {
  return new Date() >= new Date(lockedAt)
}

// Returns the locked_at time of the last group-stage match.
// Qualifiers lock at this moment (15 min before last group kickoff).
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

// Returns the locked_at of each group's final-round match (max scheduled_at per group).
// Used for per-group locking of group standing predictions.
export async function getGroupFinalLockTimes(
  supabase: SupabaseClient
): Promise<Map<number, Date>> {
  const { data } = await supabase
    .from('matches')
    .select('group_id, scheduled_at, locked_at')
    .eq('stage', 'group')

  const maxScheduled = new Map<number, string>()
  for (const m of data ?? []) {
    if (!m.group_id || !m.scheduled_at) continue
    const cur = maxScheduled.get(m.group_id)
    if (!cur || m.scheduled_at > cur) maxScheduled.set(m.group_id, m.scheduled_at)
  }

  const result = new Map<number, Date>()
  for (const m of data ?? []) {
    if (!m.group_id || !m.locked_at) continue
    if (m.scheduled_at === maxScheduled.get(m.group_id)) {
      result.set(m.group_id, new Date(m.locked_at))
    }
  }
  return result
}

export function isGroupStageLocked(lockTime: Date | null): boolean {
  if (!lockTime) return false
  return new Date() >= lockTime
}

// Returns the locked_at time of the FIRST group-stage match (15 min before WC kickoff).
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

export async function getFirstR32MatchLockTime(
  supabase: SupabaseClient
): Promise<Date | null> {
  const { data } = await supabase
    .from('matches')
    .select('locked_at')
    .eq('stage', 'r32')
    .order('locked_at', { ascending: true })
    .limit(1)
    .single()
  return data?.locked_at ? new Date(data.locked_at) : null
}

export function isR32BetsLocked(lockTime: Date | null): boolean {
  if (!lockTime) return false
  return new Date() >= lockTime
}
