'use server'

import { createClient } from '@/lib/supabase/server'
import { isMatchLocked } from '@/lib/utils/lock'

export async function saveMatchPrediction(
  matchId: number,
  lockedAt: string,
  homeScore: number,
  awayScore: number
) {
  if (isMatchLocked(lockedAt)) throw new Error('Match is locked')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthenticated')

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
