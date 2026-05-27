'use client'

import { useState, useCallback } from 'react'
import { saveMatchPrediction } from './actions'
import { isMatchLocked } from '@/lib/utils/lock'
import { getFlag } from '@/lib/teams/meta'

type TeamRef = { id: number; name: string; code: string } | null

type Match = {
  id: number
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
  predictions: Prediction[]
  stage: string
}

function StatusDot({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  const styles: Record<Exclude<SaveStatus, 'idle'>, string> = {
    saving: 'bg-yellow-400 animate-pulse',
    saved: 'bg-green-500',
    error: 'bg-red-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${styles[status]}`} />
}

export default function KnockoutForm({ matches, predictions }: Props) {
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

  const setStatus = (id: number, s: SaveStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: s }))

  const handleBlur = useCallback(
    async (match: Match) => {
      const { home, away } = scores[match.id]
      if (home === '' || away === '') return
      const h = Number(home)
      const a = Number(away)
      if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) return

      setStatus(match.id, 'saving')
      const { error } = await saveMatchPrediction(match.id, h, a)
      setStatus(match.id, error ? 'error' : 'saved')
    },
    [scores]
  )

  function updateScore(matchId: number, side: 'home' | 'away', value: string) {
    if (value !== '' && (!/^\d+$/.test(value) || Number(value) > 20)) return
    setScores((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [side]: value } }))
    setStatus(matchId, 'idle')
  }

  if (matches.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No matches scheduled for this stage yet.
      </p>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-right">Home</th>
            <th className="px-3 py-2 text-center w-28">Score</th>
            <th className="px-3 py-2 text-left">Away</th>
            <th className="px-3 py-2 w-4" />
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const locked = isMatchLocked(match.locked_at)
            const { home, away } = scores[match.id]
            const status = statuses[match.id] ?? 'idle'
            const kickoff = new Date(match.scheduled_at)
            const homeName = match.home_team?.code ?? 'TBD'
            const awayName = match.away_team?.code ?? 'TBD'
            const homeFlag = match.home_team?.code ? getFlag(match.home_team.code) : '🏳️'
            const awayFlag = match.away_team?.code ? getFlag(match.away_team.code) : '🏳️'

            return (
              <tr key={match.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-xs">
                  {kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td className="px-3 py-2 text-right font-medium"><span className="mr-1">{homeFlag}</span>{homeName}</td>
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
                </td>
                <td className="px-3 py-2 font-medium"><span className="mr-1">{awayFlag}</span>{awayName}</td>
                <td className="px-3 py-2 text-center">
                  <StatusDot status={status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
