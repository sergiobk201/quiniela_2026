'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitSuggestion, toggleVote, saveCommunityBets, saveR32Bets } from './actions'
import { PHASES, DIFFICULTY_PTS, type Phase, type Difficulty, type EnrichedSuggestion } from './types'
import { getFlag } from '@/lib/teams/meta'

interface Props {
  suggestions: EnrichedSuggestion[]
  deadlines: Record<string, string | null>
  teams: { id: number; name: string; code: string }[]
  profiles: { id: string; display_name: string }[]
  communityBetsPick: {
    balon_de_oro: string | null
    revelacion_team_id: number | null
    decepcion_team_id: number | null
  }
  communityBetsLocked: boolean
  r32Pick: {
    usa_to_r16: boolean | null
    worst_predictor: string | null
    worst_ranked_team_id: number | null
  }
  r32BetsLocked: boolean
}

const DIFF_BADGE: Record<string, string> = {
  easy:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  hard:   'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const PHASE_LABEL_KEY: Record<Phase, string> = {
  pre_tournament: 'phasePreTournament',
  group:          'phaseGroup',
  r32:            'phaseR32',
  r16:            'phaseR16',
  qf:             'phaseQF',
  sf:             'phaseSF',
  final:          'phaseFinal',
}

const DIFF_LABEL_KEY: Record<Difficulty, string> = {
  easy:   'difficultyEasy',
  medium: 'difficultyMedium',
  hard:   'difficultyHard',
  expert: 'difficultyExpert',
}

