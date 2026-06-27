'use client'

import { useTransition, useState } from 'react'
import { updateScore, toggleUpset, updateStatus } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getFlag } from '@/lib/teams/meta'

type Team = { id: number; name: string; code: string } | null

interface MatchRowProps {
  id: number
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  winnerTeamId: number | null
  status: string
  upset: boolean | null
  scheduledAt: string
  stage: string
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-muted text-muted-foreground',
  live:      'bg-yellow-500/20 text-yellow-400',
  finished:  'bg-green-500/20 text-green-400',
}

const KNOCKOUT_STAGES = new Set(['r32', 'r16', 'qf', 'sf', '3rd', 'final'])

export function MatchRow({
  id, homeTeam, awayTeam,
  homeScore, awayScore, winnerTeamId,
  status, upset, scheduledAt, stage,
}: MatchRowProps) {
  const [home, setHome] = useState(homeScore?.toString() ?? '')
  const [away, setAway] = useState(awayScore?.toString() ?? '')
  const [winner, setWinner] = useState<number | null>(winnerTeamId)
  const [pending, startTransition] = useTransition()

  const isKnockout = KNOCKOUT_STAGES.has(stage)
  const h = parseInt(home)
  const a = parseInt(away)
  const scoresEqual = !isNaN(h) && !isNaN(a) && h >= 0 && a >= 0 && h === a
  const showWinner = isKnockout && scoresEqual

  function handleSave() {
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error('Enter valid scores (0 or higher)')
      return
    }
    if (isKnockout && scoresEqual && winner == null) {
      toast.warning('No winner selected — save anyway? Pick ET/penalties winner before recomputing scores.')
    }
    startTransition(async () => {
      try {
        // Pass winner only for knockout draws; null clears it for regulation wins
        await updateScore(id, h, a, isKnockout && scoresEqual ? winner : null)
        toast.success('Score saved')
      } catch {
        toast.error('Failed to save score')
      }
    })
  }

  function handleToggleUpset() {
    startTransition(async () => {
      await toggleUpset(id, upset ?? false)
    })
  }

  function handleStatusCycle() {
    const next = status === 'scheduled' ? 'live' : status === 'live' ? 'finished' : 'scheduled'
    startTransition(async () => {
      await updateStatus(id, next)
    })
  }

  const kickoff = new Date(scheduledAt)

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      {/* Date */}
      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
        {kickoff.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        <br />
        <span className="text-[11px]">{kickoff.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
        <br />
        <span className="text-[10px] opacity-50">{kickoff.toUTCString().slice(17, 22)} UTC</span>
      </td>

      {/* Home team */}
      <td className="px-3 py-2 text-right font-medium text-sm">
        {homeTeam
          ? <>{getFlag(homeTeam.code)} {homeTeam.name}</>
          : <span className="text-muted-foreground">TBD</span>}
      </td>

      {/* Score inputs */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            disabled={pending}
            className="w-14 h-7 text-center px-1 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            disabled={pending}
            className="w-14 h-7 text-center px-1 text-sm"
          />
        </div>
      </td>

      {/* Away team */}
      <td className="px-3 py-2 font-medium text-sm">
        {awayTeam
          ? <>{getFlag(awayTeam.code)} {awayTeam.name}</>
          : <span className="text-muted-foreground">TBD</span>}
      </td>

      {/* Knockout tiebreaker winner (ET/penalties) */}
      <td className="px-3 py-2">
        {showWinner && homeTeam && awayTeam ? (
          <div className="flex gap-1">
            <button
              onClick={() => setWinner(homeTeam.id)}
              disabled={pending}
              className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                winner === homeTeam.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary'
              }`}
            >
              {getFlag(homeTeam.code)} {homeTeam.code}
            </button>
            <button
              onClick={() => setWinner(awayTeam.id)}
              disabled={pending}
              className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                winner === awayTeam.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary'
              }`}
            >
              {getFlag(awayTeam.code)} {awayTeam.code}
            </button>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>

      {/* Status badge */}
      <td className="px-3 py-2">
        <button
          onClick={handleStatusCycle}
          disabled={pending}
          className={`text-xs font-medium px-2 py-0.5 rounded-full border border-transparent capitalize transition-colors ${statusColors[status] ?? statusColors.scheduled}`}
        >
          {status}
        </button>
      </td>

      {/* Upset toggle */}
      <td className="px-3 py-2">
        <button
          onClick={handleToggleUpset}
          disabled={pending}
          className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
            upset
              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {upset ? 'Upset' : '—'}
        </button>
      </td>

      {/* Save */}
      <td className="px-3 py-2">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={pending} className="h-7 text-xs">
          Save
        </Button>
      </td>
    </tr>
  )
}
