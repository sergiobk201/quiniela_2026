import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { saveTournamentResults, createRebuyOpportunity } from './actions'
import RecomputeButton from './recompute-button'
import IntegrityPanel from './integrity-panel'

export const dynamic = 'force-dynamic'

async function createRebuyOpportunityAction(fd: FormData) {
  'use server'
  const uid   = fd.get('user_id') as string
  const stage = fd.get('stage') as string
  const pts   = Number(fd.get('points_available'))
  if (!uid || !stage || !pts) return
  await createRebuyOpportunity(uid, stage, pts)
}

export default async function ScoringPage() {
  const admin = createAdminClient()

  const [{ data: teams }, { data: results }, { data: profiles }, { data: rebuys }] =
    await Promise.all([
      admin.from('teams').select('id, name').order('name'),
      admin.from('tournament_results').select('*').maybeSingle(),
      admin.from('profiles').select('id, display_name'),
      admin.from('champion_rebuys').select('user_id'),
    ])

  const rebuyUserIds = new Set((rebuys ?? []).map((r) => r.user_id))
  const eligibleUsers = (profiles ?? []).filter((p) => !rebuyUserIds.has(p.id))

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Scoring</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trigger score recomputation and manage tournament results.
        </p>
      </div>

      {/* Recompute Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recompute Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Runs the Edge Function against all finished matches and current tournament results.
            Safe to run multiple times — idempotent.
          </p>
          <RecomputeButton />
        </CardContent>
      </Card>

      {/* Tournament Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tournament Results</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveTournamentResults} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'champion_team_id',        label: 'Champion' },
                { name: 'runner_up_team_id',        label: 'Runner-up' },
                { name: 'third_place_team_id',      label: '3rd Place' },
                { name: 'first_eliminated_team_id', label: 'First Eliminated' },
                { name: 'most_yellows_team_id',     label: 'Most Yellow Cards' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <select
                    name={name}
                    defaultValue={results?.[name as keyof typeof results] ?? ''}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {(teams ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'golden_boot_player',  label: 'Golden Boot', type: 'text' },
                { name: 'golden_glove_player', label: 'Golden Glove', type: 'text' },
                { name: 'kopa_player',          label: 'Kopa Award', type: 'text' },
                { name: 'total_goals',          label: 'Total Goals', type: 'number' },
              ].map(({ name, label, type }) => (
                <div key={name}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <Input
                    name={name}
                    type={type}
                    defaultValue={results?.[name as keyof typeof results] ?? ''}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            {/* Community Bet Answers */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Community Bet Answers</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Balón de Oro <span className="text-red-400">Expert·5pts</span></label>
                  <Input
                    name="community_balon_de_oro"
                    type="text"
                    defaultValue={results?.['community_balon_de_oro' as keyof typeof results] ?? ''}
                    placeholder="Player name"
                  />
                </div>
                {[
                  { name: 'community_revelacion_team_id', label: 'Selección Revelación', badge: 'Medium·2pts' },
                  { name: 'community_decepcion_team_id',  label: 'Selección Decepción',  badge: 'Hard·3pts' },
                ].map(({ name, label, badge }) => (
                  <div key={name}>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {label} <span className="text-blue-400">{badge}</span>
                    </label>
                    <select
                      name={name}
                      defaultValue={results?.[name as keyof typeof results] ?? ''}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {(teams ?? []).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 3rd-Place Qualifiers — the official 8 of 12 advancing third-place teams.
                Enter only after the group stage ends; all 8 must be distinct to score. */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-3 font-medium">
                3rd-Place Qualifiers <span className="text-green-400">8 of 12 · 3pts each</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <label className="text-xs text-muted-foreground mb-1 block">#{i + 1}</label>
                    <select
                      name="third_place_qualifier_ids"
                      defaultValue={results?.third_place_qualifier_ids?.[i] ?? ''}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {(teams ?? []).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit">Save Tournament Results</Button>
          </form>
        </CardContent>
      </Card>

      {/* Prediction Integrity */}
      <Suspense fallback={
        <Card>
          <CardHeader><CardTitle className="text-base">Prediction Integrity</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Scanning…</p></CardContent>
        </Card>
      }>
        <IntegrityPanel />
      </Suspense>

      {/* Rebuy Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unlock Champion Rebuy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Grant a rebuy opportunity to a user whose predicted champion has been eliminated.
          </p>
          <form action={createRebuyOpportunityAction} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">User</label>
              <select name="user_id" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select…</option>
                {eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Eliminated at</label>
              <select name="stage" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {['r32','r16','qf','sf'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Points available</label>
              <Input name="points_available" type="number" defaultValue="10" min={1} />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline" className="w-full">Unlock Rebuy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
