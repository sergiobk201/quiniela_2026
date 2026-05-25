import { createAdminClient } from '@/lib/supabase/admin'
import { LockCard } from './lock-card'
import {
  lockStage,
  unlockStage,
  lockPreTournament,
  unlockPreTournament,
} from './actions'

export const dynamic = 'force-dynamic'

const STAGES = [
  { key: 'group', label: 'Group Stage' },
  { key: 'r32',   label: 'Round of 32' },
  { key: 'r16',   label: 'Round of 16' },
  { key: 'qf',    label: 'Quarter-Finals' },
  { key: 'sf',    label: 'Semi-Finals' },
  { key: '3rd',   label: 'Third Place' },
  { key: 'final', label: 'Final' },
] as const

async function getLockData() {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const [{ data: matches }, { data: preLocked }] = await Promise.all([
    admin.from('matches').select('stage, locked_at'),
    admin
      .from('pre_tournament_predictions')
      .select('id', { count: 'exact', head: false })
      .eq('locked', true),
  ])

  const stageStats = STAGES.map(({ key, label }) => {
    const stageMatches = matches?.filter((m) => m.stage === key) ?? []
    const lockedCount = stageMatches.filter((m) => m.locked_at < now).length
    return { key, label, total: stageMatches.length, locked: lockedCount }
  })

  return { stageStats, preLockedCount: preLocked?.length ?? 0 }
}

export default async function LocksPage() {
  const { stageStats, preLockedCount } = await getLockData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Locks</h1>
        <p className="text-sm text-muted-foreground">
          Control when prediction windows close. Locking is immediate and irreversible without a reset.
        </p>
      </div>

      {/* Pre-tournament */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pre-Tournament
        </h2>
        <LockCard
          label="Pre-Tournament Predictions"
          total={preLockedCount}
          locked={preLockedCount}
          onLock={lockPreTournament}
          onUnlock={unlockPreTournament}
          isPreTournament
        />
      </div>

      {/* Match stages */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Match Stages
        </h2>
        <div className="space-y-2">
          {stageStats.map(({ key, label, total, locked }) => (
            <LockCard
              key={key}
              label={label}
              total={total}
              locked={locked}
              onLock={lockStage.bind(null, key)}
              onUnlock={unlockStage.bind(null, key)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
