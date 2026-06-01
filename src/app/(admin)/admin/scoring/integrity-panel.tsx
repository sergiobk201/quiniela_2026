import { createAdminClient } from '@/lib/supabase/admin'
import { validateTrophyPicks } from '@/lib/scoring/validate-trophy'
import type { TrophyConflict } from '@/lib/scoring/validate-trophy'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { sendIntegrityAlert } from './actions'

type UserConflict = { displayName: string; conflicts: TrophyConflict[] }

export default async function IntegrityPanel() {
  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: teams },
    { data: groups },
    { data: allStandings },
    { data: allQualifiers },
    { data: allPicks },
  ] = await Promise.all([
    admin.from('profiles').select('id, display_name'),
    admin.from('teams').select('id, name, code, group_id'),
    admin.from('groups').select('id, name'),
    admin.from('group_standing_predictions').select(
      'user_id, group_id, predicted_1st, predicted_2nd, predicted_3rd, predicted_4th'
    ),
    admin.from('third_place_qualifier_predictions').select('user_id, team_ids'),
    admin.from('pre_tournament_predictions').select(
      'user_id, champion_team_id, runner_up_team_id, third_place_team_id'
    ),
  ])

  const userConflicts: UserConflict[] = []

  for (const profile of profiles ?? []) {
    const picks = allPicks?.find(p => p.user_id === profile.id)
    if (!picks) continue
    if (!picks.champion_team_id && !picks.runner_up_team_id && !picks.third_place_team_id) continue

    const standings = (allStandings ?? []).filter(s => s.user_id === profile.id)
    const qualifiers = allQualifiers?.find(q => q.user_id === profile.id)
    const qualifierIds = (qualifiers?.team_ids ?? []) as number[]

    const { conflicts } = validateTrophyPicks(
      picks,
      teams ?? [],
      groups ?? [],
      standings,
      qualifierIds
    )

    if (conflicts.length > 0) {
      userConflicts.push({ displayName: profile.display_name, conflicts })
    }
  }

  const totalConflicts = userConflicts.reduce((n, u) => n + u.conflicts.length, 0)

  // Pre-build plain-text alert lines for the email action
  const alertLines = userConflicts.flatMap(u =>
    u.conflicts.map(c => `${u.displayName}: ${c.message}`)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prediction Integrity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cross-checks every user's Champion / Runner-up / 3rd-Place picks against their
          group standing predictions. Flags picks that contradict the group stage outcome.
          Save is never blocked — this is informational only.
        </p>

        {userConflicts.length === 0 ? (
          <p className="text-sm text-green-500 font-medium">
            ✓ All {profiles?.length ?? 0} users' trophy picks are consistent with their group standings.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-amber-500">
              {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} across{' '}
              {userConflicts.length} user{userConflicts.length !== 1 ? 's' : ''}
            </p>

            <div className="border rounded-md divide-y text-sm overflow-x-auto">
              <div className="grid grid-cols-[130px_90px_1fr] gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                <span>User</span>
                <span>Pick</span>
                <span>Issue</span>
              </div>
              {userConflicts.flatMap((u, ui) =>
                u.conflicts.map((c, ci) => (
                  <div
                    key={`${ui}-${ci}`}
                    className="grid grid-cols-[130px_90px_1fr] gap-2 px-3 py-2 items-center"
                  >
                    <span className="font-medium truncate text-xs">{u.displayName}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {c.field.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400">{c.message}</span>
                  </div>
                ))
              )}
            </div>

            <form
              action={async () => {
                'use server'
                await sendIntegrityAlert(alertLines)
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Send alert email to admin
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
