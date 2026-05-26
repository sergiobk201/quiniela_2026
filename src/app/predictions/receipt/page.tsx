import { getUser, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrintButton from './print-button'
import { getFlag } from '@/lib/teams/meta'

export const dynamic = 'force-dynamic'

const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'] as const
const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-Finals', sf: 'Semi-Finals', '3rd': '3rd Place Match', final: 'Final',
}

export default async function ReceiptPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: profile },
    { data: prePred },
    { data: groupStandings },
    { data: qualifiers },
    { data: matchPreds },
    { data: allTeams },
    { data: groups },
    { data: rebuy },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('pre_tournament_predictions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('group_standing_predictions').select('*').eq('user_id', user.id).order('group_id'),
    supabase.from('third_place_qualifier_predictions').select('team_ids').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('match_predictions')
      .select('match_id, predicted_home_score, predicted_away_score, match:matches(scheduled_at, stage, home_team:teams!home_team_id(name, code), away_team:teams!away_team_id(name, code))')
      .eq('user_id', user.id),
    supabase.from('teams').select('id, name, code').order('name'),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('champion_rebuys').select('team_id, submitted_at').eq('user_id', user.id).maybeSingle(),
  ])

  // Build team lookup maps
  const teamMap = Object.fromEntries((allTeams ?? []).map((t) => [t.id, t.name]))
  const teamCodeMap = Object.fromEntries((allTeams ?? []).map((t) => [t.id, t.code]))
  const groupMap = Object.fromEntries((groups ?? []).map((g) => [g.id, g.name]))

  // Group match predictions by stage
  const matchesByStage: Record<string, typeof matchPreds> = {}
  for (const mp of matchPreds ?? []) {
    const stage = (mp.match as unknown as { stage: string } | null)?.stage ?? 'unknown'
    if (!matchesByStage[stage]) matchesByStage[stage] = []
    matchesByStage[stage]!.push(mp)
  }

  const generatedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }) + ' UTC'

  const displayName = profile?.display_name ?? user.email ?? 'Unknown'

  return (
    <>
      {/* Print button — hidden in print mode */}
      <div className="max-w-3xl mx-auto px-6 pt-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Prediction Receipt</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generated {generatedAt}
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Receipt content */}
      <div className="max-w-3xl mx-auto p-6 space-y-8 print:p-4 print:space-y-6">
        {/* Header — visible in print */}
        <div className="hidden print:block border-b pb-4">
          <h1 className="text-xl font-bold">Quiniela 2026 — Prediction Receipt</h1>
          <p className="text-sm">Submitted by: <strong>{displayName}</strong></p>
          <p className="text-sm">Generated: {generatedAt}</p>
        </div>

        {/* Pre-Tournament Picks */}
        <section>
          <h2 className="text-base font-semibold mb-3 border-b pb-1">Pre-Tournament Picks</h2>
          {prePred ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <Row label="Champion" value={flaggedTeam(prePred.champion_team_id, teamMap, teamCodeMap)} />
              <Row label="Runner-up" value={flaggedTeam(prePred.runner_up_team_id, teamMap, teamCodeMap)} />
              <Row label="3rd Place" value={flaggedTeam(prePred.third_place_team_id, teamMap, teamCodeMap)} />
              <Row label="Golden Boot" value={prePred.golden_boot_player ?? '—'} />
              <Row label="Golden Glove" value={prePred.golden_glove_player ?? '—'} />
              <Row label="Kopa Award" value={prePred.kopa_player ?? '—'} />
              <Row label="Total Goals" value={prePred.total_goals_prediction?.toString() ?? '—'} />
              <Row label="First Eliminated" value={flaggedTeam(prePred.first_eliminated_team_id, teamMap, teamCodeMap)} />
              <Row label="Most Yellow Cards" value={flaggedTeam(prePred.most_yellows_team_id, teamMap, teamCodeMap)} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pre-tournament picks submitted.</p>
          )}
        </section>

        {/* Champion Rebuy */}
        {rebuy?.submitted_at && (
          <section>
            <h2 className="text-base font-semibold mb-3 border-b pb-1">Champion Rebuy</h2>
            <p className="text-sm">
              New champion: <strong>{flaggedTeam(rebuy.team_id, teamMap, teamCodeMap)}</strong>
            </p>
          </section>
        )}

        {/* Group Standings */}
        <section>
          <h2 className="text-base font-semibold mb-3 border-b pb-1">Group Standings</h2>
          {groupStandings && groupStandings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {groupStandings.map((gs) => (
                <div key={gs.group_id}>
                  <p className="font-medium mb-1">Group {groupMap[gs.group_id] ?? gs.group_id}</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                    <li>{flaggedTeam(gs.predicted_1st, teamMap, teamCodeMap)}</li>
                    <li>{flaggedTeam(gs.predicted_2nd, teamMap, teamCodeMap)}</li>
                    <li>{flaggedTeam(gs.predicted_3rd, teamMap, teamCodeMap)}</li>
                    <li>{flaggedTeam(gs.predicted_4th, teamMap, teamCodeMap)}</li>
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No group standings submitted.</p>
          )}
        </section>

        {/* 3rd-Place Qualifiers */}
        <section>
          <h2 className="text-base font-semibold mb-3 border-b pb-1">
            3rd-Place Qualifiers ({(qualifiers?.team_ids as number[] | null)?.length ?? 0}/8)
          </h2>
          {qualifiers?.team_ids && (qualifiers.team_ids as number[]).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(qualifiers.team_ids as number[]).map((id) => (
                <span key={id} className="px-2 py-0.5 rounded bg-muted text-sm">
                  {flaggedTeam(id, teamMap, teamCodeMap)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No 3rd-place qualifiers submitted.</p>
          )}
        </section>

        {/* Match Predictions by Stage */}
        {STAGE_ORDER.filter((s) => matchesByStage[s]?.length).map((stage) => (
          <section key={stage}>
            <h2 className="text-base font-semibold mb-3 border-b pb-1">
              {STAGE_LABELS[stage]} ({matchesByStage[stage]?.length} predictions)
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {matchesByStage[stage]!.map((mp) => {
                  const m = mp.match as unknown as {
                    scheduled_at: string
                    home_team: { name: string; code: string } | null
                    away_team: { name: string; code: string } | null
                  } | null
                  return (
                    <tr key={mp.match_id} className="border-b last:border-0">
                      <td className="py-1 text-muted-foreground text-xs w-20">
                        {m
                          ? new Date(m.scheduled_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-1 text-right w-24">
                        {m?.home_team ? `${getFlag(m.home_team.code)} ${m.home_team.code}` : 'TBD'}
                      </td>
                      <td className="py-1 text-center font-mono w-16">
                        {mp.predicted_home_score} : {mp.predicted_away_score}
                      </td>
                      <td className="py-1 w-24">
                        {m?.away_team ? `${getFlag(m.away_team.code)} ${m.away_team.code}` : 'TBD'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ))}

        {/* Print footer */}
        <div className="hidden print:block border-t pt-4 text-xs text-muted-foreground">
          This receipt was generated from quiniela2026.vercel.app and reflects predictions
          at the time of printing. Predictions are locked server-side and cannot be altered
          after their respective deadlines.
        </div>
      </div>
    </>
  )
}

function flaggedTeam(
  id: number | null | undefined,
  nameMap: Record<number, string>,
  codeMap: Record<number, string>
): string {
  if (!id) return '—'
  const name = nameMap[id]
  const code = codeMap[id]
  if (!name) return '—'
  return code ? `${getFlag(code)} ${name}` : name
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </>
  )
}
