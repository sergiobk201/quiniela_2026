'use client'

import { useState, useTransition } from 'react'
import type { TrophyConflict } from '@/lib/scoring/validate-trophy'
import { rankThirdPlaceTeams, type StandingsRow, type RankedThirdPlace } from '@/lib/scoring/group-standings'
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
    first_goal_scorer: string | null
    first_red_card_player: string | null
    total_red_cards_prediction: number | null
    final_goes_to_penalties: boolean | null
    total_own_goals_prediction: number | null
    most_goals_team_id: number | null
  } | null
  standings: GroupStandingRow[]
  qualifierTeamIds: number[]
  trophyLocked: boolean
  groupStageLocked: boolean
  initialWarnings: TrophyConflict[]
  computedByGroup: Record<number, StandingsRow[]>
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
          {t.name} {getFlag(t.code)}
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
  trophyLocked,
  groupStageLocked,
  initialWarnings,
  computedByGroup,
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
    first_goal_scorer: prediction?.first_goal_scorer ?? '',
    first_red_card_player: prediction?.first_red_card_player ?? '',
    total_red_cards_prediction: prediction?.total_red_cards_prediction ?? null,
    final_goes_to_penalties: prediction?.final_goes_to_penalties ?? null,
    total_own_goals_prediction: prediction?.total_own_goals_prediction ?? null,
    most_goals_team_id: prediction?.most_goals_team_id ?? null,
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

  const [selectedQualifiers, setSelectedQualifiers] = useState<Set<number>>(() => {
    const valid = new Set<number>()
    for (const id of qualifierTeamIds) {
      const team = teams.find(t => t.id === id)
      if (!team?.group_id) { valid.add(id); continue }
      const rows = computedByGroup[team.group_id]
      if (rows && rows.some(r => r.p > 0)) {
        // Computed data exists — only keep if this team is computed 3rd
        if (rows.find(r => r.teamId === id)?.rank === 3) valid.add(id)
        // else: stale selection from old standings — silently drop
      } else {
        valid.add(id) // no computed data, trust saved selection
      }
    }
    return valid
  })

  const [pendingTrophy, startTrophyTransition] = useTransition()
  const [pendingStandings, startStandingsTransition] = useTransition()
  const [pendingQualifiers, startQualifiersTransition] = useTransition()
  const [trophyWarnings, setTrophyWarnings] = useState<TrophyConflict[]>(initialWarnings)

  function handleSaveTrophy() {
    startTrophyTransition(async () => {
      const { error, warnings } = await saveTrophyAndAwards(trophy)
      if (error) {
        toast.error(error)
      } else {
        setTrophyWarnings(warnings)
        toast.success(t('saveTrophy'))
      }
    })
  }

  function handleSaveStandings() {
    startStandingsTransition(async () => {
      const { error, warnings } = await saveGroupStandings(Object.values(groupStandings))
      if (error) {
        toast.error(error)
      } else {
        setTrophyWarnings(warnings)
        toast.success(t('saveAllStandings'))
      }
    })
  }

  function handleSaveQualifiers() {
    startQualifiersTransition(async () => {
      const { error, warnings } = await saveThirdPlaceQualifiers(Array.from(selectedQualifiers))
      if (error) {
        toast.error(error)
      } else {
        setTrophyWarnings(warnings)
        toast.success(t('saveQualifiers'))
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

  // Source of truth: computed match standings when available, fallback to manual
  function getEffectivePosInGroup(teamId: number, groupId: number): 1 | 2 | 3 | 4 | null {
    const rows = computedByGroup[groupId]
    if (rows && rows.some(r => r.p > 0)) {
      return (rows.find(r => r.teamId === teamId)?.rank ?? null) as 1 | 2 | 3 | 4 | null
    }
    return getPosInGroup(teamId, groupId)
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

  function hasMismatch(groupId: number): boolean {
    const computed = computedByGroup[groupId]
    if (!computed || computed.length < 4) return false
    const manual = groupStandings[groupId]
    if (!manual) return false
    // Only flag if user has at least one match prediction for this group
    if (computed.every(r => r.p === 0)) return false
    return (
      computed[0]?.teamId !== manual.predicted_1st ||
      computed[1]?.teamId !== manual.predicted_2nd ||
      computed[2]?.teamId !== manual.predicted_3rd ||
      computed[3]?.teamId !== manual.predicted_4th
    )
  }

  function buildSyncedStandings(groupId: number): GroupStandingRow {
    const computed = computedByGroup[groupId]
    return {
      group_id: groupId,
      predicted_1st: computed?.[0]?.teamId ?? null,
      predicted_2nd: computed?.[1]?.teamId ?? null,
      predicted_3rd: computed?.[2]?.teamId ?? null,
      predicted_4th: computed?.[3]?.teamId ?? null,
    }
  }

  function syncGroup(groupId: number) {
    setGroupStandings(prev => ({ ...prev, [groupId]: buildSyncedStandings(groupId) }))
  }

  function syncAll() {
    const newStandings: Record<number, GroupStandingRow> = { ...groupStandings }
    for (const g of groups) {
      newStandings[g.id] = buildSyncedStandings(g.id)
    }
    setGroupStandings(newStandings)
    startStandingsTransition(async () => {
      const { error, warnings } = await saveGroupStandings(Object.values(newStandings))
      if (error) { toast.error(error) }
      else { setTrophyWarnings(warnings); toast.success(t('syncedSaved')) }
    })
  }

  const mismatchCount = groups.filter(g => hasMismatch(g.id)).length

  // Ranked 3rd-place teams derived from match predictions
  const rankedThirds: RankedThirdPlace[] = rankThirdPlaceTeams(
    groups.map(g => g.id),
    computedByGroup
  )
  const rankedThirdsMap = new Map(rankedThirds.map(r => [r.teamId, r]))
  // Only enable auto-select if user has at least some match predictions filled
  const hasAnyMatchData = rankedThirds.some(r => r.p > 0)
  const hasBorderlineTie = rankedThirds.some(r => r.borderline)

  function autoSelectTop8() {
    const top8 = rankedThirds.filter(r => r.qualifies).map(r => r.teamId)
    const next = new Set(selectedQualifiers)
    // Clear existing third-place selections and apply new top-8
    for (const r of rankedThirds) next.delete(r.teamId)
    for (const id of top8) next.add(id)
    setSelectedQualifiers(next)
  }

  return (
    <>
    {trophyWarnings.length > 0 && (
      <div className="rounded-lg border border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            ⚠ {t('trophyWarningTitle')}
          </p>
          <button
            type="button"
            onClick={() => setTrophyWarnings([])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-1">
          {trophyWarnings.map((w, i) => {
            const LABEL_KEYS = { champion: 'champion', runner_up: 'runnerUp', third_place: 'thirdPlacePick' } as const
            const label = t(LABEL_KEYS[w.field])
            return (
              <li key={i} className="text-xs text-amber-700 dark:text-amber-300">
                {t(w.messageKey as Parameters<typeof t>[0], { ...w.messageParams, label })}
              </li>
            )
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{t('trophyWarningSub')}</p>
      </div>
    )}
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
                    disabled={trophyLocked}
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
                  disabled={trophyLocked}
                  placeholder={t('playerNamePlaceholder')}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Scored Special Picks ── */}
        <Card>
          <CardHeader>
            <CardTitle>{t('scoredPicks')}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('scoredPicksSub')}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                <span>{t('totalGoals')}</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">5–10 pts</span>
              </label>
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
                disabled={trophyLocked}
                placeholder={t('goalsPlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                <span>{t('firstEliminated')}</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">5 pts</span>
              </label>
              <TeamSelect
                value={trophy.first_eliminated_team_id}
                onChange={id => setTrophy(prev => ({ ...prev, first_eliminated_team_id: id }))}
                teams={teams}
                disabled={trophyLocked}
                placeholder={t('selectTeam')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                <span>{t('mostYellows')}</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">5 pts</span>
              </label>
              <TeamSelect
                value={trophy.most_yellows_team_id}
                onChange={id => setTrophy(prev => ({ ...prev, most_yellows_team_id: id }))}
                teams={teams}
                disabled={trophyLocked}
                placeholder={t('selectTeam')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Fun Bets (no points) ── */}
        <Card>
          <CardHeader>
            <CardTitle>{t('funBets')}</CardTitle>
            <p className="text-xs text-muted-foreground">{t('funBetsSub')}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('firstGoalScorer')}</label>
              <Input
                value={trophy.first_goal_scorer}
                onChange={e => setTrophy(prev => ({ ...prev, first_goal_scorer: e.target.value }))}
                disabled={trophyLocked}
                placeholder={t('playerNamePlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('firstRedCard')}</label>
              <Input
                value={trophy.first_red_card_player}
                onChange={e => setTrophy(prev => ({ ...prev, first_red_card_player: e.target.value }))}
                disabled={trophyLocked}
                placeholder={t('playerNamePlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('totalRedCards')}</label>
              <Input
                type="number"
                min={0}
                value={trophy.total_red_cards_prediction ?? ''}
                onChange={e =>
                  setTrophy(prev => ({
                    ...prev,
                    total_red_cards_prediction: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                disabled={trophyLocked}
                placeholder={t('numberPlaceholder')}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('finalToPenalties')}</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => !trophyLocked && setTrophy(prev => ({ ...prev, final_goes_to_penalties: true }))}
                  disabled={trophyLocked}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    trophy.final_goes_to_penalties === true
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-muted'
                  }`}
                >
                  {t('penaltiesYes')}
                </button>
                <button
                  type="button"
                  onClick={() => !trophyLocked && setTrophy(prev => ({ ...prev, final_goes_to_penalties: false }))}
                  disabled={trophyLocked}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    trophy.final_goes_to_penalties === false
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-muted'
                  }`}
                >
                  {t('penaltiesNo')}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('totalOwnGoals')}</label>
              <Input
                type="number"
                min={0}
                value={trophy.total_own_goals_prediction ?? ''}
                onChange={e =>
                  setTrophy(prev => ({
                    ...prev,
                    total_own_goals_prediction: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                disabled={trophyLocked}
                placeholder={t('numberPlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t('mostGoalsTeam')}</label>
              <TeamSelect
                value={trophy.most_goals_team_id}
                onChange={id => setTrophy(prev => ({ ...prev, most_goals_team_id: id }))}
                teams={teams}
                disabled={trophyLocked}
                placeholder={t('selectTeam')}
              />
            </div>
          </CardContent>
        </Card>

        {trophyLocked ? (
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
        {mismatchCount > 0 && !groupStageLocked && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              ⚠ {t('standingsMismatchBanner', { count: mismatchCount })}
            </p>
            <Button size="sm" variant="outline" onClick={syncAll} disabled={pendingStandings}>
              {pendingStandings ? '…' : t('syncAll')}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => {
            const standing = groupStandings[group.id]
            const mismatch = hasMismatch(group.id)
            return (
              <Card key={group.id} className={mismatch ? 'border-amber-400/60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('groupLabel', { name: group.name })}</CardTitle>
                    {mismatch && !groupStageLocked && (
                      <button
                        type="button"
                        onClick={() => syncGroup(group.id)}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                      >
                        ⚠ {t('syncFromMatches')}
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {STANDING_POSITION_KEYS.map(({ key }, idx) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{posLabels[idx]}</span>
                      <TeamSelect
                        value={standing[key]}
                        onChange={id => updateStanding(group.id, key, id)}
                        teams={getAvailableForPos(group.id, key)}
                        disabled={groupStageLocked}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {groupStageLocked ? (
          <p className="text-sm text-destructive text-right mt-4">{t('standingsLocked')}</p>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            {t('qualifiersSub')}{' '}
            <span className={selectedQualifiers.size === 8 ? 'text-green-500 font-medium' : 'text-yellow-500 font-medium'}>
              {t('qualifiersSelected', { count: selectedQualifiers.size })}
            </span>
          </p>
          {hasAnyMatchData && !groupStageLocked && (
            <Button size="sm" variant="outline" onClick={autoSelectTop8}>
              {t('autoSelectTop8')}
            </Button>
          )}
        </div>

        {hasBorderlineTie && (
          <div className="rounded-lg border border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-2">
            <p className="text-xs text-amber-700 dark:text-amber-400">⚠ {t('borderlineTieWarning')}</p>
          </div>
        )}

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
                    const pos = getEffectivePosInGroup(team.id, group.id)
                    const isIneligible = pos === 1 || pos === 2 || pos === 4
                    const isMaxed = !isSelected && !groupHasSelection && selectedQualifiers.size >= 8
                    const isDisabled = groupStageLocked || isIneligible || (isMaxed && !isSelected)
                    const ranked = rankedThirdsMap.get(team.id)

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
                          onChange={() => !groupStageLocked && !isIneligible && toggleQualifier(team.id, group.id)}
                          disabled={isDisabled}
                          className="accent-primary"
                        />
                        <span className={isIneligible ? 'text-muted-foreground' : ''}>
                          {team.name} {getFlag(team.code)}
                        </span>
                        <span className="ml-auto flex items-center gap-1.5 shrink-0">
                          {ranked && hasAnyMatchData && (
                            <span className="text-xs text-muted-foreground">
                              {ranked.pts}pt{ranked.pts !== 1 ? 's' : ''} · {ranked.gd >= 0 ? '+' : ''}{ranked.gd}
                            </span>
                          )}
                          {ranked && hasAnyMatchData && (
                            ranked.borderline
                              ? <span className="text-xs text-amber-500 font-medium">⚠ #{ranked.rank}</span>
                              : ranked.qualifies
                                ? <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ #{ranked.rank}</span>
                                : <span className="text-xs text-muted-foreground/60">— #{ranked.rank}</span>
                          )}
                          {pos !== null && !ranked && (
                            <span className={`text-xs font-medium ${
                              pos === 3 ? 'text-amber-500' : 'text-muted-foreground/50'
                            }`}>
                              {pos === 1 ? t('position1') : pos === 2 ? t('position2') : pos === 3 ? `${t('position3')} ✓` : t('position4')}
                            </span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {groupStageLocked ? (
          <p className="text-sm text-destructive text-right">{t('standingsLocked')}</p>
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
    </>
  )
}
