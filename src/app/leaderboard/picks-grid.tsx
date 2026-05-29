'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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

export default function PicksGrid({ players, playerPicks, groupStandings, matches, picksVisible }: Props) {
  const t = useTranslations('leaderboard')
  const tPred = useTranslations('predictions')

  const STAGE_LABELS: Record<string, string> = {
    group: t('stageGroup'),
    r32: t('stageR32'),
    r16: t('stageR16'),
    qf: t('stageQF'),
    sf: t('stageSF'),
    '3rd': t('stage3rd'),
    final: t('stageFinal'),
  }

  const stagesWithPicks = STAGE_ORDER.filter(s => matches.some(m => m.stage === s))
  const [search, setSearch] = useState('')
  const [matchStage, setMatchStage] = useState<string>(() => stagesWithPicks[0] ?? 'group')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return players
    return players.filter(p => p.displayName.toLowerCase().includes(q))
  }, [search, players])

  const filteredIds = new Set(filtered.map(p => p.userId))
  const filteredPicks = playerPicks.filter(p => filteredIds.has(p.userId))
  const isSearchActive = search.trim().length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{t('allPicks')}</h2>
        {picksVisible && (
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs h-8 text-sm"
          />
        )}
      </div>

      {!picksVisible ? (
        <div className="rounded-lg border border-border bg-muted/30 py-10 text-center space-y-1">
          <p className="text-sm font-medium">{t('pickHidden')}</p>
          <p className="text-xs text-muted-foreground">{t('pickHiddenDate')}</p>
        </div>
      ) : (
        <Tabs defaultValue="trophy">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="trophy">{t('tabs.trophy')}</TabsTrigger>
            <TabsTrigger value="standings">{t('tabs.standings')}</TabsTrigger>
            <TabsTrigger value="qualifiers">{t('tabs.qualifiers')}</TabsTrigger>
            <TabsTrigger value="matches">{t('tabs.matches')}</TabsTrigger>
            <TabsTrigger value="rebuys">{t('tabs.rebuys')}</TabsTrigger>
          </TabsList>

          {/* ── Trophy & Awards ── */}
          <TabsContent value="trophy" className="mt-4">
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="text-xs w-full min-w-[720px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-3 py-2 text-left sticky left-0 bg-muted/80 backdrop-blur z-10 min-w-[120px]">{t('player')}</th>
                    <th className="px-3 py-2 text-left">{tPred('champion')}</th>
                    <th className="px-3 py-2 text-left">{tPred('runnerUp')}</th>
                    <th className="px-3 py-2 text-left">{tPred('thirdPlacePick')}</th>
                    <th className="px-3 py-2 text-left">{tPred('goldenBoot')}</th>
                    <th className="px-3 py-2 text-left">{tPred('goldenGlove')}</th>
                    <th className="px-3 py-2 text-left">{tPred('kopaAward')}</th>
                    <th className="px-3 py-2 text-center">{t('goals')}</th>
                    <th className="px-3 py-2 text-left">{t('firstOut')}</th>
                    <th className="px-3 py-2 text-left">{t('mostYellows')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPicks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground text-xs">
                        {isSearchActive ? t('noResults') : t('noPicksYet')}
                      </td>
                    </tr>
                  ) : filteredPicks.map(p => (
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
                        <td colSpan={9} className="px-3 py-2 text-muted-foreground italic">{t('noPicksYet')}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── Group Standings ── */}
          <TabsContent value="standings" className="mt-4">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {isSearchActive ? t('noResults') : t('noStandingsYet')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupStandings.map(group => (
                  <div key={group.groupId} className="rounded-md border border-border overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="border-b bg-muted/50 text-muted-foreground">
                          <th className="px-3 py-2 text-left">{t('groupPrefix', { name: group.groupName })}</th>
                          <th className="px-3 py-2 text-left">{tPred('position1')}</th>
                          <th className="px-3 py-2 text-left">{tPred('position2')}</th>
                          <th className="px-3 py-2 text-left">{tPred('position3')}</th>
                          <th className="px-3 py-2 text-left">{tPred('position4')}</th>
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
            )}
          </TabsContent>

          {/* ── 3rd-Place Qualifiers ── */}
          <TabsContent value="qualifiers" className="mt-4">
            {filteredPicks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {isSearchActive ? t('noResults') : t('noQualifiersYet')}
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground">
                      <th className="px-3 py-2 text-left w-32">{t('player')}</th>
                      <th className="px-3 py-2 text-left">{t('teamsSelected')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPicks.map(p => (
                      <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium align-top">{p.displayName}</td>
                        <td className="px-3 py-2">
                          {p.qualifiers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.qualifiers.map((team, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs">{team}</span>
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
            )}
          </TabsContent>

          {/* ── Match Predictions ── */}
          <TabsContent value="matches" className="mt-4 space-y-3">
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

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {isSearchActive ? t('noResults') : t('noMatchPredsYet')}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="text-xs w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground">
                      <th className="px-3 py-2 text-left sticky left-0 bg-muted/80 backdrop-blur z-10 min-w-[140px]">{t('matchCol')}</th>
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
                                {pred ? `${pred.home}–${pred.away}` : '—'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ── Rebuys ── */}
          <TabsContent value="rebuys" className="mt-4">
            {filteredPicks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {isSearchActive ? t('noResults') : t('noRebuysYet')}
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground">
                      <th className="px-3 py-2 text-left">{t('player')}</th>
                      <th className="px-3 py-2 text-left">{tPred('rebuyTitle')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPicks.map(p => (
                      <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{p.displayName}</td>
                        <td className="px-3 py-2">
                          {p.rebuy ?? <span className="text-muted-foreground italic">{isSearchActive ? t('noRebuyFor') : t('noRebuysYet')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
