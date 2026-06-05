'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/supabase/audit'

export async function submitRebuy(teamId: number) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

  // Row must exist (created by scoring engine when champion is eliminated)
  // and must not already be submitted
  const { error } = await supabase
    .from('champion_rebuys')
    .update({
      team_id: teamId,
      submitted_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .is('submitted_at', null)

  if (error) throw new Error(error.message)
  await logAudit({ userId: user.id, action: 'rebuy_submitted', table_name: 'champion_rebuys', new_value: { team_id: teamId } })
  revalidatePath('/predictions/rebuy')
}
