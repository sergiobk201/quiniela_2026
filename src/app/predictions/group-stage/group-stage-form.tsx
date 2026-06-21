'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'
import { saveMatchPrediction } from './actions'
import { isMatchLocked } from '@/lib/utils/lock'
import { getFlag } from '@/lib/teams/meta'
import { computeGroupStandings } from '@/lib/scoring/group-standings'
import GroupStandingsTable from '@/components/predictions/GroupStandingsTable'

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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  matches: Match[]
  groups: { id: number; name: string }[]
  predictions: Prediction[]
}

function StatusDot({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  const map: Record<Exclude<SaveStatus, 'idle'>, string> = {
    saving: 'bg-yellow-400 animate-pulse',
    saved: 'bg-green-500',
    error: 'bg-red-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status]}`} />
}

export default function GroupStageForm({ matches, groups, predictions }: Props) {
  const t = useTranslations('predictions')
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>(() => {
    const init: Record<number, { home: string; away: string }> = {}
    for (const m of matches) {
      const pred = predictions.find((p) => p.match_id === m.id)
      init[m.id] = {
        home: pred?.predicted_home_score?.toString() ?? '',
        away: pred?.predicted_away_score?.toString() ?? '',
      }
    }
    return init
  })

  const [statuses, setStatuses] = useState<Record<number, SaveStatus>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})

  const setStatus = (matchId: number, status: SaveStatus) =>
    setStatuses((prev) => ({ ...prev, [matchId]: status }))

  const handleBlur = useCallback(
    async (match: Match) => {
      const { home, away } = scores[match.id]
      // Both blank = no bet. Nulls are not a prediction (see compute-scores cutover).
      if (home === '' && away === '') return

      // One side filled, the other blank: treat the blank as 0 so the bet counts,
      // and snap the empty box to "0" + show a note so the user knows what was saved.
      const h = home === '' ? '0' : home
      const a = away === '' ? '0' : away
      const coerced = home === '' || away === ''
      if (coerced) {
        setScores((prev) => ({ ...prev, [match.id]: { home: h, away: a } }))
        setNotes((prev) => ({ ...prev, [match.id]: t('autoZeroNote', { home: h, away: a }) }))
      }

      const hn = Number(h)
      const an = Number(a)
      if (!Number.isInteger(hn) || !Number.isInteger(an) || hn < 0 || an < 0) return

      setStatus(match.id, 'saving')
      const { error } = await saveMatchPrediction(match.id, hn, an)
      setStatus(match.id, error ? 'error' : 'saved')
    },
    [scores, t]
  )

  function updateScore(matchId: number, side: 'home' | 'away', value: string) {
    if (value !== '' && (!/^\d+$/.test(value) || Number(value) > 20 || (value.length > 1 && value.startsWith('0')))) return
    setScores((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [side]: value } }))
    setStatus(matchId, 'idle')
    setNotes((prev) => (prev[matchId] ? { ...prev, [matchId]: '' } : prev))
  }

  const totalFilled = Object.values(scores).filter((s) => s.home !== '' && s.away !== '').length

  return (
    <Tabs defaultValue={String(groups[0]?.id)}>
      <p className="text-muted-foreground text-sm mb-3">
        {t('groupStageSub', { filled: totalFilled, total: matches.length })}
      </p>
      <TabsList className="flex-wrap !h-auto w-full gap-1 justify-start">
        {groups.map((g) => {
          const groupMatches = matches.filter((m) => m.group_id === g.id)
          const filled = groupMatches.filter((m) => {
            const s = scores[m.id]
            return s?.home !== '' && s?.away !== ''
          }).length
          return (
            <TabsTrigger key={g.id} value={String(g.id)} className="text-xs flex-none">
              {t('groupLabel', { name: g.name })}
              <span className="ml-1 text-muted-foreground">
                {filled}/{groupMatches.length}
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {groups.map((g) => {
        const groupMatches = matches.filter((m) => m.group_id === g.id)
        return (
          <TabsContent key={g.id} value={String(g.id)} className="mt-4">
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                    <th className="px-3 py-2 text-left">{t('date')}</th>
                    <th className="px-3 py-2 text-right">{t('home')}</th>
                    <th className="px-3 py-2 text-center w-24">{t('score')}</th>
                    <th className="px-3 py-2 text-left">{t('away')}</th>
                    <th className="px-3 py-2 w-4" />
                  </tr>
                </thead>
                <tbody>
                  {groupMatches.map((match) => {
                    const locked = isMatchLocked(match.locked_at)
                    const { home, away } = scores[match.id]
                    const status = statuses[match.id] ?? 'idle'
                    const kickoff = new Date(match.scheduled_at)

                    return (
                      <tr key={match.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-xs" suppressHydrationWarning>
                          <div>{kickoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                          <div className="opacity-60">{kickoff.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          <span className="mr-1">{getFlag(match.home_team.code)}</span>{match.home_team.code}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={home}
                              onChange={(e) => updateScore(match.id, 'home', e.target.value)}
                              onBlur={() => handleBlur(match)}
                              disabled={locked}
                              placeholder="–"
                              className="w-10 h-8 text-center rounded border border-input bg-background text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <span className="text-muted-foreground">:</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={away}
                              onChange={(e) => updateScore(match.id, 'away', e.target.value)}
                              onBlur={() => handleBlur(match)}
                              disabled={locked}
                              placeholder="–"
                              className="w-10 h-8 text-center rounded border border-input bg-background text-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          {notes[match.id] && (
                            <p className="mt-1 text-[10px] leading-tight text-muted-foreground text-center">
                              {notes[match.id]}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          <span className="mr-1">{getFlag(match.away_team.code)}</span>{match.away_team.code}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <StatusDot status={status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <GroupStandingsTable
              standings={computeGroupStandings(groupMatches, scores)}
            />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
