'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { submitRebuy } from './actions'
import { getFlag } from '@/lib/teams/meta'

interface Rebuy {
  team_id: number | null
  unlocked_at_stage: string
  points_available: number
  submitted_at: string | null
}

interface Props {
  rebuy: Rebuy | null
  originalChampion: string | null
  originalChampionCode: string | null
  teams: { id: number; name: string; code: string }[]
}

export default function RebuyForm({ rebuy, originalChampion, originalChampionCode, teams }: Props) {
  const t = useTranslations('predictions')

  const STAGE_LABELS: Record<string, string> = {
    r32: t('stageR32'), r16: t('stageR16'), qf: t('stageQF'),
    sf: t('stageSF'), '3rd': t('stage3rd'), final: t('stageFinal'),
  }

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    rebuy?.team_id ?? null
  )
  const [pending, startTransition] = useTransition()

  function handleTeamChange(id: number | null) {
    setSelectedTeamId(id)
    const code = id ? teams.find(tm => tm.id === id)?.code ?? null : null
    window.dispatchEvent(new CustomEvent('champion-changed', { detail: { code } }))
  }

  if (!rebuy) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          <p className="font-medium">{t('noRebuyYet')}</p>
          <p className="text-sm text-muted-foreground">
            {originalChampion
              ? t('championStillInNamed', { champion: `${originalChampionCode ? getFlag(originalChampionCode) + ' ' : ''}${originalChampion}` })
              : t('noPick')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t('rebuyAutoUnlocks')}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (rebuy.submitted_at) {
    const submittedTeam = teams.find((tm) => tm.id === rebuy.team_id)
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          <p className="font-medium text-green-600 dark:text-green-400">{t('rebuySubmittedTitle')}</p>
          <p className="text-sm text-muted-foreground">
            {t('newChampionPick')}{' '}
            <strong>
              {submittedTeam ? `${getFlag(submittedTeam.code)} ${submittedTeam.name}` : '—'}
            </strong>
          </p>
          <p className="text-xs text-muted-foreground">
            {t('potentialBonusPts', {
              pts: rebuy.points_available,
              stage: STAGE_LABELS[rebuy.unlocked_at_stage] ?? rebuy.unlocked_at_stage,
            })}
          </p>
        </CardContent>
      </Card>
    )
  }

  function handleSubmit() {
    if (!selectedTeamId) {
      toast.error(t('selectFirst'))
      return
    }
    startTransition(async () => {
      try {
        await submitRebuy(selectedTeamId)
        toast.success(t('rebuySuccess'))
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4 space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">{t('originalChampionLabel')} </span>
            <strong>
              {originalChampion
                ? `${originalChampionCode ? getFlag(originalChampionCode) + ' ' : ''}${originalChampion}`
                : '—'}
            </strong>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">{t('unlockedAtLabel')} </span>
            {STAGE_LABELS[rebuy.unlocked_at_stage] ?? rebuy.unlocked_at_stage}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">{t('potentialBonusLabel')} </span>
            <strong>{rebuy.points_available} pts</strong>
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('pickNewChampion')}</label>
        <select
          value={selectedTeamId ?? ''}
          onChange={(e) => handleTeamChange(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t('selectTeam')}</option>
          {teams.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name} {getFlag(tm.code)}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selectedTeamId || pending}
        className="w-full"
      >
        {pending ? t('submitting') : t('lockIn')}
      </Button>
    </div>
  )
}
