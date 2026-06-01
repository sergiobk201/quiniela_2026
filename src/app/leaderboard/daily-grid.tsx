import { getTranslations } from 'next-intl/server'

export type DailyMatch = {
  matchId: number
  homeTeam: string  // e.g. "🇲🇽 MEX"
  awayTeam: string  // e.g. "🇿🇦 RSA"
  kickoff: string   // e.g. "15:00"
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

export default async function DailyGrid({ date, matches, players, predictions }: Props) {
  if (matches.length === 0) return null

  const t = await getTranslations('leaderboard')

  // Build lookup: userId → matchId → "H–A"
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
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[140px]">
                {t('player')}
              </th>
              {matches.map(m => (
                <th key={m.matchId} className="text-center py-2 px-3 font-medium min-w-[110px]">
                  <div className="text-xs whitespace-nowrap">{m.homeTeam} vs {m.awayTeam}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">{m.kickoff} UTC</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map(p => {
              const userPreds = predMap.get(p.userId)
              return (
                <tr key={p.userId} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-2 px-3 font-medium whitespace-nowrap">
                    {p.championFlag && <span className="mr-1">{p.championFlag}</span>}
                    {p.displayName}
                  </td>
                  {matches.map(m => {
                    const score = userPreds?.get(m.matchId)
                    return (
                      <td key={m.matchId} className="text-center py-2 px-3">
                        {score != null
                          ? <span className="font-mono text-sm">{score}</span>
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
    </div>
  )
}
