import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isPreTournamentLocked } from '@/lib/utils/lock'
import PreTournamentForm from './pre-tournament-form'

export const dynamic = 'force-dynamic'

export default async function PreTournamentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pre-Tournament Predictions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Locked June 4, 2026 · 00:00 UTC
        </p>
      </div>
      <PreTournamentForm
        teams={(teams ?? []) as { id: number; name: string; code: string; group_id: number | null }[]}
        groups={(groups ?? []) as { id: number; name: string }[]}
        prediction={prediction as any}
        standings={(standings ?? []) as any[]}
        qualifierTeamIds={(qualifiers as any)?.team_ids ?? []}
        locked={isPreTournamentLocked()}
      />
    </div>
  )
}
