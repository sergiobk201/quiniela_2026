'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Row = {
  rank: number
  userId: string
  displayName: string
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
  const [rows, setRows] = useState<Row[]>(initialRows)

  useEffect(() => {
    // createBrowserClient inside useEffect to avoid SSR pre-render failure
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
          // Re-fetch full leaderboard on any scores change
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
        No scores yet. Scores are computed after matches finish.
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
            <th className="px-4 py-2 text-left">Player</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">Pre-Tourn.</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">Groups</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">Knockout</th>
            <th className="px-4 py-2 text-right hidden md:table-cell">Rebuy</th>
            <th className="px-4 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className={`border-b last:border-0 ${
                row.isCurrentUser ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/30'
              }`}
            >
              <td className={`px-4 py-3 text-center font-bold ${medalColors[row.rank] ?? 'text-muted-foreground'}`}>
                {row.rank}
              </td>
              <td className="px-4 py-3">
                {row.displayName}
                {row.isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                {row.preTournament}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                {row.groupStage}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                {row.knockout}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                {row.rebuy}
              </td>
              <td className="px-4 py-3 text-right font-bold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
