import { getUser, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isPreTournamentLocked } from '@/lib/utils/lock'
import { validateTrophyPicks, type TrophyConflict } from '@/lib/scoring/validate-trophy'
import PreTournamentForm from './pre-tournament-form'

export const dynamic = 'force-dynamic'

export default async function PreTournamentPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: teams },
    { data: groups },
    { data: prediction },
    { data: standings },
    { data: qualifiers },
  ] = await Promise.all([
    supabase.from('teams').select('id, name, code, group_id').order('name'),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('pre_tournament_predictions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('group_standing_predictions').select('*').eq('user_id', user.id),
    supabase
      .from('third_place_qualifier_predictions')
      .select('team_ids')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  let initialWarnings: TrophyConflict[] = []
  if (prediction?.champion_team_id || prediction?.runner_up_team_id || prediction?.third_place_team_id) {
    const { conflicts } = validateTrophyPicks(
      {
        champion_team_id:    prediction.champion_team_id ?? null,
        runner_up_team_id:   prediction.runner_up_team_id ?? null,
        third_place_team_id: prediction.third_place_team_id ?? null,
      },
      (teams ?? []) as { id: number; name: string; code: string; group_id: number | null }[],
      (groups ?? []) as { id: number; name: string }[],
      (standings ?? []) as any[],
      ((qualifiers as any)?.team_ids ?? []) as number[]
    )
    initialWarnings = conflicts
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pre-Tournament Predictions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Locked June 7, 2026 · 00:00 UTC
        </p>
      </div>
      <PreTournamentForm
        teams={(teams ?? []) as { id: number; name: string; code: string; group_id: number | null }[]}
        groups={(groups ?? []) as { id: number; name: string }[]}
        prediction={prediction as any}
        standings={(standings ?? []) as any[]}
        qualifierTeamIds={(qualifiers as any)?.team_ids ?? []}
        locked={isPreTournamentLocked()}
        initialWarnings={initialWarnings}
      />
    </div>
  )
}
