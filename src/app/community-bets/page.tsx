import { getUser, createClient } from '@/lib/supabase/server'
import { createAdminClient, fetchAll } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import CommunityBetsClient from './community-bets-client'
import { PHASES, PHASE_NEXT_STAGE, type Phase, type EnrichedSuggestion } from './types'
import { getFirstGroupMatchLockTime, isCommunityBetsLocked } from '@/lib/utils/lock'

export const dynamic = 'force-dynamic'

export default async function CommunityBetsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('communityBets')
  const supabase = await createClient()

  const [
    { data: suggestions },
    votes,
    { data: profiles },
    { data: stageMatches },
    { data: teams },
    { data: existingPick },
    communityBetsLockTime,
  ] = await Promise.all([
    supabase.from('bet_suggestions')
      .select('id, phase, user_id, suggestion, difficulty, status, created_at')
      .order('created_at', { ascending: false }),
    // Paged: vote count can exceed PostgREST's 1000-row cap (25 users × N suggestions);
    // an unbounded select would silently undercount tallies. See fetchAll().
    fetchAll<{ suggestion_id: number; user_id: string }>((from, to) =>
      supabase.from('bet_suggestion_votes').select('suggestion_id, user_id').order('id', { ascending: true }).range(from, to)),
    createAdminClient().from('profiles').select('id, display_name'),
    supabase.from('matches')
      .select('stage, scheduled_at')
      .in('stage', ['group', 'r32', 'r16', 'qf', 'sf', 'final'])
      .order('scheduled_at', { ascending: true }),
    supabase.from('teams').select('id, name, code').order('name'),
    supabase.from('pre_tournament_predictions')
      .select('community_balon_de_oro, community_revelacion_team_id, community_decepcion_team_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    getFirstGroupMatchLockTime(supabase),
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
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
      </div>
      <CommunityBetsClient
        suggestions={enriched}
        deadlines={deadlines}
        teams={(teams ?? []) as { id: number; name: string; code: string }[]}
        communityBetsPick={{
          balon_de_oro:        existingPick?.community_balon_de_oro ?? null,
          revelacion_team_id:  existingPick?.community_revelacion_team_id ?? null,
          decepcion_team_id:   existingPick?.community_decepcion_team_id ?? null,
        }}
        communityBetsLocked={isCommunityBetsLocked(communityBetsLockTime)}
      />
    </div>
  )
}
