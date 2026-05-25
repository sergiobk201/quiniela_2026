'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function triggerRecompute() {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-scores`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'all' }),
    })
  } catch {
    // Non-blocking — scores will be stale until next manual recompute
  }
}

export async function updateScore(matchId: number, homeScore: number, awayScore: number) {
  const admin = createAdminClient()
  await admin
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status: 'finished' })
    .eq('id', matchId)
  revalidatePath('/admin/matches')
  revalidatePath('/leaderboard')
  // Auto-recompute scores in the background — non-blocking
  void triggerRecompute()
}

export async function toggleUpset(matchId: number, current: boolean) {
  const admin = createAdminClient()
  await admin.from('matches').update({ upset: !current }).eq('id', matchId)
  revalidatePath('/admin/matches')
}

export async function updateStatus(matchId: number, status: 'scheduled' | 'live' | 'finished') {
  const admin = createAdminClient()
  await admin.from('matches').update({ status }).eq('id', matchId)
  revalidatePath('/admin/matches')
}

export async function assignKnockoutTeams(
  matchId: number,
  homeTeamId: number,
  awayTeamId: number
) {
  const admin = createAdminClient()
  await admin
    .from('matches')
    .update({ home_team_id: homeTeamId, away_team_id: awayTeamId })
    .eq('id', matchId)
  revalidatePath('/admin/matches')
}
