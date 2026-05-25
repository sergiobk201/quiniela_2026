'use server'

import { createClient } from '@/lib/supabase/server'
import { isMatchLocked } from '@/lib/utils/lock'

export async function saveMatchPrediction(
  matchId: number,
  homeScore: number,
  awayScore: number
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('locked_at')
    .eq('id', matchId)
    .single()

  if (matchError || !match) throw new Error('Match not found')
  if (isMatchLocked(match.locked_at)) throw new Error('Match is locked')
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    throw new Error('Invalid score')
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

  if (error) throw new Error(error.message)
}
