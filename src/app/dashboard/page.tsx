import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

const PREDICTION_LINKS = [
  { href: '/predictions/pre-tournament', label: 'Pre-Tournament Picks' },
  { href: '/predictions/group-stage',    label: 'Group Stage' },
  { href: '/predictions/r32',            label: 'Round of 32' },
  { href: '/predictions/r16',            label: 'Round of 16' },
  { href: '/predictions/qf',             label: 'Quarter-Finals' },
  { href: '/predictions/sf',             label: 'Semi-Finals' },
  { href: '/predictions/final',          label: 'Final' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: score },
    { data: matchPredCount },
    { data: prePred },
    { data: rebuy },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, entry_paid').eq('id', user.id).maybeSingle(),
    supabase.from('scores').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('match_predictions').select('match_id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('pre_tournament_predictions').select('champion_team_id, champion:teams!champion_team_id(name)').eq('user_id', user.id).maybeSingle(),
    supabase.from('champion_rebuys').select('submitted_at, team_id, rebuy_team:teams!team_id(name)').eq('user_id', user.id).maybeSingle(),
  ])

  const champion = (prePred?.champion as unknown as { name: string } | null)?.name
  const rebuyTeam = (rebuy?.rebuy_team as unknown as { name: string } | null)?.name
  const totalPts = score?.total_points ?? 0

  const breakdown = [
    { label: 'Pre-Tournament',  pts: score?.pre_tournament_points ?? 0 },
    { label: 'Group Stage',     pts: score?.group_stage_points    ?? 0 },
    { label: 'Knockout',        pts: score?.knockout_points       ?? 0 },
    { label: 'Rebuy',           pts: score?.rebuy_points          ?? 0 },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.display_name ?? user.email}
        </h1>
        {profile !== null && !profile.entry_paid && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
            Entry fee not yet marked as paid — contact the admin.
          </p>
        )}
      </div>

      {/* Score summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold mb-4">{totalPts} pts</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {breakdown.map(({ label, pts }) => (
              <div key={label} className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-xl font-bold">{pts}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
          {score?.last_computed_at && (
            <p className="text-xs text-muted-foreground mt-3">
              Last computed: {new Date(score.last_computed_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Champion + rebuy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Champion Pick</CardTitle>
          </CardHeader>
          <CardContent>
            {champion ? (
              <p className="font-semibold">{champion}</p>
            ) : (
              <Link href="/predictions/pre-tournament" className="text-sm text-primary hover:underline">
                Add your champion pick →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Champion Rebuy</CardTitle>
          </CardHeader>
          <CardContent>
            {rebuy?.submitted_at ? (
              <p className="font-semibold">{rebuyTeam ?? '—'}</p>
            ) : rebuy ? (
              <Link href="/predictions/rebuy" className="text-sm text-primary hover:underline">
                Rebuy available — pick now →
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Not yet unlocked</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictions quick-links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Predictions
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {matchPredCount?.length ?? 0} / 104 matches filled
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PREDICTION_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-md bg-muted hover:bg-muted/70 text-sm transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/leaderboard" className="text-sm text-primary hover:underline">
          View leaderboard →
        </Link>
        <Link href="/predictions/receipt" className="text-sm text-primary hover:underline">
          Download receipt →
        </Link>
      </div>
    </div>
  )
}
