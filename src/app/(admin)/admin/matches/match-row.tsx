'use client'

import { useTransition, useState } from 'react'
import { updateScore, toggleUpset, updateStatus } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Team = { id: number; name: string; code: string } | null

interface MatchRowProps {
  id: number
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
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

export function MatchRow({
  id, homeTeam, awayTeam,
  homeScore, awayScore,
  status, upset, scheduledAt,
}: MatchRowProps) {
  const [home, setHome] = useState(homeScore?.toString() ?? '')
  const [away, setAway] = useState(awayScore?.toString() ?? '')
  const [pending, startTransition] = useTransition()

  function handleSave() {
    const h = parseInt(home)
    const a = parseInt(away)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error('Enter valid scores (0 or higher)')
      return
    }
    startTransition(async () => {
      try {
        await updateScore(id, h, a)
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
      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
        {kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        <br />
        <span className="text-[11px]">{kickoff.toUTCString().slice(17, 22)} UTC</span>
      </td>

      {/* Home team */}
      <td className="px-3 py-2 text-right font-medium text-sm">
        {homeTeam?.name ?? <span className="text-muted-foreground">TBD</span>}
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
        {awayTeam?.name ?? <span className="text-muted-foreground">TBD</span>}
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
