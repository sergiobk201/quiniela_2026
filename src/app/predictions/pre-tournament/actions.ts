'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isPreTournamentLocked } from '@/lib/utils/lock'

async function checkLocked(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  if (isPreTournamentLocked()) return true
  const { data } = await supabase
    .from('pre_tournament_predictions')
    .select('locked')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.locked === true
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
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  if (await checkLocked(supabase, user.id)) return { error: 'Pre-tournament predictions are locked' }

  const { error } = await supabase
    .from('pre_tournament_predictions')
    .upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/predictions/pre-tournament')
  return { error: null }
}

export async function saveGroupStandings(
  standings: {
    group_id: number
    predicted_1st: number | null
    predicted_2nd: number | null
    predicted_3rd: number | null
    predicted_4th: number | null
  }[]
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  if (await checkLocked(supabase, user.id)) return { error: 'Pre-tournament predictions are locked' }

  const rows = standings.map(s => ({ user_id: user.id, ...s }))
  const { error } = await supabase
    .from('group_standing_predictions')
    .upsert(rows, { onConflict: 'user_id,group_id' })

  if (error) return { error: error.message }
  revalidatePath('/predictions/pre-tournament')
  return { error: null }
}

export async function saveThirdPlaceQualifiers(teamIds: number[]): Promise<{ error: string | null }> {
  if (teamIds.length !== 8) return { error: 'Select exactly 8 teams' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  if (await checkLocked(supabase, user.id)) return { error: 'Pre-tournament predictions are locked' }

  const { error } = await supabase
    .from('third_place_qualifier_predictions')
    .upsert({ user_id: user.id, team_ids: teamIds }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/predictions/pre-tournament')
  return { error: null }
}
