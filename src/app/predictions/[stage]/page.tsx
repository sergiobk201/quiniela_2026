import { getUser, createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import KnockoutForm from './knockout-form'

export const dynamic = 'force-dynamic'

const VALID_STAGES = ['r32', 'r16', 'qf', 'sf', '3rd', 'final'] as const
type KnockoutStage = (typeof VALID_STAGES)[number]

const STAGE_LABELS: Record<KnockoutStage, string> = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-Finals',
  sf: 'Semi-Finals',
  '3rd': '3rd Place Match',
  final: 'Final',
}

const STAGE_MULTIPLIERS: Record<KnockoutStage, number> = {
  r32: 2, r16: 3, qf: 4, sf: 5, '3rd': 5, final: 7,
}

type TeamRef = { id: number; name: string; code: string } | null

type Match = {
  id: number
  scheduled_at: string
  locked_at: string
  home_team: TeamRef
  away_team: TeamRef
}

export default async function KnockoutPage({
  params,
}: {
  params: Promise<{ stage: string }>
}) {
  const { stage } = await params
  if (!VALID_STAGES.includes(stage as KnockoutStage)) notFound()

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: rawMatches }, { data: rawPredictions }] = await Promise.all([
    supabase
      .from('matches')
      .select(
        'id, scheduled_at, locked_at, home_team:teams!home_team_id(id, name, code), away_team:teams!away_team_id(id, name, code)'
      )
      .eq('stage', stage)
      .order('scheduled_at'),
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

  const predictions = rawPredictions ?? []
  const label = STAGE_LABELS[stage as KnockoutStage]
  const multiplier = STAGE_MULTIPLIERS[stage as KnockoutStage]
  const filled = predictions.filter((p) =>
    matches.some((m) => m.id === p.match_id)
  ).length

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {filled} / {matches.length} filled ·{' '}
          Exact score = {5 * multiplier} pts · Correct result = {2 * multiplier} pts · Upset +3 pts
        </p>
      </div>
      <KnockoutForm
        matches={matches}
        predictions={predictions}
        stage={stage}
      />
    </div>
  )
}
