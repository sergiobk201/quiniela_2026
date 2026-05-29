'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  saveTrophyAndAwards,
  saveGroupStandings,
  saveThirdPlaceQualifiers,
} from './actions'
import { getFlag } from '@/lib/teams/meta'

type Team = { id: number; name: string; code: string; group_id: number | null }
type Group = { id: number; name: string }
type GroupStandingRow = {
  group_id: number
  predicted_1st: number | null
  predicted_2nd: number | null
  predicted_3rd: number | null
  predicted_4th: number | null
}

interface Props {
  teams: Team[]
  groups: Group[]
  prediction: {
    champion_team_id: number | null
    runner_up_team_id: number | null
    third_place_team_id: number | null
    golden_boot_player: string | null
    golden_glove_player: string | null
    kopa_player: string | null
    total_goals_prediction: number | null
    first_eliminated_team_id: number | null
    most_yellows_team_id: number | null
  } | null
  standings: GroupStandingRow[]
  qualifierTeamIds: number[]
  locked: boolean
}

function TeamSelect({
  value,
  onChange,
  teams,
  disabled,
  placeholder = 'Select team',
}: {
  value: number | null
  onChange: (id: number | null) => void
  teams: Team[]
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {teams.map(t => (
        <option key={t.id} value={t.id}>
          {getFlag(t.code)} {t.name}
        </option>
      ))}
    </select>
  )
}

const STANDING_POSITION_KEYS = [
  { key: 'predicted_1st' as const, posKey: 'position1' },
  { key: 'predicted_2nd' as const, posKey: 'position2' },
  { key: 'predicted_3rd' as const, posKey: 'position3' },
  { key: 'predicted_4th' as const, posKey: 'position4' },
]

