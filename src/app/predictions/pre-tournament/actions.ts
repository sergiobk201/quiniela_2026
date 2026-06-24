'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isPreTournamentLocked, getGroupStageLockTime, isGroupStageLocked, getGroupFinalLockTimes } from '@/lib/utils/lock'
import { validateTrophyPicks, type TrophyConflict } from '@/lib/scoring/validate-trophy'
import { logAudit } from '@/lib/supabase/audit'

async function checkLocked(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  if (isPreTournamentLocked()) return true
  const { data } = await supabase
    .from('pre_tournament_predictions')
    .select('locked')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.locked === true
}

async function checkGroupStageLocked(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  return isGroupStageLocked(await getGroupStageLockTime(supabase))
}

export async function saveTrophyAndAwards(data: {
  champion_team_id: number | null
  runner_up_team_id: number | null
  third_place_team_id: number | null
  golden_boot_player: string
  golden_glove_player: string
  kopa_player: string
  total_goals_prediction: number | null
  first_eliminated_team_id: number | null
  most_yellows_team_id: number | null
  first_goal_scorer: string
  first_red_card_player: string
  total_red_cards_prediction: number | null
  final_goes_to_penalties: boolean | null
  total_own_goals_prediction: number | null
  most_goals_team_id: number | null
}): Promise<{ error: string | null; warnings: TrophyConflict[] }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', warnings: [] }

  if (await checkLocked(supabase, user.id)) {
    await logAudit({ userId: user.id, action: 'trophy_save_blocked_locked', table_name: 'pre_tournament_predictions', new_value: data as Record<string, unknown> })
    return { error: 'Pre-tournament predictions are locked', warnings: [] }
  }

  const { data: existing } = await supabase
    .from('pre_tournament_predictions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = await supabase
    .from('pre_tournament_predictions')
    .upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' })

  if (error) return { error: error.message, warnings: [] }
  await logAudit({ userId: user.id, action: 'trophy_saved', table_name: 'pre_tournament_predictions', old_value: existing as Record<string, unknown> | null, new_value: data as Record<string, unknown> })
  revalidatePath('/predictions/pre-tournament')

  // Validate trophy picks against group standings — soft check, save already succeeded
  const [
    { data: teams },
    { data: groups },
    { data: standings },
    { data: qualifiers },
  ] = await Promise.all([
    supabase.from('teams').select('id, name, code, group_id'),
    supabase.from('groups').select('id, name'),
    supabase.from('group_standing_predictions')
      .select('group_id, predicted_1st, predicted_2nd, predicted_3rd, predicted_4th')
      .eq('user_id', user.id),
    supabase.from('third_place_qualifier_predictions')
      .select('team_ids')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const { conflicts } = validateTrophyPicks(
    {
      champion_team_id:    data.champion_team_id,
      runner_up_team_id:   data.runner_up_team_id,
      third_place_team_id: data.third_place_team_id,
    },
    teams ?? [],
    groups ?? [],
    standings ?? [],
    (qualifiers?.team_ids ?? []) as number[]
  )

  return { error: null, warnings: conflicts }
}

export async function saveGroupStandings(
  standings: {
    group_id: number
    predicted_1st: number | null
    predicted_2nd: number | null
    predicted_3rd: number | null
    predicted_4th: number | null
  }[]
): Promise<{ error: string | null; warnings: TrophyConflict[] }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', warnings: [] }

  // Per-group lock: only save groups whose final-round match hasn't started yet.
  // The global RLS policy (migration 009) backstops once the last group match fires.
  const finalLockTimes = await getGroupFinalLockTimes(supabase)
  const now = new Date()
  const unlockedStandings = standings.filter(s => {
    const lt = finalLockTimes.get(s.group_id)
    return !lt || now < lt
  })
  if (unlockedStandings.length === 0) {
    await logAudit({ userId: user.id, action: 'group_standings_save_blocked_locked', table_name: 'group_standing_predictions', new_value: { standings } })
    return { error: 'Group stage predictions are locked', warnings: [] }
  }

  const { data: existingStandings } = await supabase
    .from('group_standing_predictions')
    .select('*')
    .eq('user_id', user.id)

  const rows = unlockedStandings.map(s => ({ user_id: user.id, ...s }))
  const { error } = await supabase
    .from('group_standing_predictions')
    .upsert(rows, { onConflict: 'user_id,group_id' })

  if (error) return { error: error.message, warnings: [] }
  await logAudit({ userId: user.id, action: 'group_standings_saved', table_name: 'group_standing_predictions', old_value: { standings: existingStandings }, new_value: { standings: unlockedStandings } })
  revalidatePath('/predictions/pre-tournament')

  // Re-validate trophy picks against the newly saved standings
  const [
    { data: picks },
    { data: teams },
    { data: groups },
    { data: qualifiers },
  ] = await Promise.all([
    supabase.from('pre_tournament_predictions')
      .select('champion_team_id, runner_up_team_id, third_place_team_id')
      .eq('user_id', user.id).maybeSingle(),
    supabase.from('teams').select('id, name, code, group_id'),
    supabase.from('groups').select('id, name'),
    supabase.from('third_place_qualifier_predictions')
      .select('team_ids').eq('user_id', user.id).maybeSingle(),
  ])

  if (!picks?.champion_team_id && !picks?.runner_up_team_id && !picks?.third_place_team_id) {
    return { error: null, warnings: [] }
  }

  // Use full standings for validation: locked groups from DB + newly saved unlocked groups.
  const savedGroupIds = new Set(unlockedStandings.map(s => s.group_id))
  const allStandingsForValidation = [
    ...(existingStandings ?? []).filter((s: any) => !savedGroupIds.has(s.group_id)),
    ...unlockedStandings,
  ]
  const { conflicts } = validateTrophyPicks(
    {
      champion_team_id:    picks?.champion_team_id ?? null,
      runner_up_team_id:   picks?.runner_up_team_id ?? null,
      third_place_team_id: picks?.third_place_team_id ?? null,
    },
    teams ?? [],
    groups ?? [],
    allStandingsForValidation,
    (qualifiers?.team_ids ?? []) as number[]
  )

  return { error: null, warnings: conflicts }
}

export async function saveThirdPlaceQualifiers(teamIds: number[]): Promise<{ error: string | null; warnings: TrophyConflict[] }> {
  if (teamIds.length !== 8) return { error: 'Select exactly 8 teams', warnings: [] }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', warnings: [] }

  if (await checkGroupStageLocked(supabase)) {
    await logAudit({ userId: user.id, action: 'qualifiers_save_blocked_locked', table_name: 'third_place_qualifier_predictions', new_value: { team_ids: teamIds } })
    return { error: 'Group stage predictions are locked', warnings: [] }
  }

  const { data: existingQualifiers } = await supabase
    .from('third_place_qualifier_predictions')
    .select('team_ids')
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = await supabase
    .from('third_place_qualifier_predictions')
    .upsert({ user_id: user.id, team_ids: teamIds }, { onConflict: 'user_id' })

  if (error) return { error: error.message, warnings: [] }
  await logAudit({ userId: user.id, action: 'qualifiers_saved', table_name: 'third_place_qualifier_predictions', old_value: existingQualifiers as Record<string, unknown> | null, new_value: { team_ids: teamIds } })
  revalidatePath('/predictions/pre-tournament')

  // Re-validate trophy picks against the newly saved qualifier list
  const [
    { data: picks },
    { data: teams },
    { data: groups },
    { data: allStandings },
  ] = await Promise.all([
    supabase.from('pre_tournament_predictions')
      .select('champion_team_id, runner_up_team_id, third_place_team_id')
      .eq('user_id', user.id).maybeSingle(),
    supabase.from('teams').select('id, name, code, group_id'),
    supabase.from('groups').select('id, name'),
    supabase.from('group_standing_predictions')
      .select('group_id, predicted_1st, predicted_2nd, predicted_3rd, predicted_4th')
      .eq('user_id', user.id),
  ])

  if (!picks?.champion_team_id && !picks?.runner_up_team_id && !picks?.third_place_team_id) {
    return { error: null, warnings: [] }
  }

  const { conflicts } = validateTrophyPicks(
    {
      champion_team_id:    picks?.champion_team_id ?? null,
      runner_up_team_id:   picks?.runner_up_team_id ?? null,
      third_place_team_id: picks?.third_place_team_id ?? null,
    },
    teams ?? [],
    groups ?? [],
    allStandings ?? [],
    teamIds
  )

  return { error: null, warnings: conflicts }
}
