'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { submitRebuy } from './actions'

interface Rebuy {
  team_id: number | null
  unlocked_at_stage: string
  points_available: number
  submitted_at: string | null
}

interface Props {
  rebuy: Rebuy | null
  originalChampion: string | null
  teams: { id: number; name: string }[]
}

const STAGE_LABELS: Record<string, string> = {
  r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-Finals',
  sf: 'Semi-Finals', '3rd': '3rd Place', final: 'Final',
}

export default function RebuyForm({ rebuy, originalChampion, teams }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    rebuy?.team_id ?? null
  )
  const [pending, startTransition] = useTransition()

  // No rebuy available
  if (!rebuy) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          <p className="font-medium">No rebuy available yet</p>
          <p className="text-sm text-muted-foreground">
            {originalChampion
              ? `Your predicted champion (${originalChampion}) is still in the tournament.`
              : 'Submit your pre-tournament champion pick first.'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Your rebuy unlocks automatically when your predicted champion is eliminated.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Already submitted
  if (rebuy.submitted_at) {
    const submittedTeam = teams.find((t) => t.id === rebuy.team_id)
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          <p className="font-medium text-green-600 dark:text-green-400">Rebuy Submitted</p>
          <p className="text-sm text-muted-foreground">
            New champion pick: <strong>{submittedTeam?.name ?? 'Unknown'}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Potential bonus: {rebuy.points_available} pts · Unlocked at{' '}
            {STAGE_LABELS[rebuy.unlocked_at_stage] ?? rebuy.unlocked_at_stage}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Rebuy available — show form
  function handleSubmit() {
    if (!selectedTeamId) {
      toast.error('Select a team first')
      return
    }
    startTransition(async () => {
      try {
        await submitRebuy(selectedTeamId)
        toast.success('Rebuy submitted — good luck!')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Submit failed')
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4 space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">Original champion: </span>
            <strong>{originalChampion ?? '—'}</strong>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Unlocked at: </span>
            {STAGE_LABELS[rebuy.unlocked_at_stage] ?? rebuy.unlocked_at_stage}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Potential bonus: </span>
            <strong>{rebuy.points_available} pts</strong>
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <label className="text-sm font-medium">Pick your new champion</label>
        <select
          value={selectedTeamId ?? ''}
          onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select team…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selectedTeamId || pending}
        className="w-full"
      >
        {pending ? 'Submitting…' : 'Lock In Rebuy — This Cannot Be Changed'}
      </Button>
    </div>
  )
}
