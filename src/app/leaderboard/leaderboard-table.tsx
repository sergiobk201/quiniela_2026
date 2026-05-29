'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@supabase/ssr'

type Row = {
  rank: number
  userId: string
  displayName: string
  championFlag?: string | null
  preTournament: number
  groupStage: number
  knockout: number
  rebuy: number
  total: number
  isCurrentUser: boolean
}

interface Props {
  initialRows: Row[]
  currentUserId: string
}

export default function LeaderboardTable({ initialRows, currentUserId }: Props) {
  const t = useTranslations('leaderboard')
  const [rows, setRows] = useState<Row[]>(initialRows)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('leaderboard-scores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        async () => {
          const { data } = await supabase
            .from('scores')
            .select('user_id, pre_tournament_points, group_stage_points, knockout_points, rebuy_points, total_points, profile:profiles(display_name)')
            .order('total_points', { ascending: false })

          if (!data) return
          setRows(
            data.map((s, i) => ({
              rank: i + 1,
              userId: s.user_id,
              displayName: (s.profile as unknown as { display_name: string } | null)?.display_name ?? 'Unknown',
              preTournament: s.pre_tournament_points ?? 0,
              groupStage: s.group_stage_points ?? 0,
              knockout: s.knockout_points ?? 0,
              rebuy: s.rebuy_points ?? 0,
              total: s.total_points ?? 0,
              isCurrentUser: s.user_id === currentUserId,
            }))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  if (rows.length === 0) {
    return (
      <div className="border rounded-md py-12 text-center text-muted-foreground text-sm">
        {t('noScores')}
      </div>
    )
  }

  const medalColors: Record<number, string> = {
    1: 'text-yellow-500',
    2: 'text-slate-400',
    3: 'text-amber-600',
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
            <th className="px-4 py-2 text-center w-10">#</th>
            <th className="px-4 py-2 text-left">{t('player')}</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">{t('preTournament')}</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">{t('groupStage')}</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">{t('knockout')}</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">{t('rebuy')}</th>
            <th className="px-4 py-2 text-right font-semibold">{t('total')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className={`border-b last:border-0 ${
                row.isCurrentUser ? 'font-semibold' : 'hover:bg-muted/30'
              }`}
              style={row.isCurrentUser ? {
                backgroundColor: 'color-mix(in oklch, var(--champion-primary) 10%, transparent)',
                borderLeft: '3px solid var(--champion-primary)',
              } : undefined}
            >
              <td className={`px-4 py-3 text-center font-bold ${medalColors[row.rank] ?? 'text-muted-foreground'}`}>
                {row.rank}
              </td>
              <td className="px-4 py-3">
                {row.championFlag && <span className="mr-1.5">{row.championFlag}</span>}
                {row.displayName}
                {row.isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">{t('you')}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">{row.preTournament}</td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">{row.groupStage}</td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">{row.knockout}</td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">{row.rebuy}</td>
              <td className="px-4 py-3 text-right font-bold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
