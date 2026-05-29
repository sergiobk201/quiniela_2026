import { getUser, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GroupStageForm from './group-stage-form'

export const dynamic = 'force-dynamic'

type TeamRef = { id: number; name: string; code: string }

type Match = {
  id: number
  group_id: number
  scheduled_at: string
  locked_at: string
  home_team: TeamRef
  away_team: TeamRef
}

type Prediction = {
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
}

export default async function GroupStagePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: rawMatches }, { data: groups }, { data: rawPredictions }] =
    await Promise.all([
      supabase
        .from('matches')
        .select(
          'id, group_id, scheduled_at, locked_at, home_team:teams!home_team_id(id, name, code), away_team:teams!away_team_id(id, name, code)'
        )
        .eq('stage', 'group')
        .order('scheduled_at'),
      supabase.from('groups').select('id, name').order('name'),
      supabase
        .from('match_predictions')
        .select('match_id, predicted_home_score, predicted_away_score')
        .eq('user_id', user.id),
    ])

  const matches = (rawMatches ?? []).map((m) => ({
    ...m,
    home_team: m.home_team as unknown as TeamRef,
    away_team: m.away_team as unknown as TeamRef,
  })) as Match[]

  const predictions = (rawPredictions ?? []) as Prediction[]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Group Stage Predictions</h1>
      </div>
      <GroupStageForm
        matches={matches}
        groups={groups ?? []}
        predictions={predictions}
      />
    </div>
  )
}
