'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateScore(matchId: number, homeScore: number, awayScore: number) {
  const admin = createAdminClient()
  await admin
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status: 'finished' })
    .eq('id', matchId)
  revalidatePath('/admin/matches')
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