export default function CommunityBetsClient({ suggestions, deadlines, teams, profiles, communityBetsPick, communityBetsLocked, r32Pick, r32BetsLocked }: Props) {
  const t = useTranslations('communityBets')
  const now = new Date()

  const [voteCounts, setVoteCounts] = useState<Record<number, number>>(
    Object.fromEntries(suggestions.map(s => [s.id, s.voteCount]))
  )
  const [myVotes, setMyVotes] = useState<Set<number>>(
    new Set(suggestions.filter(s => s.hasVoted).map(s => s.id))
  )
  const [newText, setNewText] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [, startVote] = useTransition()
  const [pendingSubmit, startSubmit] = useTransition()

  const [picks, setPicks] = useState({
    balon_de_oro:       communityBetsPick.balon_de_oro ?? '',
    revelacion_team_id: communityBetsPick.revelacion_team_id,
    decepcion_team_id:  communityBetsPick.decepcion_team_id,
  })
  const [pendingPicks, startPicksTransition] = useTransition()

  const [r32Picks, setR32Picks] = useState({
    usa_to_r16:          r32Pick.usa_to_r16,
    worst_predictor:     r32Pick.worst_predictor ?? '',
    worst_ranked_team_id: r32Pick.worst_ranked_team_id,
  })
  const [pendingR32, startR32] = useTransition()

  function handleSaveR32() {
    startR32(async () => {
      const { error } = await saveR32Bets({
        r32_usa_to_r16:           r32Picks.usa_to_r16,
        r32_worst_predictor:      r32Picks.worst_predictor.trim() || null,
        r32_worst_ranked_team_id: r32Picks.worst_ranked_team_id,
      })
      if (error) toast.error(error)
      else toast.success(t('r32PicksSaved'))
    })
  }

  function handleSavePicks() {
    startPicksTransition(async () => {
      const { error } = await saveCommunityBets({
        community_balon_de_oro:       picks.balon_de_oro.trim(),
        community_revelacion_team_id: picks.revelacion_team_id,
        community_decepcion_team_id:  picks.decepcion_team_id,
      })
      if (error) toast.error(error)
      else toast.success(t('picksSaved'))
    })
  }

  const activePhase = PHASES.find(p => {
    const dl = deadlines[p.key]
    return !dl || new Date(dl) > now
  })?.key ?? 'pre_tournament'

  function isOpen(phase: Phase): boolean {
    const dl = deadlines[phase]
    return !dl || new Date(dl) > now
  }

  function deadlineLabel(phase: Phase): string {
    const dl = deadlines[phase]
    if (!dl) return t('noDeadline')
    const d = new Date(dl)
    const fmt = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return d > now ? t('closesOn', { date: fmt }) : t('closedOn', { date: fmt })
  }

  function handleVote(id: number) {
    const had = myVotes.has(id)
    setMyVotes(prev => { const n = new Set(prev); had ? n.delete(id) : n.add(id); return n })
    setVoteCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (had ? -1 : 1)) }))
    startVote(async () => {
      const { error } = await toggleVote(id)
      if (error) {
        setMyVotes(prev => { const n = new Set(prev); had ? n.add(id) : n.delete(id); return n })
        setVoteCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (had ? 1 : -1)) }))
        toast.error(error)
      }
    })
  }

  function handleSubmit(phase: Phase) {
    startSubmit(async () => {
      const { error } = await submitSuggestion(phase, newText, difficulty)
      if (error) { toast.error(error) } else { setNewText(''); toast.success(t('submitted')) }
    })
  }

  return (
    <Tabs defaultValue={activePhase}>
      <TabsList className="flex-wrap h-auto gap-1">
        {PHASES.map(p => (
          <TabsTrigger key={p.key} value={p.key} className="text-xs sm:text-sm">
            {t(PHASE_LABEL_KEY[p.key] as any)}
            {!isOpen(p.key) && <span className="ml-1 opacity-40 text-xs">✓</span>}
          </TabsTrigger>
        ))}
      </TabsList>

      {PHASES.map(p => {
        const phaseSugs = [...suggestions.filter(s => s.phase === p.key)]
          .sort((a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0))
        const open = isOpen(p.key)
        const phaseLabel = t(PHASE_LABEL_KEY[p.key] as any)

        return (
          <TabsContent key={p.key} value={p.key} className="mt-4 space-y-4">
            <p className={`text-xs font-medium ${open ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {deadlineLabel(p.key)}
            </p>

            {p.key === 'r32' && (
              <Card className="border-[var(--champion-primary)]/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('r32PicksTitle')}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t('r32PicksSub')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>{t('r32UsaToR16')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE.medium}`}>
                          {t('difficultyMedium')} · 2pts
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={r32BetsLocked}
                          onClick={() => setR32Picks(prev => ({ ...prev, usa_to_r16: true }))}
                          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            r32Picks.usa_to_r16 === true
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-input hover:bg-muted'
                          }`}
                        >
                          {t('r32Yes')}
                        </button>
                        <button
                          type="button"
                          disabled={r32BetsLocked}
                          onClick={() => setR32Picks(prev => ({ ...prev, usa_to_r16: false }))}
                          className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            r32Picks.usa_to_r16 === false
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-input hover:bg-muted'
                          }`}
                        >
                          {t('r32No')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>{t('r32WorstPredictor')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE.medium}`}>
                          {t('difficultyMedium')} · 2pts
                        </span>
                      </label>
                      <select
                        value={r32Picks.worst_predictor}
                        onChange={e => setR32Picks(prev => ({ ...prev, worst_predictor: e.target.value }))}
                        disabled={r32BetsLocked}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('selectPlayer')}</option>
                        {profiles.map(pr => (
                          <option key={pr.id} value={pr.display_name ?? ''}>{pr.display_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>{t('r32WorstRanked')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE.hard}`}>
                          {t('difficultyHard')} · 3pts
                        </span>
                      </label>
                      <select
                        value={r32Picks.worst_ranked_team_id ?? ''}
                        onChange={e => setR32Picks(prev => ({ ...prev, worst_ranked_team_id: e.target.value ? Number(e.target.value) : null }))}
                        disabled={r32BetsLocked}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('selectTeam')}</option>
                        {teams.map(tm => (
                          <option key={tm.id} value={tm.id}>{tm.name} {getFlag(tm.code)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {r32BetsLocked ? (
                    <p className="text-sm text-destructive">{t('r32PicksLocked')}</p>
                  ) : (
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleSaveR32} disabled={pendingR32}>
                        {pendingR32 ? '…' : t('r32SavePicks')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Community bet picks — only shown on pre_tournament tab */}
            {p.key === 'pre_tournament' && (
              <Card className="border-[var(--champion-primary)]/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('picksTitle')}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t('picksSub')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Balón de Oro — Expert 5pts */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>{t('balonDeOro')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE.expert}`}>
                          {t('difficultyExpert')} · 5pts
                        </span>
                      </label>
                      <Input
                        value={picks.balon_de_oro}
                        onChange={e => setPicks(prev => ({ ...prev, balon_de_oro: e.target.value }))}
                        disabled={communityBetsLocked}
                        placeholder={t('playerNamePlaceholder')}
                        className="text-sm"
                      />
                    </div>

                    {/* Selección Revelación — Medium 2pts */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>{t('revelacion')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE.medium}`}>
                          {t('difficultyMedium')} · 2pts
                        </span>
                      </label>
                      <select
                        value={picks.revelacion_team_id ?? ''}
                        onChange={e => setPicks(prev => ({ ...prev, revelacion_team_id: e.target.value ? Number(e.target.value) : null }))}
                        disabled={communityBetsLocked}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('selectTeam')}</option>
                        {teams.map(tm => (
                          <option key={tm.id} value={tm.id}>{tm.name} {getFlag(tm.code)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Selección Decepción — Hard 3pts */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                        <span>{t('decepcion')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE.hard}`}>
                          {t('difficultyHard')} · 3pts
                        </span>
                      </label>
                      <select
                        value={picks.decepcion_team_id ?? ''}
                        onChange={e => setPicks(prev => ({ ...prev, decepcion_team_id: e.target.value ? Number(e.target.value) : null }))}
                        disabled={communityBetsLocked}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('selectTeam')}</option>
                        {teams.map(tm => (
                          <option key={tm.id} value={tm.id}>{tm.name} {getFlag(tm.code)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {communityBetsLocked ? (
                    <p className="text-sm text-destructive">{t('picksLocked')}</p>
                  ) : (
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleSavePicks} disabled={pendingPicks}>
                        {pendingPicks ? '…' : t('savePicks')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {phaseSugs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('noSuggestions')}</p>
            ) : (
              <div className="space-y-2">
                {phaseSugs.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      s.status === 'selected' ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/20' :
                      s.status === 'rejected' ? 'border-border opacity-40' :
                      'border-border hover:bg-muted/30'
                    }`}
                  >
                    <span className="text-xs text-muted-foreground w-4 shrink-0 mt-1">#{i + 1}</span>

                    <button
                      onClick={() => handleVote(s.id)}
                      className={`flex flex-col items-center gap-0.5 shrink-0 px-2 py-1 rounded-md transition-colors ${
                        myVotes.has(s.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-input hover:bg-muted'
                      }`}
                    >
                      <span className="text-xs leading-none">▲</span>
                      <span className="text-xs font-bold">{voteCounts[s.id] ?? 0}</span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{s.suggestion}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DIFF_BADGE[s.difficulty]}`}>
                          {t(DIFF_LABEL_KEY[s.difficulty as Difficulty] as any)} · {DIFFICULTY_PTS[s.difficulty as Difficulty]}pts
                        </span>
                        <span className="text-xs text-muted-foreground">{t('by')} {s.authorName}</span>
                        {s.status === 'selected' && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('selectedBadge')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {open && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('submitTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    placeholder={t('suggestionPlaceholder')}
                    maxLength={200}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as Difficulty)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(d => (
                        <option key={d} value={d}>
                          {t(DIFF_LABEL_KEY[d] as any)} · {DIFFICULTY_PTS[d]}pts
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={() => handleSubmit(p.key)}
                      disabled={pendingSubmit || !newText.trim()}
                      size="sm"
                    >
                      {pendingSubmit ? t('submitting') : t('submit')}
                    </Button>
                    <span className="text-xs text-muted-foreground">{t('charCount', { count: newText.length })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('voteHint', { phase: phaseLabel })}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
