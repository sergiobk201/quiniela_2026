import { getTranslations } from 'next-intl/server'
import { getFlag } from '@/lib/teams/meta'
import { LocalTime } from '@/components/ui/local-time'

export type DailyMatch = {
  matchId: number
  homeCode: string | null
  awayCode: string | null
  kickoff: string  // ISO datetime string
}

export type DailyPlayer = {
  userId: string
  displayName: string
  championFlag: string | null
}

export type DailyPrediction = {
  userId: string
  matchId: number
  home: number
  away: number
}

interface Props {
  date: string
  matches: DailyMatch[]
  players: DailyPlayer[]
  predictions: DailyPrediction[]
}

function matchLabel(code: string | null): string {
  return code ? `${getFlag(code)} ${code}` : 'TBD'
}

export default async function DailyGrid({ date, matches, players, predictions }: Props) {
  if (matches.length === 0) return null

  const t = await getTranslations('leaderboard')

  const predMap = new Map<string, Map<number, string>>()
  for (const p of predictions) {
    if (!predMap.has(p.userId)) predMap.set(p.userId, new Map())
    predMap.get(p.userId)!.set(p.matchId, `${p.home}–${p.away}`)
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">{t('dailyTitle')} · {date}</h2>
        <p className="text-xs text-muted-foreground">{t('dailySubtitle')}</p>
      </div>

      {/* Desktop: sticky-player-col table, compact headers */}
      <div className="hidden md:block overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="sticky left-0 z-10 bg-background text-left py-2 px-3 font-medium text-muted-foreground min-w-[140px] border-r border-border/60">
                {t('player')}
              </th>
              {matches.map(m => (
                <th key={m.matchId} className="text-center py-2 px-3 font-medium min-w-[90px]">
                  <div className="text-xs font-mono whitespace-nowrap">
                    {m.homeCode ?? 'TBD'}–{m.awayCode ?? 'TBD'}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal"><LocalTime iso={m.kickoff} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map(p => {
              const userPreds = predMap.get(p.userId)
              return (
                <tr key={p.userId} className="group border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="sticky left-0 z-10 bg-background group-hover:bg-muted/20 transition-colors py-2 px-3 font-medium whitespace-nowrap border-r border-border/40">
                    {p.championFlag && <span className="mr-1">{p.championFlag}</span>}
                    {p.displayName}
                  </td>
                  {matches.map(m => {
                    const score = userPreds?.get(m.matchId)
                    return (
                      <td key={m.matchId} className="text-center py-2 px-3">
                        {score != null
                          ? <span className="font-mono">{score}</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per match, all players stacked inside */}
      <div className="md:hidden space-y-3">
        {matches.map(m => (
          <div key={m.matchId} className="rounded-md border border-border overflow-hidden">
            <div className="bg-muted/30 px-3 py-2 text-xs font-semibold flex items-center gap-1.5">
              <span>{matchLabel(m.homeCode)}</span>
              <span className="text-muted-foreground font-normal">vs</span>
              <span>{matchLabel(m.awayCode)}</span>
              <span className="text-muted-foreground font-normal ml-auto"><LocalTime iso={m.kickoff} /></span>
            </div>
            <div className="divide-y divide-border/40">
              {players.map(p => {
                const score = predMap.get(p.userId)?.get(m.matchId)
                return (
                  <div key={p.userId} className="flex items-center justify-between px-3 py-1.5 text-sm">
                    <span className="text-muted-foreground">
                      {p.championFlag && <span className="mr-1">{p.championFlag}</span>}
                      {p.displayName}
                    </span>
                    {score != null
                      ? <span className="font-mono font-medium">{score}</span>
                      : <span className="text-muted-foreground text-xs">—</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
