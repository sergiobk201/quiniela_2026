'use server'

import { createClient } from './server'
import { createAdminClient } from './admin'

export async function assertAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_admin !== true) throw new Error('Unauthorized')
}
