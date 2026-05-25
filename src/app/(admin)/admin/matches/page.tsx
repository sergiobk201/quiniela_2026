import { createAdminClient } from '@/lib/supabase/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MatchRow } from './match-row'

export const dynamic = 'force-dynamic'

const STAGES = [
  { key: 'group', label: 'Group Stage' },
  { key: 'r32',   label: 'R32' },
  { key: 'r16',   label: 'R16' },
  { key: 'qf',    label: 'QF' },
  { key: 'sf',    label: 'SF' },
  { key: '3rd',   label: '3rd Place' },
  { key: 'final', label: 'Final' },
] as const

async function getMatches() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('matches')
    .select(`
      id, stage, scheduled_at, home_score, away_score, status, upset, group_id,
      home_team:teams!home_team_id(id, name, code),
      away_team:teams!away_team_id(id, name, code),
      group:groups(name)
    `)
    .order('scheduled_at')

  return data ?? []
}

type Match = Awaited<ReturnType<typeof getMatches>>[number]

function groupByGroup(matches: Match[]) {
  const map = new Map<string, Match[]>()
  for (const m of matches) {
    const key = (m.group as unknown as { name: string } | null)?.name ?? '?'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function MatchTable({ matches }: { matches: Match[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-muted-foreground text-xs">
          <th className="px-3 py-2 text-left">Date</th>
          <th className="px-3 py-2 text-right">Home</th>
          <th className="px-3 py-2 text-center">Score</th>
          <th className="px-3 py-2 text-left">Away</th>
          <th className="px-3 py-2 text-left">Status</th>
          <th className="px-3 py-2 text-left">Upset</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {matches.map((m) => (
          <MatchRow
            key={m.id}
            id={m.id}
            homeTeam={m.home_team as unknown as { id: number; name: string; code: string } | null}
            awayTeam={m.away_team as unknown as { id: number; name: string; code: string } | null}
            homeScore={m.home_score}
            awayScore={m.away_score}
            status={m.status ?? 'scheduled'}
            upset={m.upset}
            scheduledAt={m.scheduled_at}
            stage={m.stage}
          />
        ))}
      </tbody>
    </table>
  )
}

export default async function MatchesPage() {
  const matches = await getMatches()
  const byStage = Object.fromEntries(
    STAGES.map(({ key }) => [key, matches.filter((m) => m.stage === key)])
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Matches</h1>
        <p className="text-sm text-muted-foreground">{matches.length} total</p>
      </div>

      <Tabs defaultValue="group">
        <TabsList className="flex-wrap h-auto gap-1">
          {STAGES.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {label}
              <span className="ml-1.5 text-muted-foreground">
                {byStage[key].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Group stage — grouped by group */}
        <TabsContent value="group" className="mt-4 space-y-6">
          {groupByGroup(byStage.group).map(([groupName, groupMatches]) => (
            <div key={groupName}>
              <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Group {groupName}
              </h2>
              <div className="border rounded-md overflow-hidden">
                <MatchTable matches={groupMatches} />
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Knockout stages */}
        {STAGES.filter((s) => s.key !== 'group').map(({ key, label }) => (
          <TabsContent key={key} value={key} className="mt-4">
            <div className="border rounded-md overflow-hidden">
              {byStage[key].length > 0 ? (
                <MatchTable matches={byStage[key]} />
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No {label} matches found.
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
