'use client'

import { Fragment, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
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
  predicted_winner_team_id?: number | null
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

  const [winners, setWinners] = useState<Record<number, number | null>>(() => {
    const init: Record<number, number | null> = {}
    for (const m of matches) {
      const pred = predictions.find((p) => p.match_id === m.id)
      init[m.id] = pred?.predicted_winner_team_id ?? null
    }
    return init
  })

  const [statuses, setStatuses] = useState<Record<number, SaveStatus>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})

  const setStatus = (id: number, s: SaveStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: s }))

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
      const { error } = await saveMatchPrediction(match.id, hn, an, winners[match.id] ?? null)
      setStatus(match.id, error ? 'error' : 'saved')
    },
    [scores, winners, t]
  )

  const handleWinnerClick = useCallback(
    async (match: Match, teamId: number) => {
      const newWinner = winners[match.id] === teamId ? null : teamId
      setWinners((prev) => ({ ...prev, [match.id]: newWinner }))
      const { home, away } = scores[match.id]
      const hn = Number(home)
      const an = Number(away)
      if (!Number.isInteger(hn) || !Number.isInteger(an) || hn < 0 || an < 0) return
      setStatus(match.id, 'saving')
      const { error } = await saveMatchPrediction(match.id, hn, an, newWinner)
      setStatus(match.id, error ? 'error' : 'saved')
    },
    [winners, scores]
  )

  function updateScore(matchId: number, side: 'home' | 'away', value: string) {
    if (value !== '' && (!/^\d+$/.test(value) || Number(value) > 20 || (value.length > 1 && value.startsWith('0')))) return
    setScores((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [side]: value } }))
    setStatus(matchId, 'idle')
    setNotes((prev) => (prev[matchId] ? { ...prev, [matchId]: '' } : prev))
  }

  if (matches.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        {t('noMatchesYet')}
      </p>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
            <th className="px-3 py-2 text-left">{t('date')}</th>
            <th className="px-3 py-2 text-right">{t('home')}</th>
            <th className="px-3 py-2 text-center w-28">{t('score')}</th>
            <th className="px-3 py-2 text-left">{t('away')}</th>
            <th className="px-3 py-2 w-4" />
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const locked = isMatchLocked(match.locked_at)
            const { home, away } = scores[match.id]
            const status = statuses[match.id] ?? 'idle'
            const kickoff = new Date(match.scheduled_at)
            const homeName = match.home_team?.code ?? t('tbdTeam')
            const awayName = match.away_team?.code ?? t('tbdTeam')
            const homeFlag = match.home_team?.code ? getFlag(match.home_team.code) : '🏳️'
            const awayFlag = match.away_team?.code ? getFlag(match.away_team.code) : '🏳️'
            const isTie = home !== '' && away !== '' && home === away
            const currentWinner = winners[match.id] ?? null

            return (
              <Fragment key={match.id}>
                <tr className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-xs" suppressHydrationWarning>
                    <div>{kickoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                    <div className="opacity-60">{kickoff.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
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
                    {notes[match.id] && (
                      <p className="mt-1 text-[10px] leading-tight text-muted-foreground text-center">
                        {notes[match.id]}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium"><span className="mr-1">{awayFlag}</span>{awayName}</td>
                  <td className="px-3 py-2 text-center">
                    <StatusDot status={status} />
                  </td>
                </tr>

                {/* Tiebreaker row: visible only when the predicted score is a draw */}
                {isTie && match.home_team && match.away_team && (
                  <tr className="border-b last:border-0 bg-amber-500/5">
                    <td colSpan={5} className="px-4 py-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="text-muted-foreground">{t('knockoutTiebreaker')}</span>
                        <button
                          onClick={() => handleWinnerClick(match, match.home_team!.id)}
                          disabled={locked}
                          className={`px-2 py-0.5 rounded border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            currentWinner === match.home_team.id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                          }`}
                        >
                          {homeFlag} {homeName}
                        </button>
                        <button
                          onClick={() => handleWinnerClick(match, match.away_team!.id)}
                          disabled={locked}
                          className={`px-2 py-0.5 rounded border text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            currentWinner === match.away_team.id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                          }`}
                        >
                          {awayFlag} {awayName}
                        </button>
                        {currentWinner == null && (
                          <span className="text-amber-500 text-[10px]">{t('knockoutPickWinner')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
