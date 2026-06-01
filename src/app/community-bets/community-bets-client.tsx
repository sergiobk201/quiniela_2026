'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitSuggestion, toggleVote } from './actions'
import { PHASES, DIFFICULTY_PTS, type Phase, type Difficulty, type EnrichedSuggestion } from './types'

interface Props {
  suggestions: EnrichedSuggestion[]
  deadlines: Record<string, string | null>
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy',   label: 'Easy · 1pt',    color: 'text-green-600 dark:text-green-400' },
  { value: 'medium', label: 'Medium · 2pts',  color: 'text-blue-600 dark:text-blue-400' },
  { value: 'hard',   label: 'Hard · 3pts',    color: 'text-orange-600 dark:text-orange-400' },
  { value: 'expert', label: 'Expert · 5pts',  color: 'text-red-600 dark:text-red-400' },
]

const DIFF_BADGE: Record<string, string> = {
  easy:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  hard:   'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function CommunityBetsClient({ suggestions, deadlines }: Props) {
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
    if (!dl) return 'No deadline'
    const d = new Date(dl)
    const fmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return d > now ? `Closes ${fmt}` : `Closed ${fmt}`
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
      if (error) { toast.error(error) } else { setNewText(''); toast.success('Suggestion submitted!') }
    })
  }

  return (
    <Tabs defaultValue={activePhase}>
      <TabsList className="flex-wrap h-auto gap-1">
        {PHASES.map(p => (
          <TabsTrigger key={p.key} value={p.key} className="text-xs sm:text-sm">
            {p.label}
            {!isOpen(p.key) && <span className="ml-1 opacity-40 text-xs">✓</span>}
          </TabsTrigger>
        ))}
      </TabsList>

      {PHASES.map(p => {
        const phaseSugs = [...suggestions.filter(s => s.phase === p.key)]
          .sort((a, b) => (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0))
        const open = isOpen(p.key)

        return (
          <TabsContent key={p.key} value={p.key} className="mt-4 space-y-4">
            <p className={`text-xs font-medium ${open ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {deadlineLabel(p.key)}
            </p>

            {phaseSugs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No suggestions yet. Be the first!</p>
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
                          {s.difficulty} · {DIFFICULTY_PTS[s.difficulty as Difficulty]}pts
                        </span>
                        <span className="text-xs text-muted-foreground">by {s.authorName}</span>
                        {s.status === 'selected' && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Selected</span>
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
                  <CardTitle className="text-sm">Submit a Suggestion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    placeholder="Describe the bet (max 200 chars)"
                    maxLength={200}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as Difficulty)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {DIFFICULTY_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <Button
                      onClick={() => handleSubmit(p.key)}
                      disabled={pendingSubmit || !newText.trim()}
                      size="sm"
                    >
                      {pendingSubmit ? 'Submitting…' : 'Submit'}
                    </Button>
                    <span className="text-xs text-muted-foreground">{newText.length}/200</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Top 3 voted suggestions get emailed to admin 2 days before {p.label} starts.
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
