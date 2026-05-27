'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
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

const TROPHY_FIELDS = [
  { key: 'champion_team_id', label: 'Champion' },
  { key: 'runner_up_team_id', label: 'Runner-up' },
  { key: 'third_place_team_id', label: '3rd Place' },
] as const

const AWARD_FIELDS = [
  { key: 'golden_boot_player', label: 'Golden Boot' },
  { key: 'golden_glove_player', label: 'Golden Glove' },
  { key: 'kopa_player', label: 'Kopa Award' },
] as const

const STANDING_POSITIONS = [
  { key: 'predicted_1st', label: '1st' },
  { key: 'predicted_2nd', label: '2nd' },
  { key: 'predicted_3rd', label: '3rd' },
  { key: 'predicted_4th', label: '4th' },
] as const

export default function PreTournamentForm({
  teams,
  groups,
  prediction,
  standings,
  qualifierTeamIds,
  locked,
}: Props) {
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
      try {
        await saveTrophyAndAwards(trophy)
        toast.success('Trophy & Awards saved')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  function handleSaveStandings() {
    startStandingsTransition(async () => {
      try {
        await saveGroupStandings(Object.values(groupStandings))
        toast.success('Group standings saved')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  function handleSaveQualifiers() {
    startQualifiersTransition(async () => {
      try {
        await saveThirdPlaceQualifiers(Array.from(selectedQualifiers))
        toast.success('3rd-place qualifiers saved')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Save failed')
      }
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
    const usedIds = STANDING_POSITIONS.filter(p => p.key !== pos)
      .map(p => standing[p.key])
      .filter((id): id is number => id !== null)
    return teams.filter(t => t.group_id === groupId && !usedIds.includes(t.id))
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
        // One per group: remove any existing pick from this group
        const groupTeamIds = teams.filter(t => t.group_id === groupId).map(t => t.id)
        for (const id of groupTeamIds) next.delete(id)
        if (next.size < 8) next.add(teamId)
      }
      return next
    })
  }

  return (
    <Tabs defaultValue="trophy">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="trophy">Trophy &amp; Awards</TabsTrigger>
        <TabsTrigger value="standings">Group Standings</TabsTrigger>
        <TabsTrigger value="qualifiers">3rd-Place Qualifiers</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Trophy & Awards ── */}
      <TabsContent value="trophy" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 3 Finishers</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TROPHY_FIELDS.map(({ key, label }) => {
              const otherIds = TROPHY_FIELDS
                .filter(f => f.key !== key)
                .map(f => trophy[f.key])
                .filter((id): id is number => id !== null)
              const available = teams.filter(t => !otherIds.includes(t.id))
              return (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <TeamSelect
                    value={trophy[key]}
                    onChange={id => {
                      setTrophy(prev => ({ ...prev, [key]: id }))
                      if (key === 'champion_team_id') {
                        const code = id ? teams.find(t => t.id === id)?.code ?? null : null
                        window.dispatchEvent(new CustomEvent('champion-changed', { detail: { code } }))
                      }
                    }}
                    teams={available}
                    disabled={locked}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Individual Awards</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AWARD_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <Input
                  value={trophy[key] as string}
                  onChange={e => setTrophy(prev => ({ ...prev, [key]: e.target.value }))}
                  disabled={locked}
                  placeholder="Player name"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fun Bets</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Total Goals</label>
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
                placeholder="e.g. 180"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">First Eliminated</label>
              <TeamSelect
                value={trophy.first_eliminated_team_id}
                onChange={id => setTrophy(prev => ({ ...prev, first_eliminated_team_id: id }))}
                teams={teams}
                disabled={locked}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Most Yellow Cards</label>
              <TeamSelect
                value={trophy.most_yellows_team_id}
                onChange={id => setTrophy(prev => ({ ...prev, most_yellows_team_id: id }))}
                teams={teams}
                disabled={locked}
              />
            </div>
          </CardContent>
        </Card>

        {locked ? (
          <p className="text-sm text-destructive text-right">Predictions are locked.</p>
        ) : (
          <div className="flex justify-end">
            <Button onClick={handleSaveTrophy} disabled={pendingTrophy}>
              {pendingTrophy ? 'Saving…' : 'Save Trophy & Awards'}
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
                  <CardTitle>Group {group.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {STANDING_POSITIONS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{label}</span>
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
          <p className="text-sm text-destructive text-right mt-4">Predictions are locked.</p>
        ) : (
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveStandings} disabled={pendingStandings}>
              {pendingStandings ? 'Saving…' : 'Save All Standings'}
            </Button>
          </div>
        )}
      </TabsContent>

      {/* ── Tab 3: 3rd-Place Qualifiers ── */}
      <TabsContent value="qualifiers" className="mt-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Pick <strong>8 of 12</strong> teams you predict will advance as 3rd-place qualifiers.{' '}
          <span className={selectedQualifiers.size === 8 ? 'text-green-500 font-medium' : 'text-yellow-500 font-medium'}>
            {selectedQualifiers.size} / 8 selected
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => {
            const groupTeams = teams.filter(t => t.group_id === group.id)
            const groupHasSelection = groupTeams.some(t => selectedQualifiers.has(t.id))
            return (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>Group {group.name}</CardTitle>
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
                          isDisabled
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer hover:bg-muted'
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
                            {pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd ✓' : '4th'}
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
          <p className="text-sm text-destructive text-right">Predictions are locked.</p>
        ) : (
          <div className="flex justify-end">
            <Button
              onClick={handleSaveQualifiers}
              disabled={pendingQualifiers || selectedQualifiers.size !== 8}
            >
              {pendingQualifiers ? 'Saving…' : 'Save Qualifiers'}
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
