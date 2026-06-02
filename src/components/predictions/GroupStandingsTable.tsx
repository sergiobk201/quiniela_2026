import { getFlag } from '@/lib/teams/meta'
import type { StandingsRow } from '@/lib/scoring/group-standings'

interface Props {
  standings: StandingsRow[]
}

const ROW_COLOR: Record<number, string> = {
  1: 'bg-green-50/60 dark:bg-green-950/20',
  2: 'bg-green-50/60 dark:bg-green-950/20',
  3: 'bg-amber-50/60 dark:bg-amber-950/20',
  4: 'opacity-50',
}

const RANK_BADGE: Record<number, string> = {
  1: 'text-green-600 dark:text-green-400',
  2: 'text-green-600 dark:text-green-400',
  3: 'text-amber-600 dark:text-amber-400',
  4: 'text-muted-foreground',
}

export default function GroupStandingsTable({ standings }: Props) {
  return (
    <div className="mt-3 border rounded-md overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50 text-muted-foreground border-b">
            <th className="px-2 py-1.5 text-left w-5">#</th>
            <th className="px-2 py-1.5 text-left">Team</th>
            <th className="px-2 py-1.5 text-center">P</th>
            <th className="px-2 py-1.5 text-center">W</th>
            <th className="px-2 py-1.5 text-center">D</th>
            <th className="px-2 py-1.5 text-center">L</th>
            <th className="px-2 py-1.5 text-center">GF</th>
            <th className="px-2 py-1.5 text-center">GA</th>
            <th className="px-2 py-1.5 text-center">GD</th>
            <th className="px-2 py-1.5 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map(row => (
            <tr key={row.teamId} className={`border-b last:border-0 ${ROW_COLOR[row.rank] ?? ''}`}>
              <td className={`px-2 py-1.5 font-bold ${RANK_BADGE[row.rank] ?? ''}`}>{row.rank}</td>
              <td className="px-2 py-1.5 font-medium whitespace-nowrap">
                {getFlag(row.teamCode)} {row.teamCode}
              </td>
              <td className="px-2 py-1.5 text-center text-muted-foreground">{row.p}</td>
              <td className="px-2 py-1.5 text-center">{row.w}</td>
              <td className="px-2 py-1.5 text-center">{row.d}</td>
              <td className="px-2 py-1.5 text-center">{row.l}</td>
              <td className="px-2 py-1.5 text-center">{row.gf}</td>
              <td className="px-2 py-1.5 text-center">{row.ga}</td>
              <td className="px-2 py-1.5 text-center">{row.gd >= 0 ? `+${row.gd}` : row.gd}</td>
              <td className="px-2 py-1.5 text-center font-bold">{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
