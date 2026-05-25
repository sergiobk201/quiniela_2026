'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function recomputeScores(type: string = 'all') {
  const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-scores`
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type }),
  })

  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Compute failed')

  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
  return json
}

export async function saveTournamentResults(formData: FormData) {
  const admin = createAdminClient()

  const row = {
    champion_team_id:           toInt(formData.get('champion_team_id')),
    runner_up_team_id:          toInt(formData.get('runner_up_team_id')),
    third_place_team_id:        toInt(formData.get('third_place_team_id')),
    golden_boot_player:         str(formData.get('golden_boot_player')),
    golden_glove_player:        str(formData.get('golden_glove_player')),
    kopa_player:                str(formData.get('kopa_player')),
    total_goals:                toInt(formData.get('total_goals')),
    first_eliminated_team_id:   toInt(formData.get('first_eliminated_team_id')),
    most_yellows_team_id:       toInt(formData.get('most_yellows_team_id')),
    updated_at:                 new Date().toISOString(),
  }

  // Single row — delete existing and insert fresh
  await admin.from('tournament_results').delete().neq('id', 0)
  const { error } = await admin.from('tournament_results').insert(row)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/scoring')
}

export async function createRebuyOpportunity(
  userId: string,
  unlockedAtStage: string,
  pointsAvailable: number
) {
  const admin = createAdminClient()
  const { error } = await admin.from('champion_rebuys').upsert(
    { user_id: userId, unlocked_at_stage: unlockedAtStage, points_available: pointsAvailable },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/admin/scoring')
}

function toInt(v: FormDataEntryValue | null): number | null {
  if (!v || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string)?.trim()
  return s || null
}
