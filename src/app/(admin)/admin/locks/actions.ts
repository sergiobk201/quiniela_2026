'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/supabase/assert-admin'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/supabase/audit'
import { revalidatePath } from 'next/cache'

async function getAdminUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user!.id
}

export async function lockStage(stage: string) {
  await assertAdmin()
  const [admin, userId] = [createAdminClient(), await getAdminUserId()]
  await admin
    .from('matches')
    .update({ locked_at: new Date().toISOString() })
    .eq('stage', stage)
  await logAudit({ userId, action: 'stage_locked', table_name: 'matches', new_value: { stage } })
  revalidatePath('/admin/locks')
}

export async function unlockStage(stage: string) {
  await assertAdmin()
  const [admin, userId] = [createAdminClient(), await getAdminUserId()]
  const { data: matches } = await admin
    .from('matches')
    .select('id, scheduled_at')
    .eq('stage', stage)

  if (!matches?.length) return

  await Promise.all(
    matches.map((m) => {
      const resetTime = new Date(new Date(m.scheduled_at).getTime() - 15 * 60 * 1000)
      return admin
        .from('matches')
        .update({ locked_at: resetTime.toISOString() })
        .eq('id', m.id)
    })
  )

  await logAudit({ userId, action: 'stage_unlocked', table_name: 'matches', new_value: { stage } })
  revalidatePath('/admin/locks')
}

export async function lockPreTournament() {
  await assertAdmin()
  const [admin, userId] = [createAdminClient(), await getAdminUserId()]
  await admin
    .from('pre_tournament_predictions')
    .update({ locked: true })
    .eq('locked', false)
  await logAudit({ userId, action: 'pre_tournament_locked', table_name: 'pre_tournament_predictions' })
  revalidatePath('/admin/locks')
  revalidatePath('/predictions/pre-tournament')
}

export async function unlockPreTournament() {
  await assertAdmin()
  const [admin, userId] = [createAdminClient(), await getAdminUserId()]
  await admin
    .from('pre_tournament_predictions')
    .update({ locked: false })
    .eq('locked', true)
  await logAudit({ userId, action: 'pre_tournament_unlocked', table_name: 'pre_tournament_predictions' })
  revalidatePath('/admin/locks')
  revalidatePath('/predictions/pre-tournament')
}
