'use server'

import { createClient } from '@/lib/supabase/server'
import { isMatchLocked } from '@/lib/utils/lock'

export async function saveMatchPrediction(
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('locked_at')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return { error: 'Match not found' }
  if (isMatchLocked(match.locked_at)) return { error: 'This match is locked' }
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    return { error: 'Invalid score' }
  }

  const { error } = await supabase
    .from('match_predictions')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
      },
      { onConflict: 'user_id,match_id' }
    )

  if (error) return { error: error.message }
  return { error: null }
}
