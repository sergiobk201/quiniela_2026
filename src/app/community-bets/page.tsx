import { getUser, createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import CommunityBetsClient from './community-bets-client'
import { PHASES, PHASE_NEXT_STAGE, type Phase, type EnrichedSuggestion } from './types'

export const dynamic = 'force-dynamic'

export default async function CommunityBetsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: suggestions },
    { data: votes },
    { data: profiles },
    { data: stageMatches },
  ] = await Promise.all([
    supabase.from('bet_suggestions')
      .select('id, phase, user_id, suggestion, difficulty, status, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('bet_suggestion_votes').select('suggestion_id, user_id'),
    createAdminClient().from('profiles').select('id, display_name'),
    supabase.from('matches')
      .select('stage, scheduled_at')
      .in('stage', ['group', 'r32', 'r16', 'qf', 'sf', 'final'])
      .order('scheduled_at', { ascending: true }),
  ])

  // Compute per-phase deadlines (= MIN(next-stage scheduled_at) - 2 days)
  const earliestByStage: Record<string, string> = {}
  for (const m of stageMatches ?? []) {
    if (!earliestByStage[m.stage]) earliestByStage[m.stage] = m.scheduled_at
  }

  const deadlines: Record<string, string | null> = {}
  for (const p of PHASES) {
    const nextStage = PHASE_NEXT_STAGE[p.key]
    if (!nextStage || !earliestByStage[nextStage]) {
      deadlines[p.key] = null
    } else {
      const d = new Date(earliestByStage[nextStage])
      d.setDate(d.getDate() - 2)
      deadlines[p.key] = d.toISOString()
    }
  }

  // Enrich suggestions
  const voteCounts: Record<number, number> = {}
  const myVoteSet = new Set<number>()
  for (const v of votes ?? []) {
    voteCounts[v.suggestion_id] = (voteCounts[v.suggestion_id] ?? 0) + 1
    if (v.user_id === user.id) myVoteSet.add(v.suggestion_id)
  }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  const enriched: EnrichedSuggestion[] = (suggestions ?? []).map(s => ({
    id:          s.id,
    phase:       s.phase as Phase,
    user_id:     s.user_id,
    suggestion:  s.suggestion,
    difficulty:  s.difficulty as any,
    status:      s.status,
    created_at:  s.created_at,
    voteCount:   voteCounts[s.id] ?? 0,
    hasVoted:    myVoteSet.has(s.id),
    authorName:  profileMap.get(s.user_id) ?? 'Unknown',
  }))

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Bet Suggestions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Propose bets for each phase. Top 3 voted get sent to admin 2 days before the phase starts.
        </p>
      </div>
      <CommunityBetsClient suggestions={enriched} deadlines={deadlines} />
    </div>
  )
}
