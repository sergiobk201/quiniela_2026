import { createAdminClient, fetchAll } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/supabase/assert-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateSuggestionStatus } from './actions'
import { PHASES, DIFFICULTY_PTS, PHASE_NEXT_STAGE, type Phase, type Difficulty } from '@/app/community-bets/types'

export const dynamic = 'force-dynamic'

const DIFF_BADGE: Record<string, string> = {
  easy:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  hard:   'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default async function SuggestionsPage() {
  await assertAdmin()
  const admin = createAdminClient()

  const [
    { data: suggestions },
    votes,
    { data: profiles },
    { data: stageMatches },
  ] = await Promise.all([
    admin.from('bet_suggestions')
      .select('id, phase, user_id, suggestion, difficulty, status, created_at')
      .order('created_at', { ascending: false }),
    // Paged: vote tally can exceed PostgREST's 1000-row cap — unbounded undercounts. See fetchAll().
    fetchAll<{ suggestion_id: number }>((from, to) =>
      admin.from('bet_suggestion_votes').select('suggestion_id').order('id', { ascending: true }).range(from, to)),
    admin.from('profiles').select('id, display_name'),
    admin.from('matches')
      .select('stage, scheduled_at')
      .in('stage', ['group', 'r32', 'r16', 'qf', 'sf', 'final'])
      .order('scheduled_at', { ascending: true }),
  ])

  const voteCounts: Record<number, number> = {}
  for (const v of votes ?? []) voteCounts[v.suggestion_id] = (voteCounts[v.suggestion_id] ?? 0) + 1

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  const earliestByStage: Record<string, string> = {}
  for (const m of stageMatches ?? []) {
    if (!earliestByStage[m.stage]) earliestByStage[m.stage] = m.scheduled_at
  }

  function deadline(phase: Phase): Date | null {
    const nextStage = PHASE_NEXT_STAGE[phase]
    if (!nextStage || !earliestByStage[nextStage]) return null
    const d = new Date(earliestByStage[nextStage])
    d.setDate(d.getDate() - 2)
    return d
  }

  const now = new Date()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Bet Suggestions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Community-voted bet proposals. Top 3 per phase emailed 2 days before each phase starts.
        </p>
      </div>

      <Tabs defaultValue="pre_tournament">
        <TabsList className="flex-wrap h-auto gap-1">
          {PHASES.map(p => {
            const count = (suggestions ?? []).filter(s => s.phase === p.key).length
            return (
              <TabsTrigger key={p.key} value={p.key} className="text-xs sm:text-sm">
                {p.label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {PHASES.map(p => {
          const phaseSugs = [...(suggestions ?? []).filter(s => s.phase === p.key)]
            .sort((a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0))
          const dl = deadline(p.key)
          const dlPassed = dl && dl < now

          return (
            <TabsContent key={p.key} value={p.key} className="mt-4 space-y-4">
              <p className={`text-xs font-medium ${dlPassed ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}`}>
                {dl ? (dlPassed ? `Closed ${dl.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : `Closes ${dl.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`) : 'No deadline'}
              </p>

              {phaseSugs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No suggestions for this phase.</p>
              ) : (
                <div className="border rounded-md divide-y text-sm">
                  {phaseSugs.map((s, i) => (
                    <div key={s.id} className={`flex items-start gap-3 p-3 ${s.status === 'rejected' ? 'opacity-40' : ''}`}>
                      <span className="text-xs text-muted-foreground w-4 shrink-0 mt-0.5">#{i + 1}</span>

                      <div className="flex flex-col items-center gap-0.5 shrink-0 px-2 py-1 rounded-md border border-input bg-muted/30">
                        <span className="text-xs leading-none">▲</span>
                        <span className="text-xs font-bold">{voteCounts[s.id] ?? 0}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{s.suggestion}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE[s.difficulty]}`}>
                            {s.difficulty} · {DIFFICULTY_PTS[s.difficulty as Difficulty]}pts
                          </span>
                          <span className="text-xs text-muted-foreground">
                            by {profileMap.get(s.user_id) ?? 'Unknown'}
                          </span>
                          {s.status === 'selected' && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Selected</span>
                          )}
                          {s.status === 'rejected' && (
                            <span className="text-xs text-muted-foreground">Rejected</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        {s.status !== 'selected' && (
                          <form action={async () => { 'use server'; await updateSuggestionStatus(s.id, 'selected') }}>
                            <Button type="submit" variant="outline" size="sm" className="text-green-600 border-green-500/40 hover:bg-green-50 dark:hover:bg-green-950/30 text-xs h-7 px-2">
                              Select
                            </Button>
                          </form>
                        )}
                        {s.status !== 'rejected' && (
                          <form action={async () => { 'use server'; await updateSuggestionStatus(s.id, 'rejected') }}>
                            <Button type="submit" variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-7 px-2">
                              Reject
                            </Button>
                          </form>
                        )}
                        {s.status !== 'open' && (
                          <form action={async () => { 'use server'; await updateSuggestionStatus(s.id, 'open') }}>
                            <Button type="submit" variant="ghost" size="sm" className="text-xs h-7 px-2">
                              Reset
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
