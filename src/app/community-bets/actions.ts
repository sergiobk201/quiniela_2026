'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PHASE_NEXT_STAGE, type Phase, type Difficulty } from './types'

export async function submitSuggestion(
  phase: Phase,
  suggestion: string,
  difficulty: Difficulty
): Promise<{ error: string | null }> {
  if (!suggestion.trim()) return { error: 'Suggestion cannot be empty' }
  if (suggestion.trim().length > 200) return { error: 'Max 200 characters' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const nextStage = PHASE_NEXT_STAGE[phase]
  if (nextStage) {
    const { data } = await supabase
      .from('matches')
      .select('scheduled_at')
      .eq('stage', nextStage)
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (data?.scheduled_at) {
      const deadline = new Date(data.scheduled_at)
      deadline.setDate(deadline.getDate() - 2)
      if (new Date() > deadline) return { error: 'Suggestion window for this phase is closed.' }
    }
  }

  const { error } = await supabase.from('bet_suggestions').insert({
    phase,
    user_id: user.id,
    suggestion: suggestion.trim(),
    difficulty,
  })
  if (error) return { error: error.message }
  revalidatePath('/community-bets')
  return { error: null }
}

export async function toggleVote(suggestionId: number): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('bet_suggestion_votes')
    .select('id')
    .eq('suggestion_id', suggestionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('bet_suggestion_votes')
      .delete()
      .eq('suggestion_id', suggestionId)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('bet_suggestion_votes')
      .insert({ suggestion_id: suggestionId, user_id: user.id })
    if (error) return { error: error.message }
  }

  revalidatePath('/community-bets')
  return { error: null }
}
