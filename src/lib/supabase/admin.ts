import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Deduplicates the is_admin DB lookup within a single render.
// Middleware already checked it for route guarding; Nav would double-hit without this.
export const getIsAdmin = cache(async (userId: string) => {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle()
  return profile?.is_admin === true
})
