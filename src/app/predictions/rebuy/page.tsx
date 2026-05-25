import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RebuyForm from './rebuy-form'

export const dynamic = 'force-dynamic'

export default async function RebuyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rebuy }, { data: originalPrediction }, { data: teams }] =
    await Promise.all([
      supabase
        .from('champion_rebuys')
        .select('team_id, unlocked_at_stage, points_available, submitted_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('pre_tournament_predictions')
        .select('champion_team_id, champion:teams!champion_team_id(name, code)')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('teams').select('id, name, code').order('name'),
    ])

  const originalChampionRaw = originalPrediction?.champion as unknown as { name: string; code: string } | null
  const originalChampion = originalChampionRaw?.name ?? null
  const originalChampionCode = originalChampionRaw?.code ?? null

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Champion Rebuy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          1 rebuy per user · Only available when your predicted champion is eliminated
        </p>
      </div>
      <RebuyForm
        rebuy={rebuy}
        originalChampion={originalChampion}
        originalChampionCode={originalChampionCode}
        teams={teams ?? []}
      />
    </div>
  )
}
