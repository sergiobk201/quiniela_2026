export type GroupMatch = {
  id: number
  home_team: { id: number; name: string; code: string }
  away_team: { id: number; name: string; code: string }
}

export type StandingsRow = {
  teamId:   number
  teamCode: string
  teamName: string
  rank:     number
  pts:      number
  p:        number
  w:        number
  d:        number
  l:        number
  gf:       number
  ga:       number
  gd:       number
}

export type RankedThirdPlace = {
  teamId:     number
  teamCode:   string
  teamName:   string
  groupId:    number
  rank:       number  // 1–12 among all 3rd-place teams
  pts:        number
  gd:         number
  gf:         number
  qualifies:  boolean  // rank <= 8
  borderline: boolean  // tied at the 8/9 cutoff
}

export function rankThirdPlaceTeams(
  groupIds: number[],
  computedByGroup: Record<number, StandingsRow[]>
): RankedThirdPlace[] {
  const thirds: (StandingsRow & { groupId: number })[] = []
  for (const gid of groupIds) {
    const rows = computedByGroup[gid]
    const third = rows?.find(r => r.rank === 3)
    if (third) thirds.push({ ...third, groupId: gid })
  }

  const sorted = thirds.sort((a, b) =>
    b.pts - a.pts ||
    b.gd  - a.gd  ||
    b.gf  - a.gf  ||
    a.teamName.localeCompare(b.teamName)
  )

  // Detect tie at the 8/9 boundary
  const at8 = sorted[7]
  const at9 = sorted[8]
  const tiedAtCutoff = at8 && at9 &&
    at8.pts === at9.pts &&
    at8.gd  === at9.gd  &&
    at8.gf  === at9.gf

  return sorted.map((row, i) => {
    const rank = i + 1
    return {
      teamId:     row.teamId,
      teamCode:   row.teamCode,
      teamName:   row.teamName,
      groupId:    row.groupId,
      rank,
      pts:        row.pts,
      gd:         row.gd,
      gf:         row.gf,
      qualifies:  rank <= 8,
      borderline: !!tiedAtCutoff && (rank === 8 || rank === 9),
    }
  })
}

export function computeGroupStandings(
  groupMatches: GroupMatch[],
  scores: Record<number, { home: string; away: string }>
): StandingsRow[] {
  const stats: Record<number, Omit<StandingsRow, 'rank'>> = {}

  function ensure(team: { id: number; name: string; code: string }) {
    if (!stats[team.id]) {
      stats[team.id] = { teamId: team.id, teamCode: team.code, teamName: team.name, pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0 }
    }
  }

  for (const m of groupMatches) {
    ensure(m.home_team)
    ensure(m.away_team)

    const s = scores[m.id]
    const hg = s?.home !== '' && s?.home !== undefined ? Number(s.home) : 0
    const ag = s?.away !== '' && s?.away !== undefined ? Number(s.away) : 0

    const ht = stats[m.home_team.id]
    const at = stats[m.away_team.id]

    ht.p++; at.p++
    ht.gf += hg; ht.ga += ag; ht.gd += hg - ag
    at.gf += ag; at.ga += hg; at.gd += ag - hg

    if (hg > ag)      { ht.w++; ht.pts += 3; at.l++ }
    else if (hg < ag) { at.w++; at.pts += 3; ht.l++ }
    else              { ht.d++; ht.pts++; at.d++; at.pts++ }
  }

  return Object.values(stats)
    .sort((a, b) =>
      b.pts - a.pts ||
      b.gd  - a.gd  ||
      b.gf  - a.gf  ||
      a.teamName.localeCompare(b.teamName)
    )
    .map((row, i) => ({ ...row, rank: i + 1 }))
}
