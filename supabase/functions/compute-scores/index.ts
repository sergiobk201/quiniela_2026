import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  scoreMatch,
  scoreGroupStanding,
  scoreThirdPlaceQualifiers,
  computeActualGroupStandings,
} from './scoring.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRE_TOURNAMENT_PTS = {
  champion: 15,
  runnerUp: 10,
  thirdPlace: 7,
  goldenBoot: 5,
  goldenGlove: 5,
  kopa: 5,
  totalGoalsExact: 10,
  totalGoalsClose: 5,   // within ±5
  firstEliminated: 5,
  mostYellows: 5,
  communityBalonDeOro: 5,  // Expert
  communityRevelacion: 2,  // Medium
  communityDecepcion: 3,   // Hard
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey)
  const body = await req.json().catch(() => ({}))
  const type: string = body.type ?? 'all'

  try {
    // ── Load base data ────────────────────────────────────────────────────────
    const [
      { data: profiles },
      { data: finishedMatches },
      { data: matchPreds },
      { data: groupPreds },
      { data: qualifierPreds },
      { data: prePreds },
      { data: rebuys },
      { data: tournamentResults },
    ] = await Promise.all([
      supabase.from('profiles').select('id'),
      supabase
        .from('matches')
        .select('id, stage, group_id, home_team_id, away_team_id, stage_multiplier, home_score, away_score, upset')
        .eq('status', 'finished')
        .not('home_score', 'is', null),
      supabase.from('match_predictions').select('user_id, match_id, predicted_home_score, predicted_away_score'),
      supabase.from('group_standing_predictions').select('user_id, group_id, predicted_1st, predicted_2nd, predicted_3rd, predicted_4th'),
      supabase.from('third_place_qualifier_predictions').select('user_id, team_ids'),
      supabase.from('pre_tournament_predictions').select('*'),
      supabase.from('champion_rebuys').select('user_id, team_id, points_available, submitted_at').not('submitted_at', 'is', null),
      supabase.from('tournament_results').select('*').maybeSingle(),
    ])

    const userIds = (profiles ?? []).map((p) => p.id)

    // Index match predictions by userId → matchId → result
    const matchPredMap = new Map<string, Map<number, { home: number; away: number }>>()
    for (const p of matchPreds ?? []) {
      if (!matchPredMap.has(p.user_id)) matchPredMap.set(p.user_id, new Map())
      matchPredMap.get(p.user_id)!.set(p.match_id, { home: p.predicted_home_score, away: p.predicted_away_score })
    }

    // ── Match points ─────────────────────────────────────────────────────────
    const groupMatchPts = new Map<string, number>()
    const knockoutPts   = new Map<string, number>()

    if (type === 'all' || type === 'matches') {
      for (const match of finishedMatches ?? []) {
        const actual = { home: match.home_score!, away: match.away_score! }
        const isGroup = match.stage === 'group'
        for (const uid of userIds) {
          const pred = matchPredMap.get(uid)?.get(match.id) ?? { home: 0, away: 0 }
          const pts  = scoreMatch(pred, actual, match.stage_multiplier, match.upset ?? false)
          if (isGroup) groupMatchPts.set(uid, (groupMatchPts.get(uid) ?? 0) + pts)
          else         knockoutPts.set(uid,   (knockoutPts.get(uid)   ?? 0) + pts)
        }
      }
    }

    // ── Group standings + 3rd-place qualifier points → pre_tournament_points ─
    const preTournamentPts = new Map<string, number>()

    if (type === 'all' || type === 'standings') {
      const groupMatches = (finishedMatches ?? []).filter((m) => m.stage === 'group')
      const actualStandings = computeActualGroupStandings(groupMatches)

      // Only score a group once all 6 matches are finished
      const finishedCountByGroup = new Map<number, number>()
      for (const m of groupMatches) {
        if (m.group_id) finishedCountByGroup.set(m.group_id, (finishedCountByGroup.get(m.group_id) ?? 0) + 1)
      }

      // Group standing predictions
      for (const pred of groupPreds ?? []) {
        const actual = actualStandings.get(pred.group_id)
        if (!actual || actual.length < 4) continue
        if ((finishedCountByGroup.get(pred.group_id) ?? 0) < 6) continue
        const pts = scoreGroupStanding(
          [pred.predicted_1st, pred.predicted_2nd, pred.predicted_3rd, pred.predicted_4th],
          actual
        )
        preTournamentPts.set(pred.user_id, (preTournamentPts.get(pred.user_id) ?? 0) + pts)
      }

      // 3rd-place qualifier predictions
      const adminQualifiers: number[] | null = tournamentResults?.third_place_qualifier_ids ?? null
      const actualQualifiers = adminQualifiers
        ? new Set<number>(adminQualifiers)
        : (() => {
            // Derive from standings: take 3rd-place team from each group
            const thirdPlaceIds = [...actualStandings.values()].map((r) => r[2]).filter(Boolean) as number[]
            return new Set<number>(thirdPlaceIds.slice(0, 8)) // best 8 by insertion order (limited)
          })()

      if (actualQualifiers.size === 8) {
        for (const pred of qualifierPreds ?? []) {
          const pts = scoreThirdPlaceQualifiers(pred.team_ids as number[], actualQualifiers)
          preTournamentPts.set(pred.user_id, (preTournamentPts.get(pred.user_id) ?? 0) + pts)
        }
      }
    }

    // ── Pre-tournament trophy + awards → pre_tournament_points ───────────────
    if ((type === 'all' || type === 'pre-tournament') && tournamentResults) {
      const tr = tournamentResults
      for (const pred of prePreds ?? []) {
        let pts = 0
        if (tr.champion_team_id       && pred.champion_team_id        === tr.champion_team_id)    pts += PRE_TOURNAMENT_PTS.champion
        if (tr.runner_up_team_id      && pred.runner_up_team_id       === tr.runner_up_team_id)   pts += PRE_TOURNAMENT_PTS.runnerUp
        if (tr.third_place_team_id    && pred.third_place_team_id     === tr.third_place_team_id) pts += PRE_TOURNAMENT_PTS.thirdPlace
        if (tr.golden_boot_player     && pred.golden_boot_player?.toLowerCase()  === tr.golden_boot_player?.toLowerCase())  pts += PRE_TOURNAMENT_PTS.goldenBoot
        if (tr.golden_glove_player    && pred.golden_glove_player?.toLowerCase() === tr.golden_glove_player?.toLowerCase()) pts += PRE_TOURNAMENT_PTS.goldenGlove
        if (tr.kopa_player            && pred.kopa_player?.toLowerCase()         === tr.kopa_player?.toLowerCase())         pts += PRE_TOURNAMENT_PTS.kopa
        if (tr.first_eliminated_team_id && pred.first_eliminated_team_id === tr.first_eliminated_team_id) pts += PRE_TOURNAMENT_PTS.firstEliminated
        if (tr.most_yellows_team_id   && pred.most_yellows_team_id     === tr.most_yellows_team_id)   pts += PRE_TOURNAMENT_PTS.mostYellows
        if (tr.total_goals != null && pred.total_goals_prediction != null) {
          const diff = Math.abs(pred.total_goals_prediction - tr.total_goals)
          if (diff === 0)     pts += PRE_TOURNAMENT_PTS.totalGoalsExact
          else if (diff <= 5) pts += PRE_TOURNAMENT_PTS.totalGoalsClose
        }
        if (tr.community_balon_de_oro && pred.community_balon_de_oro?.toLowerCase() === tr.community_balon_de_oro?.toLowerCase()) pts += PRE_TOURNAMENT_PTS.communityBalonDeOro
        if (tr.community_revelacion_team_id && pred.community_revelacion_team_id === tr.community_revelacion_team_id) pts += PRE_TOURNAMENT_PTS.communityRevelacion
        if (tr.community_decepcion_team_id  && pred.community_decepcion_team_id  === tr.community_decepcion_team_id)  pts += PRE_TOURNAMENT_PTS.communityDecepcion
        preTournamentPts.set(pred.user_id, (preTournamentPts.get(pred.user_id) ?? 0) + pts)
      }
    }

    // ── Rebuy points ─────────────────────────────────────────────────────────
    const rebuyPts = new Map<string, number>()

    if ((type === 'all' || type === 'rebuy') && tournamentResults?.champion_team_id) {
      for (const r of rebuys ?? []) {
        if (r.team_id === tournamentResults.champion_team_id) {
          rebuyPts.set(r.user_id, r.points_available)
        }
      }
    }

    // ── Build upsert rows ─────────────────────────────────────────────────────
    const now = new Date().toISOString()
    const rows = userIds.map((uid) => {
      const pre      = preTournamentPts.get(uid) ?? 0
      const group    = groupMatchPts.get(uid)    ?? 0
      const knockout = knockoutPts.get(uid)      ?? 0
      const rebuy    = rebuyPts.get(uid)         ?? 0
      return {
        user_id: uid,
        pre_tournament_points: pre,
        group_stage_points:    group,
        knockout_points:       knockout,
        rebuy_points:          rebuy,
        total_points:          pre + group + knockout + rebuy,
        last_computed_at:      now,
      }
    })

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, usersUpdated: 0, type, warning: 'No profiles found — create user profiles first' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase
      .from('scores')
      .upsert(rows, { onConflict: 'user_id' })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, usersUpdated: rows.length, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
