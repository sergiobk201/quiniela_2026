import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, fetchAll } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { PHASES, PHASE_NEXT_STAGE, DIFFICULTY_PTS, type Phase, type Difficulty } from '@/app/community-bets/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const now = new Date()

  // Fetch earliest scheduled_at per stage (single query)
  const { data: stageMatches } = await admin
    .from('matches')
    .select('stage, scheduled_at')
    .in('stage', ['group', 'r32', 'r16', 'qf', 'sf', 'final'])
    .order('scheduled_at', { ascending: true })

  const earliestByStage: Record<string, Date> = {}
  for (const m of stageMatches ?? []) {
    if (!earliestByStage[m.stage]) earliestByStage[m.stage] = new Date(m.scheduled_at)
  }

  const emailsSent: string[] = []

  for (const p of PHASES) {
    const nextStage = PHASE_NEXT_STAGE[p.key]
    if (!nextStage || !earliestByStage[nextStage]) continue

    const deadline = new Date(earliestByStage[nextStage])
    deadline.setDate(deadline.getDate() - 2)

    if (deadline > now) continue // not yet reached

    // Check if email already sent for this phase
    const { data: existing } = await admin
      .from('audit_log')
      .select('id')
      .eq('action', 'bet_suggestions_email_sent')
      .eq('table_name', p.key)
      .maybeSingle()

    if (existing) continue // already sent

    // Fetch open suggestions + votes + profiles
    const [{ data: suggestions }, votes, { data: profiles }] = await Promise.all([
      admin.from('bet_suggestions')
        .select('id, suggestion, difficulty, user_id')
        .eq('phase', p.key)
        .eq('status', 'open'),
      // Paged: vote tally can exceed PostgREST's 1000-row cap — unbounded undercounts. See fetchAll().
      fetchAll<{ suggestion_id: number }>((from, to) =>
        admin.from('bet_suggestion_votes').select('suggestion_id').order('id', { ascending: true }).range(from, to)),
      admin.from('profiles').select('id, display_name'),
    ])

    const counts: Record<number, number> = {}
    for (const v of votes ?? []) counts[v.suggestion_id] = (counts[v.suggestion_id] ?? 0) + 1

    const profileMap = new Map((profiles ?? []).map(pr => [pr.id, pr.display_name]))

    const top3 = [...(suggestions ?? [])]
      .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
      .slice(0, 3)

    if (top3.length === 0) continue

    const rows = top3.map((s, i) => {
      const pts = DIFFICULTY_PTS[s.difficulty as Difficulty]
      return `<li style="margin-bottom:8px;">
        <strong>#${i + 1}</strong> · ${counts[s.id] ?? 0} votes ·
        <em>${s.difficulty}</em> (${pts}pts) ·
        &ldquo;${s.suggestion}&rdquo; —
        <span style="color:#6b7280;">by ${profileMap.get(s.user_id) ?? 'Unknown'}</span>
      </li>`
    }).join('')

    await resend.emails.send({
      from: 'Quiniela 2026 <noreply@quiniela2026.space>',
      to: process.env.ADMIN_NOTIFICATION_EMAIL!,
      subject: `⚽ Bet suggestions due — ${p.label} phase`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#10b981;">⚽ Community Bet Suggestions — ${p.label}</h2>
          <p>Top ${top3.length} voted suggestion${top3.length !== 1 ? 's' : ''} for the <strong>${p.label}</strong> phase (deadline: ${deadline.toDateString()}):</p>
          <ol style="padding-left:20px;line-height:1.8;font-size:0.9rem;">${rows}</ol>
          <p style="margin-top:20px;">
            <a href="https://www.quiniela2026.space/admin/suggestions"
               style="background:#10b981;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">
              View all suggestions →
            </a>
          </p>
        </div>
      `,
    })

    await admin.from('audit_log').insert({
      action: 'bet_suggestions_email_sent',
      table_name: p.key,
      new_value: { sent_at: now.toISOString(), top3_count: top3.length },
    })

    emailsSent.push(p.key)
  }

  return NextResponse.json({ ok: true, emailsSent })
}
