'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

export type PlayerPick = {
  userId: string
  displayName: string
  preTournament: {
    champion: string
    runnerUp: string
    thirdPlace: string
    goldenBoot: string
    goldenGlove: string
    kopa: string
    totalGoals: string
    firstEliminated: string
    mostYellows: string
  } | null
  qualifiers: string[]
  rebuy: string | null
}

export type GroupStandingsRow = {
  groupId: number
  groupName: string
  picks: { userId: string; pos1: string; pos2: string; pos3: string; pos4: string }[]
}

export type MatchRow = {
  matchId: number
  stage: string
  homeTeam: string
  awayTeam: string
  label: string
  predictions: { userId: string; home: number; away: number }[]
}

interface Props {
  players: { userId: string; displayName: string }[]
  playerPicks: PlayerPick[]
  groupStandings: GroupStandingsRow[]
  matches: MatchRow[]
  picksVisible: boolean
}

const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'] as const
const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-Finals', sf: 'Semi-Finals', '3rd': '3rd Place Match', final: 'Final',
}

export default function PicksGrid({ players, playerPicks, groupStandings, matches, picksVisible }: Props) {
  const [search, setSearch] = useState('')
  const [matchStage, setMatchStage] = useState('group')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return players
    return players.filter(p => p.displayName.toLowerCase().includes(q))
  }, [search, players])

  const filteredIds = new Set(filtered.map(p => p.userId))
  const filteredPicks = playerPicks.filter(p => filteredIds.has(p.userId))
  const stagesWithPicks = STAGE_ORDER.filter(s => matches.some(m => m.stage === s))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">All Picks</h2>
        {picksVisible && (
          <Input
            placeholder="Search player..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs h-8 text-sm"
          />
        )}
      </div>

      {!picksVisible ? (
        <div className="rounded-lg border border-border bg-muted/30 py-10 text-center space-y-1">
          <p className="text-sm font-medium">Picks are hidden until the lock date</p>
          <p className="text-xs text-muted-foreground">June 7, 2026 · 00:00 UTC</p>
        </div>
      ) : (
        <Tabs defaultValue="trophy">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="trophy">Trophy &amp; Awards</TabsTrigger>
            <TabsTrigger value="standings">Group Standings</TabsTrigger>
            <TabsTrigger value="qualifiers">3rd-Place Qualifiers</TabsTrigger>
            <TabsTrigger value="matches">Match Predictions</TabsTrigger>
            <TabsTrigger value="rebuys">Rebuys</TabsTrigger>
          </TabsList>

          {/* ── Trophy & Awards ── */}
          <TabsContent value="trophy" className="mt-4">
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="text-xs w-full min-w-[720px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-3 py-2 text-left sticky left-0 bg-muted/80 backdrop-blur z-10 min-w-[120px]">Player</th>
                    <th className="px-3 py-2 text-left">Champion</th>
                    <th className="px-3 py-2 text-left">Runner-up</th>
                    <th className="px-3 py-2 text-left">3rd Place</th>
                    <th className="px-3 py-2 text-left">Golden Boot</th>
                    <th className="px-3 py-2 text-left">Golden Glove</th>
                    <th className="px-3 py-2 text-left">Kopa</th>
                    <th className="px-3 py-2 text-center">Goals</th>
                    <th className="px-3 py-2 text-left">1st Out</th>
                    <th className="px-3 py-2 text-left">Most Yellows</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPicks.map(p => (
                    <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-background border-r border-border">
                        {p.displayName}
                      </td>
                      {p.preTournament ? (
                        <>
                          <td className="px-3 py-2">{p.preTournament.champion}</td>
                          <td className="px-3 py-2">{p.preTournament.runnerUp}</td>
                          <td className="px-3 py-2">{p.preTournament.thirdPlace}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.preTournament.goldenBoot || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.preTournament.goldenGlove || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.preTournament.kopa || '—'}</td>
                          <td className="px-3 py-2 text-center">{p.preTournament.totalGoals}</td>
                          <td className="px-3 py-2">{p.preTournament.firstEliminated}</td>
                          <td className="px-3 py-2">{p.preTournament.mostYellows}</td>
                        </>
                      ) : (
                        <td colSpan={9} className="px-3 py-2 text-muted-foreground italic">No picks submitted</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── Group Standings ── */}
          <TabsContent value="standings" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupStandings.map(group => (
                <div key={group.groupId} className="rounded-md border border-border overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="border-b bg-muted/50 text-muted-foreground">
                        <th className="px-3 py-2 text-left">Group {group.groupName}</th>
                        <th className="px-3 py-2 text-left">1st</th>
                        <th className="px-3 py-2 text-left">2nd</th>
                        <th className="px-3 py-2 text-left">3rd</th>
                        <th className="px-3 py-2 text-left">4th</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.picks
                        .filter(pk => filteredIds.has(pk.userId))
                        .map(pk => {
                          const player = players.find(p => p.userId === pk.userId)
                          return (
                            <tr key={pk.userId} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-3 py-2 font-medium">{player?.displayName ?? '—'}</td>
                              <td className="px-3 py-2">{pk.pos1}</td>
                              <td className="px-3 py-2">{pk.pos2}</td>
                              <td className="px-3 py-2">{pk.pos3}</td>
                              <td className="px-3 py-2">{pk.pos4}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── 3rd-Place Qualifiers ── */}
          <TabsContent value="qualifiers" className="mt-4">
            <div className="rounded-md border border-border overflow-hidden">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-3 py-2 text-left w-32">Player</th>
                    <th className="px-3 py-2 text-left">8 Teams Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPicks.map(p => (
                    <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium align-top">{p.displayName}</td>
                      <td className="px-3 py-2">
                        {p.qualifiers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.qualifiers.map((t, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs">{t}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── Match Predictions ── */}
          <TabsContent value="matches" className="mt-4 space-y-3">
            {/* Stage sub-tabs */}
            <div className="flex flex-wrap gap-1">
              {stagesWithPicks.map(s => (
                <button
                  key={s}
                  onClick={() => setMatchStage(s)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    matchStage === s
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
                  }`}
                >
                  {STAGE_LABELS[s] ?? s}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="text-xs w-full min-w-[400px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-3 py-2 text-left sticky left-0 bg-muted/80 backdrop-blur z-10 min-w-[140px]">Match</th>
                    {filtered.map(p => (
                      <th key={p.userId} className="px-3 py-2 text-center whitespace-nowrap">{p.displayName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches
                    .filter(m => m.stage === matchStage)
                    .map(m => (
                      <tr key={m.matchId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 sticky left-0 bg-background border-r border-border">
                          <span className="font-medium">{m.homeTeam}</span>
                          <span className="text-muted-foreground mx-1">vs</span>
                          <span className="font-medium">{m.awayTeam}</span>
                          <div className="text-muted-foreground/70 text-[10px]">{m.label}</div>
                        </td>
                        {filtered.map(p => {
                          const pred = m.predictions.find(pr => pr.userId === p.userId)
                          return (
                            <td key={p.userId} className="px-3 py-2 text-center font-mono">
                              {pred ? `${pred.home}–${pred.away}` : <span className="text-muted-foreground">—</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── Rebuys ── */}
          <TabsContent value="rebuys" className="mt-4">
            {filteredPicks.some(p => p.rebuy) ? (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground">
                      <th className="px-3 py-2 text-left">Player</th>
                      <th className="px-3 py-2 text-left">New Champion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPicks.filter(p => p.rebuy).map(p => (
                      <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{p.displayName}</td>
                        <td className="px-3 py-2">{p.rebuy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No rebuys submitted yet.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
