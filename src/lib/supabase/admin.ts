import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const PAGE_SIZE = 1000

// Fetches every row of a table, paging past PostgREST's hard `db-max-rows` cap.
// A plain `.select()` (or `.limit(n)` with n > cap) is silently truncated server-side,
// which drops late-inserted rows (high id) — e.g. predictions submitted close to lock.
// Pages stay under the cap, so each request is honored; loop until a short page returns.
export async function fetchAll<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
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
