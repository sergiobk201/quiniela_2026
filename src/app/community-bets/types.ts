export type Phase = 'pre_tournament' | 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export const PHASES: { key: Phase; label: string }[] = [
  { key: 'pre_tournament', label: 'Pre-Tournament' },
  { key: 'group',          label: 'Group Stage' },
  { key: 'r32',            label: 'Round of 32' },
  { key: 'r16',            label: 'Round of 16' },
  { key: 'qf',             label: 'Quarter-Finals' },
  { key: 'sf',             label: 'Semi-Finals' },
  { key: 'final',          label: 'Final' },
]

export const DIFFICULTY_PTS: Record<Difficulty, number> = {
  easy: 1, medium: 2, hard: 3, expert: 5,
}

export const PHASE_NEXT_STAGE: Partial<Record<Phase, string>> = {
  pre_tournament: 'group',
  group:          'r32',
  r32:            'r16',
  r16:            'qf',
  qf:             'sf',
  sf:             'final',
}

export type EnrichedSuggestion = {
  id: number
  phase: Phase
  user_id: string
  suggestion: string
  difficulty: Difficulty
  status: string
  created_at: string
  voteCount: number
  hasVoted: boolean
  authorName: string
}