export default function PreTournamentForm({
  teams,
  groups,
  prediction,
  standings,
  qualifierTeamIds,
  locked,
}: Props) {
  const t = useTranslations('predictions')

  const TROPHY_FIELDS = [
    { key: 'champion_team_id' as const,    label: t('champion') },
    { key: 'runner_up_team_id' as const,   label: t('runnerUp') },
    { key: 'third_place_team_id' as const, label: t('thirdPlacePick') },
  ]

  const AWARD_FIELDS = [
    { key: 'golden_boot_player' as const,  label: t('goldenBoot') },
    { key: 'golden_glove_player' as const, label: t('goldenGlove') },
    { key: 'kopa_player' as const,         label: t('kopaAward') },
  ]

  const [trophy, setTrophy] = useState({
    champion_team_id: prediction?.champion_team_id ?? null,
    runner_up_team_id: prediction?.runner_up_team_id ?? null,
    third_place_team_id: prediction?.third_place_team_id ?? null,
    golden_boot_player: prediction?.golden_boot_player ?? '',
    golden_glove_player: prediction?.golden_glove_player ?? '',
    kopa_player: prediction?.kopa_player ?? '',
    total_goals_prediction: prediction?.total_goals_prediction ?? null,
    first_eliminated_team_id: prediction?.first_eliminated_team_id ?? null,
    most_yellows_team_id: prediction?.most_yellows_team_id ?? null,
  })

  const [groupStandings, setGroupStandings] = useState<Record<number, GroupStandingRow>>(() => {
    const init: Record<number, GroupStandingRow> = {}
    for (const g of groups) {
      const existing = standings.find(s => s.group_id === g.id)
      init[g.id] = existing ?? {
        group_id: g.id,
        predicted_1st: null,
        predicted_2nd: null,
        predicted_3rd: null,
        predicted_4th: null,
      }
    }
    return init
  })

  const [selectedQualifiers, setSelectedQualifiers] = useState<Set<number>>(
    new Set(qualifierTeamIds)
  )

  const [pendingTrophy, startTrophyTransition] = useTransition()
  const [pendingStandings, startStandingsTransition] = useTransition()
  const [pendingQualifiers, startQualifiersTransition] = useTransition()

  function handleSaveTrophy() {
    startTrophyTransition(async () => {
      const { error } = await saveTrophyAndAwards(trophy)
      error ? toast.error(error) : toast.success(t('saveTrophy'))
    })
  }

  function handleSaveStandings() {
    startStandingsTransition(async () => {
      const { error } = await saveGroupStandings(Object.values(groupStandings))
      error ? toast.error(error) : toast.success(t('saveAllStandings'))
    })
  }

  function handleSaveQualifiers() {
    startQualifiersTransition(async () => {
      const { error } = await saveThirdPlaceQualifiers(Array.from(selectedQualifiers))
      error ? toast.error(error) : toast.success(t('saveQualifiers'))
    })
  }

  function updateStanding(
    groupId: number,
    pos: keyof Omit<GroupStandingRow, 'group_id'>,
    teamId: number | null
  ) {
    setGroupStandings(prev => ({
      ...prev,
      [groupId]: { ...prev[groupId], [pos]: teamId },
    }))
  }

  function getAvailableForPos(
    groupId: number,
    pos: keyof Omit<GroupStandingRow, 'group_id'>
  ): Team[] {
    const standing = groupStandings[groupId]
    const usedIds = STANDING_POSITION_KEYS.filter(p => p.key !== pos)
      .map(p => standing[p.key])
      .filter((id): id is number => id !== null)
    return teams.filter(tm => tm.group_id === groupId && !usedIds.includes(tm.id))
  }

  function getPosInGroup(teamId: number, groupId: number): 1 | 2 | 3 | 4 | null {
    const s = groupStandings[groupId]
    if (!s) return null
    if (s.predicted_1st === teamId) return 1
    if (s.predicted_2nd === teamId) return 2
    if (s.predicted_3rd === teamId) return 3
    if (s.predicted_4th === teamId) return 4
    return null
  }

  function toggleQualifier(teamId: number, groupId: number) {
    setSelectedQualifiers(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        const groupTeamIds = teams.filter(tm => tm.group_id === groupId).map(tm => tm.id)
        for (const id of groupTeamIds) next.delete(id)
        if (next.size < 8) next.add(teamId)
      }
      return next
    })
  }

  const posLabels = [t('position1'), t('position2'), t('position3'), t('position4')]

  return (
    <Tabs defaultValue="trophy">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="trophy">{t('trophy')}</TabsTrigger>
        <TabsTrigger value="standings">{t('standings')}</TabsTrigger>
        <TabsTrigger value="qualifiers">{t('qualifiers3rdTitle')}</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Trophy & Awards ── */}
      <TabsContent value="trophy" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('top3Finishers')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TROPHY_FIELDS.map(({ key, label }) => {
              const otherIds = TROPHY_FIELDS
                .filter(f => f.key !== key)
                .map(f => trophy[f.key])
                .filter((id): id is number => id !== null)
              const available = teams.filter(tm => !otherIds.includes(tm.id))
              return (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <TeamSelect
                    value={trophy[key]}
                    onChange={id => {
                      setTrophy(prev => ({ ...prev, [key]: id }))
                      if (key === 'champion_team_id') {
                        const code = id ? teams.find(tm => tm.id === id)?.code ?? null : null
                        window.dispatchEvent(new CustomEvent('champion-changed', { detail: { code } }))
                      }
                    }}
                    teams={available}
                    disabled={locked}
                    placeholder={t('selectTeam')}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('individualAwards')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AWARD_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <Input
                  value={trophy[key] as string}
                  onChange={e => setTrophy(prev => ({ ...prev, [key]: e.target.value }))}
                  disabled={locked}
                  placeholder={t('playerNamePlaceholder')}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('funBets')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('totalGoals')}</label>
              <Input
                type="number"
                min={0}
                value={trophy.total_goals_prediction ?? ''}
                onChange={e =>
                  setTrophy(prev => ({
                    ...prev,
                    total_goals_prediction: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                disabled={locked}
                placeholder={t('goalsPlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('firstEliminated')}</label>
              <TeamSelect
                value={trophy.first_eliminated_team_id}
                onChange={id => setTrophy(prev => ({ ...prev, first_eliminated_team_id: id }))}
                teams={teams}
                disabled={locked}
                placeholder={t('selectTeam')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('mostYellows')}</label>
              <TeamSelect
                value={trophy.most_yellows_team_id}
                onChange={id => setTrophy(prev => ({ ...prev, most_yellows_team_id: id }))}
                teams={teams}
                disabled={locked}
                placeholder={t('selectTeam')}
              />
            </div>
          </CardContent>
        </Card>

        {locked ? (
          <p className="text-sm text-destructive text-right">{t('predictionsLocked')}</p>
        ) : (
          <div className="flex justify-end">
            <Button onClick={handleSaveTrophy} disabled={pendingTrophy}>
              {pendingTrophy ? '…' : t('saveTrophy')}
            </Button>
          </div>
        )}
      </TabsContent>

      {/* ── Tab 2: Group Standings ── */}
      <TabsContent value="standings" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => {
            const standing = groupStandings[group.id]
            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{t('groupLabel', { name: group.name })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {STANDING_POSITION_KEYS.map(({ key }, idx) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{posLabels[idx]}</span>
                      <TeamSelect
                        value={standing[key]}
                        onChange={id => updateStanding(group.id, key, id)}
                        teams={getAvailableForPos(group.id, key)}
                        disabled={locked}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {locked ? (
          <p className="text-sm text-destructive text-right mt-4">{t('predictionsLocked')}</p>
        ) : (
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveStandings} disabled={pendingStandings}>
              {pendingStandings ? '…' : t('saveAllStandings')}
            </Button>
          </div>
        )}
      </TabsContent>

      {/* ── Tab 3: 3rd-Place Qualifiers ── */}
      <TabsContent value="qualifiers" className="mt-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('qualifiersSub')}{' '}
          <span className={selectedQualifiers.size === 8 ? 'text-green-500 font-medium' : 'text-yellow-500 font-medium'}>
            {t('qualifiersSelected', { count: selectedQualifiers.size })}
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => {
            const groupTeams = teams.filter(tm => tm.group_id === group.id)
            const groupHasSelection = groupTeams.some(tm => selectedQualifiers.has(tm.id))
            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{t('groupLabel', { name: group.name })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {groupTeams.map(team => {
                    const isSelected = selectedQualifiers.has(team.id)
                    const pos = getPosInGroup(team.id, group.id)
                    const isIneligible = pos === 1 || pos === 2 || pos === 4
                    const isMaxed = !isSelected && !groupHasSelection && selectedQualifiers.size >= 8
                    const isDisabled = locked || isIneligible || (isMaxed && !isSelected)

                    return (
                      <label
                        key={team.id}
                        className={`flex items-center gap-2 text-sm rounded px-2 py-1 transition-colors ${
                          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted'
                        } ${isIneligible ? 'opacity-30' : isMaxed ? 'opacity-40' : ''} ${
                          isSelected ? 'bg-muted' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !locked && !isIneligible && toggleQualifier(team.id, group.id)}
                          disabled={isDisabled}
                          className="accent-primary"
                        />
                        <span className={isIneligible ? 'text-muted-foreground' : ''}>
                          {getFlag(team.code)} {team.name}
                        </span>
                        {pos !== null && (
                          <span className={`ml-auto text-xs font-medium shrink-0 ${
                            pos === 3 ? 'text-amber-500' : 'text-muted-foreground/50'
                          }`}>
                            {pos === 1 ? t('position1') : pos === 2 ? t('position2') : pos === 3 ? `${t('position3')} ✓` : t('position4')}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {locked ? (
          <p className="text-sm text-destructive text-right">{t('predictionsLocked')}</p>
        ) : (
          <div className="flex justify-end">
            <Button
              onClick={handleSaveQualifiers}
              disabled={pendingQualifiers || selectedQualifiers.size !== 8}
            >
              {pendingQualifiers ? '…' : t('saveQualifiers')}
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
