'use server'

import { createClient } from '@/lib/supabase/server'
import { isMatchLocked } from '@/lib/utils/lock'
import { logAudit } from '@/lib/supabase/audit'

export async function saveMatchPrediction(
  matchId: number,
  homeScore: number,
  awayScore: number,
  predictedWinnerId: number | null = null,
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
  if (isMatchLocked(match.locked_at)) {
    await logAudit({ userId: user.id, action: 'match_prediction_save_blocked_locked', table_name: 'match_predictions', record_id: matchId, new_value: { home: homeScore, away: awayScore } })
    return { error: 'This match is locked' }
  }
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    return { error: 'Invalid score' }
  }

  const { data: existing } = await supabase
    .from('match_predictions')
    .select('predicted_home_score, predicted_away_score, predicted_winner_team_id')
    .eq('user_id', user.id)
    .eq('match_id', matchId)
    .maybeSingle()

  const { error } = await supabase
    .from('match_predictions')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        predicted_winner_team_id: predictedWinnerId,
      },
      { onConflict: 'user_id,match_id' }
    )

  if (error) return { error: error.message }
  await logAudit({ userId: user.id, action: 'match_prediction_saved', table_name: 'match_predictions', record_id: matchId, old_value: existing as Record<string, unknown> | null, new_value: { home: homeScore, away: awayScore, winner: predictedWinnerId } })
  return { error: null }
}
