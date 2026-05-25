'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/supabase/assert-admin'
import { revalidatePath } from 'next/cache'

export async function lockStage(stage: string) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin
    .from('matches')
    .update({ locked_at: new Date().toISOString() })
    .eq('stage', stage)
  revalidatePath('/admin/locks')
}

export async function unlockStage(stage: string) {
  await assertAdmin()
  const admin = createAdminClient()
  // Reset to 1 hour before each match's scheduled_at
  const { data: matches } = await admin
    .from('matches')
    .select('id, scheduled_at')
    .eq('stage', stage)

  if (!matches?.length) return

  await Promise.all(
    matches.map((m) => {
      const resetTime = new Date(new Date(m.scheduled_at).getTime() - 60 * 60 * 1000)
      return admin
        .from('matches')
        .update({ locked_at: resetTime.toISOString() })
        .eq('id', m.id)
    })
  )

  revalidatePath('/admin/locks')
}

export async function lockPreTournament() {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('pre_tournament_predictions').update({ locked: true }).neq('locked', true)
  revalidatePath('/admin/locks')
}

export async function unlockPreTournament() {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('pre_tournament_predictions').update({ locked: false }).neq('locked', false)
  revalidatePath('/admin/locks')
}
